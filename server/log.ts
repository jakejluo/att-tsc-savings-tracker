import { config } from "./config";

type Level = "info" | "warn" | "error";

export function log(level: Level, msg: string, fields: Record<string, unknown> = {}) {
  if (process.env.LOG_SILENT === "1") return;
  const line = { ts: new Date().toISOString(), level, service: "savings-api", env: config.environment, msg, ...fields };
  (level === "error" ? console.error : console.log)(JSON.stringify(line));
}
