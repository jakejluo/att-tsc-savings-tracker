import { Db } from "./db";
import { AuditEntry, Category, Role, SavingsEvent, Summary, CATEGORIES } from "../shared/types";

type Row = Record<string, unknown>;

export const toEvent = (r: Row): SavingsEvent => ({
  id: Number(r.id),
  supplier: String(r.supplier),
  category: r.category as Category,
  baselinePrice: Number(r.baseline_price),
  negotiatedPrice: Number(r.negotiated_price),
  date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
  status: r.status as SavingsEvent["status"],
  createdBy: String(r.created_by),
  approvedBy: (r.approved_by as string) ?? null,
  costCenter: (r.cost_center as string) ?? null,
});

const toAudit = (r: Row): AuditEntry => ({
  id: Number(r.id),
  at: String(r.at),
  actor: String(r.actor),
  role: r.role as Role,
  action: String(r.action),
  eventId: r.event_id == null ? null : Number(r.event_id),
  detail: String(r.detail),
});

export const columnsFor = (patch: Partial<SavingsEvent>): Row => {
  const map: Record<string, string> = {
    supplier: "supplier",
    category: "category",
    baselinePrice: "baseline_price",
    negotiatedPrice: "negotiated_price",
    date: "date",
    status: "status",
    approvedBy: "approved_by",
    costCenter: "cost_center",
  };
  return Object.fromEntries(
    Object.entries(patch).filter(([k]) => k in map).map(([k, v]) => [map[k], v]),
  );
};

export async function listEvents(db: Db) {
  return (await db("events").orderBy([{ column: "date", order: "desc" }, { column: "id", order: "desc" }])).map(toEvent);
}

export async function getEvent(db: Db, id: number) {
  const row = await db("events").where({ id }).first();
  return row ? toEvent(row) : undefined;
}

export async function audit(db: Db, actor: { name: string; role: Role }, action: string, eventId: number | null, detail = "") {
  await db("audit_log").insert({
    at: new Date().toISOString(),
    actor: actor.name,
    role: actor.role,
    action,
    event_id: eventId,
    detail,
  });
}

export async function listAudit(db: Db, limit = 200) {
  return (await db("audit_log").orderBy("id", "desc").limit(limit)).map(toAudit);
}

export async function summary(db: Db): Promise<Summary> {
  const events = await listEvents(db);
  const saved = (e: SavingsEvent) => e.baselinePrice - e.negotiatedPrice;
  const approved = events.filter((e) => e.status === "approved");
  const pending = events.filter((e) => e.status === "pending");
  return {
    approvedTotal: approved.reduce((s, e) => s + saved(e), 0),
    pendingTotal: pending.reduce((s, e) => s + saved(e), 0),
    approvedCount: approved.length,
    pendingCount: pending.length,
    byCategory: CATEGORIES.map((category) => ({
      category,
      total: approved.filter((e) => e.category === category).reduce((s, e) => s + saved(e), 0),
    })),
  };
}
