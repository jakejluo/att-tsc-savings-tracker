# AT&T TSC Savings Tracker

Sourcing managers log supplier savings; finance approves them. Synthetic data only.

```
npm install
npm run build && npm start      # API + UI on http://localhost:3001
```

Dev mode: `npm run dev:api` and `npm run dev` (Vite on :5173, proxies `/api`).

| Command | What |
|---|---|
| `npm test` | API and RBAC tests (Vitest + Supertest) |
| `npm run test:e2e` | Playwright: manager submits, finance approves |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `docker build -t savings-tracker .` | Container image |

- **Database:** SQLite by default (`DATABASE_URL=sqlite:./savings.db`). Set `DATABASE_URL=postgres://...` for Postgres. Seeds 100 synthetic events on first start.
- **Sign-in:** mock roles `sourcing_manager` and `finance_approver`. In production these map to Entra ID app roles; see [`docs/permit-to-operate.md`](docs/permit-to-operate.md).
- **Audit:** every create, edit and approval is written to `audit_log` and shown on the Audit log tab.

The hackathon prototype is tagged `prototype`.
