import knex, { Knex } from "knex";
import { dbConfig } from "./config";
import { seedEvents } from "../shared/seed";
import { costCenterFor } from "./costCenters";

export type Db = Knex;

export function createDb(url?: string): Db {
  return knex(dbConfig(url));
}

export async function migrate(db: Db) {
  if (!(await db.schema.hasTable("events"))) {
    await db.schema.createTable("events", (t) => {
      t.increments("id");
      t.string("supplier").notNullable();
      t.string("category").notNullable();
      t.decimal("baseline_price", 14, 2).notNullable();
      t.decimal("negotiated_price", 14, 2).notNullable();
      t.date("date").notNullable();
      t.string("status").notNullable().defaultTo("pending");
      t.string("created_by").notNullable();
      t.string("approved_by");
      t.string("cost_center");
    });
  }
  if (!(await db.schema.hasTable("audit_log"))) {
    await db.schema.createTable("audit_log", (t) => {
      t.increments("id");
      t.string("at").notNullable();
      t.string("actor").notNullable();
      t.string("role").notNullable();
      t.string("action").notNullable();
      t.integer("event_id");
      t.text("detail").notNullable().defaultTo("");
    });
  }
}

export async function seed(db: Db) {
  const [{ n }] = await db("events").count({ n: "*" });
  if (Number(n) > 0) return;
  const rows = seedEvents().map((e) => ({
    supplier: e.supplier,
    category: e.category,
    baseline_price: e.baselinePrice,
    negotiated_price: e.negotiatedPrice,
    date: e.date,
    status: e.status,
    created_by: e.createdBy,
    approved_by: e.approvedBy,
    cost_center: e.status === "approved" ? costCenterFor(e.category) : null,
  }));
  for (let i = 0; i < rows.length; i += 50) await db("events").insert(rows.slice(i, i + 50));

  const history = seedEvents()
    .flatMap((e) => [
      { at: `${e.date}T14:00:00.000Z`, actor: e.createdBy, role: "sourcing_manager", action: "event.created", event_id: e.id, detail: "seeded" },
      ...(e.approvedBy
        ? [{ at: `${e.date}T18:30:00.000Z`, actor: e.approvedBy, role: "finance_approver", action: "event.approved", event_id: e.id, detail: `booked to ${costCenterFor(e.category)}` }]
        : []),
    ])
    .sort((a, b) => a.at.localeCompare(b.at));
  for (let i = 0; i < history.length; i += 50) await db("audit_log").insert(history.slice(i, i + 50));
}
