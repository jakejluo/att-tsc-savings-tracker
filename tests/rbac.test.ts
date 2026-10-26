import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bearer, setup, validEvent } from "./helpers";

let ctx: Awaited<ReturnType<typeof setup>>;
beforeEach(async () => (ctx = await setup()));
afterEach(async () => ctx.db.destroy());

const createAsManager = async () =>
  (await request(ctx.app).post("/api/events").set(bearer(ctx.manager)).send(validEvent)).body;

describe("RBAC", () => {
  it("rejects requests without a token", async () => {
    expect((await request(ctx.app).get("/api/events")).status).toBe(401);
  });

  it("rejects a forged token", async () => {
    expect((await request(ctx.app).get("/api/events").set(bearer("not-a-jwt"))).status).toBe(401);
  });

  it("rejects an unknown role at login", async () => {
    const res = await request(ctx.app).post("/api/login").send({ name: "eve", role: "admin" });
    expect(res.status).toBe(400);
  });

  it("does not let finance create events", async () => {
    const res = await request(ctx.app).post("/api/events").set(bearer(ctx.finance)).send(validEvent);
    expect(res.status).toBe(403);
  });

  it("does not let a sourcing manager approve via the approve endpoint", async () => {
    const created = await createAsManager();
    const res = await request(ctx.app).post(`/api/events/${created.id}/approve`).set(bearer(ctx.manager));
    expect(res.status).toBe(403);
  });

  it("lets finance approve", async () => {
    const created = await createAsManager();
    const res = await request(ctx.app).post(`/api/events/${created.id}/approve`).set(bearer(ctx.finance));
    expect(res.status).toBe(200);
  });

  it("does not let a sourcing manager edit someone else's event", async () => {
    const created = await createAsManager();
    const res = await request(ctx.app)
      .patch(`/api/events/${created.id}`)
      .set(bearer(ctx.otherManager))
      .send({ supplier: "Someone Else" });
    expect(res.status).toBe(403);
  });

  it("lets a sourcing manager fix a typo on their own pending event", async () => {
    const created = await createAsManager();
    const res = await request(ctx.app)
      .patch(`/api/events/${created.id}`)
      .set(bearer(ctx.manager))
      .send({ supplier: "Contoso Fiber Inc" });
    expect(res.status).toBe(200);
    expect(res.body.supplier).toBe("Contoso Fiber Inc");
  });

  it("locks approved events against edits", async () => {
    const created = await createAsManager();
    await request(ctx.app).post(`/api/events/${created.id}/approve`).set(bearer(ctx.finance));
    const res = await request(ctx.app)
      .patch(`/api/events/${created.id}`)
      .set(bearer(ctx.manager))
      .send({ supplier: "Changed" });
    expect(res.status).toBe(409);
  });
});
