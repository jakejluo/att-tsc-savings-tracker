import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3100",
    video: "on",
    viewport: { width: 1440, height: 900 },
    launchOptions: { slowMo: Number(process.env.SLOWMO ?? 0) },
  },
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: {
    command: "rm -f e2e.db && DATABASE_URL=sqlite:./e2e.db PORT=3100 LOG_SILENT=1 npx tsx server/index.ts",
    url: "http://localhost:3100/api/health",
    reuseExistingServer: false,
  },
});
