import type { Knex } from "knex";

// SQLite by default. Set DATABASE_URL=postgres://... to run on Postgres (install `pg`).
export function dbConfig(url = process.env.DATABASE_URL ?? "sqlite:./savings.db"): Knex.Config {
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return { client: "pg", connection: url, pool: { min: 0, max: 10 } };
  }
  const filename = url.replace(/^sqlite:/, "");
  return { client: "better-sqlite3", connection: { filename }, useNullAsDefault: true };
}

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
  environment: process.env.APP_ENV ?? "dev",
};
