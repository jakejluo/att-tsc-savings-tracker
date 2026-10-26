import { expect, test } from "@playwright/test";

test("sourcing manager submits, finance approves", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Sourcing manager/ }).click();
  await expect(page.getByTestId("who")).toContainText("sam.rivera");
  await expect(page.getByTestId("total-savings")).not.toHaveText("$0");
  const totalBefore = await page.getByTestId("total-savings").textContent();

  await page.getByLabel("Supplier").fill("E2E Demo Supplier");
  await page.getByLabel("Category").selectOption("Network Equipment");
  await page.getByLabel("Baseline price").fill("120000");
  await page.getByLabel("Negotiated price").fill("100000");
  await page.getByLabel("Date").fill("2026-10-01");
  await page.getByRole("button", { name: "Log savings" }).click();

  const row = page.getByRole("row", { name: /E2E Demo Supplier/ });
  await expect(row).toContainText("pending");
  await expect(row.getByRole("button", { name: "Approve" })).toHaveCount(0);
  await expect(page.getByTestId("total-savings")).toHaveText(totalBefore!);

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("button", { name: /Finance approver/ }).click();
  await expect(page.getByTestId("who")).toContainText("alex.chen");

  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row).toContainText("approved");
  await expect(page.getByTestId("total-savings")).not.toHaveText(totalBefore!);

  await page.getByRole("button", { name: "Audit log" }).click();
  const audit = page.getByRole("table", { name: "Audit log" });
  await expect(audit.getByRole("row").nth(1)).toContainText("alex.chen");
  await expect(audit.getByRole("row").nth(1)).toContainText("event.approved");
  await expect(audit.getByRole("row").nth(2)).toContainText("sam.rivera");
  await expect(audit.getByRole("row").nth(2)).toContainText("event.created");
});
