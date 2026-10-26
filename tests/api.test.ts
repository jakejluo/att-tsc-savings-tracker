import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bearer, setup, validEvent } from "./helpers";

let ctx: Awaited<ReturnType<typeof setup>>;
beforeEach(async () => (ctx = await setup()));
afterEach(async () => ctx.db.destroy());

describe("events API", () => {
  it("lists the 100 seeded synthetic events", async () => {
    const res = await request(ctx.app).get("/api/events").set(bearer(ctx.finance));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(100);
  });

  it("creates an event as pending and owned by the caller", async () => {
    const res = await request(ctx.app).post("/api/events").set(bearer(ctx.manager)).send(validEvent);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: "pending", createdBy: "sam.rivera", approvedBy: null });
  });

  it("rejects a negotiated price at or above baseline", async () => {
    const res = await request(ctx.app)
      .post("/api/events")
      .set(bearer(ctx.manager))
      .send({ ...validEvent, negotiatedPrice: 50000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/below baseline/);
  });

  it.each([
    ["missing supplier", { supplier: "" }],
    ["unknown category", { category: "Snacks" }],
    ["negative price", { baselinePrice: -5 }],
    ["bad date", { date: "15/09/2026" }],
    ["future date", { date: "2099-01-01" }],
  ])("rejects %s", async (_name, patch) => {
    const res = await request(ctx.app)
      .post("/api/events")
      .set(bearer(ctx.manager))
      .send({ ...validEvent, ...patch });
    expect(res.status).toBe(400);
  });

  it("counts only approved savings in the dashboard total", async () => {
    const before = (await request(ctx.app).get("/api/summary").set(bearer(ctx.finance))).body;
    const created = (await request(ctx.app).post("/api/events").set(bearer(ctx.manager)).send(validEvent)).body;

    const pending = (await request(ctx.app).get("/api/summary").set(bearer(ctx.finance))).body;
    expect(pending.approvedTotal).toBe(before.approvedTotal);
    expect(pending.pendingTotal).toBe(before.pendingTotal + 8000);

    await request(ctx.app).post(`/api/events/${created.id}/approve`).set(bearer(ctx.finance));
    const after = (await request(ctx.app).get("/api/summary").set(bearer(ctx.finance))).body;
    expect(after.approvedTotal).toBe(before.approvedTotal + 8000);
  });

  it("books approvals to the category cost center", async () => {
    const created = (await request(ctx.app).post("/api/events").set(bearer(ctx.manager)).send(validEvent)).body;
    const res = await request(ctx.app).post(`/api/events/${created.id}/approve`).set(bearer(ctx.finance));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "approved", approvedBy: "alex.chen", costCenter: "CC-4100-NET" });
  });

  it("writes an audit entry with actor, action and timestamp", async () => {
    const created = (await request(ctx.app).post("/api/events").set(bearer(ctx.manager)).send(validEvent)).body;
    await request(ctx.app).post(`/api/events/${created.id}/approve`).set(bearer(ctx.finance));
    const audit = (await request(ctx.app).get("/api/audit").set(bearer(ctx.finance))).body;
    expect(audit.slice(0, 2)).toMatchObject([
      { actor: "alex.chen", role: "finance_approver", action: "event.approved", eventId: created.id },
      { actor: "sam.rivera", role: "sourcing_manager", action: "event.created", eventId: created.id },
    ]);
    expect(Date.parse(audit[0].at)).not.toBeNaN();
  });
});
