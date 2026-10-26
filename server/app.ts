import express, { NextFunction, Request, Response } from "express";
import path from "node:path";
import { Db } from "./db";
import { authenticate, issueToken, loginSchema, requireRole } from "./auth";
import { createEventSchema, updateEventSchema, belowBaseline, formatZodError } from "./validation";
import { audit, columnsFor, getEvent, listAudit, listEvents, summary } from "./repo";
import { costCenterFor } from "./costCenters";
import { log } from "./log";

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

export function createApp(db: Db, opts: { staticDir?: string } = {}) {
  const app = express();
  app.use(express.json({ limit: "32kb" }));

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      if (!req.path.startsWith("/api")) return;
      log(res.statusCode >= 500 ? "error" : "info", "request", {
        method: req.method,
        route: req.route ? `${req.baseUrl}${req.route.path}` : req.path,
        path: req.originalUrl,
        status: res.statusCode,
        duration_ms: Date.now() - start,
        user: req.user?.name,
        role: req.user?.role,
      });
    });
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/login", (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }
    res.json({ token: issueToken(parsed.data), user: parsed.data });
  });

  const api = express.Router();
  api.use(authenticate);

  api.get("/events", wrap(async (_req, res) => {
    res.json(await listEvents(db));
  }));

  api.get("/summary", wrap(async (_req, res) => {
    res.json(await summary(db));
  }));

  api.post("/events", requireRole("sourcing_manager"), wrap(async (req, res) => {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }
    const e = parsed.data;
    const [row] = await db("events")
      .insert({
        supplier: e.supplier,
        category: e.category,
        baseline_price: e.baselinePrice,
        negotiated_price: e.negotiatedPrice,
        date: e.date,
        status: "pending",
        created_by: req.user!.name,
      })
      .returning("id");
    const id = typeof row === "object" ? row.id : row;
    await audit(db, req.user!, "event.created", id, `${e.supplier} ${e.category} savings ${e.baselinePrice - e.negotiatedPrice}`);
    res.status(201).json(await getEvent(db, id));
  }));

  api.patch("/events/:id", requireRole("sourcing_manager", "finance_approver"), wrap(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await getEvent(db, id);
    if (!existing) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }
    if (req.user!.role === "sourcing_manager" && existing.createdBy !== req.user!.name) {
      res.status(403).json({ error: "You can only edit events you created" });
      return;
    }
    if (existing.status === "approved") {
      res.status(409).json({ error: "Approved events are locked" });
      return;
    }
    if (!belowBaseline({ ...existing, ...parsed.data })) {
      res.status(400).json({ error: "negotiatedPrice: Negotiated price must be below baseline price" });
      return;
    }
    await db("events").where({ id }).update(columnsFor(parsed.data));
    await audit(db, req.user!, "event.updated", id, JSON.stringify(parsed.data));
    res.json(await getEvent(db, id));
  }));

  api.post("/events/:id/approve", requireRole("finance_approver"), wrap(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await getEvent(db, id);
    if (!existing) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    if (existing.status === "approved") {
      res.status(409).json({ error: "Event already approved" });
      return;
    }
    const costCenter = costCenterFor(existing.category);
    await db("events").where({ id }).update({ status: "approved", approved_by: req.user!.name, cost_center: costCenter });
    await audit(db, req.user!, "event.approved", id, `booked to ${costCenter}`);
    res.json(await getEvent(db, id));
  }));

  api.get("/audit", requireRole("finance_approver", "sourcing_manager"), wrap(async (_req, res) => {
    res.json(await listAudit(db));
  }));

  app.use("/api", api);

  if (opts.staticDir) {
    app.use(express.static(opts.staticDir));
    app.get("*", (_req, res) => res.sendFile(path.join(opts.staticDir!, "index.html")));
  }

  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    log("error", err.message, { method: req.method, path: req.originalUrl, error: err.name, stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
