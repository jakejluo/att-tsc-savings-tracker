import path from "node:path";
import { createApp } from "./app";
import { config } from "./config";
import { createDb, migrate, seed } from "./db";
import { log } from "./log";

const db = createDb();
await migrate(db);
await seed(db);

const staticDir = process.env.STATIC_DIR ?? path.resolve("dist");
createApp(db, { staticDir }).listen(config.port, () => log("info", `savings-api listening on :${config.port}`));
