import request from "supertest";
import { createApp } from "../server/app";
import { createDb, migrate, seed } from "../server/db";
import { Role } from "../shared/types";

export async function setup() {
  const db = createDb("sqlite::memory:");
  await migrate(db);
  await seed(db);
  const app = createApp(db);
  const tokenFor = async (name: string, role: Role) =>
    (await request(app).post("/api/login").send({ name, role })).body.token as string;
  return {
    db,
    app,
    manager: await tokenFor("sam.rivera", "sourcing_manager"),
    otherManager: await tokenFor("priya.shah", "sourcing_manager"),
    finance: await tokenFor("alex.chen", "finance_approver"),
  };
}

export const validEvent = {
  supplier: "Contoso Fiber",
  category: "Network Equipment",
  baselinePrice: 50000,
  negotiatedPrice: 42000,
  date: "2026-09-15",
};

export const bearer = (t: string) => ({ authorization: `Bearer ${t}` });
