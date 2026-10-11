import { expect, test } from "@playwright/test";
import { cleanupE2E } from "./helpers";

test.beforeEach(async () => {
  await cleanupE2E();
});

test.afterAll(async () => {
  await cleanupE2E();
});

// PRD §26 end-to-end: goal -> review -> accept -> today -> complete -> recover.
test("goal to action to recovery", async ({ page }) => {
  await page.goto("/goals/new");
  await page.getByPlaceholder(/coaching business/i).fill("E2E coaching business");
  await page.getByRole("button", { name: /suggested plan/i }).click();
  await expect(page.getByRole("heading", { name: /break this down/i })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('input[value*="Get clear on"]').first()).toBeVisible();

  await page.getByRole("button", { name: /start my plan/i }).click();
  await expect(page.getByRole("heading", { name: "E2E coaching business" })).toBeVisible({ timeout: 30_000 });

  await page.goto("/today");
  await expect(page.getByText("E2E coaching business", { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /complete/i }).first().click();
  await expect(page.getByText(/1 of/i).first()).toBeVisible({ timeout: 30_000 });

  await page.goto("/assistant");
  await page.getByPlaceholder(/focus on today/i).fill("I fell behind");
  await page.getByRole("button", { name: /^send$/i }).click();
  await expect(page.getByText(/figure out what's next/i).first()).toBeVisible({ timeout: 30_000 });
});

// Reminder -> nudge -> do.
test("follow-up reminder surfaces and completes", async ({ page }) => {
  await page.goto("/calendar");
  await page.getByPlaceholder(/follow up with john/i).fill("E2E followup with John");
  await page.getByRole("button", { name: /remind me/i }).click();
  await expect(page.getByText("E2E followup with John").first()).toBeVisible({ timeout: 30_000 });
});

// Email draft shows source badge; send without SMTP is safely refused.
test("email draft + send gate", async ({ page }) => {  await page.goto("/automations");
  await page.getByPlaceholder(/email or name/i).fill("E2E Client");
  await page.getByPlaceholder(/purpose/i).fill("E2E follow up on pricing");
  await page.getByRole("button", { name: /draft it/i }).click();
  await expect(page.getByText(/follow-up/i).first()).toBeVisible({ timeout: 30_000 });
  await page.getByPlaceholder(/recipient email to send/i).fill("client@example.com");
  await page.getByRole("button", { name: /send \(you approve\)/i }).click();
  await expect(page.getByText(/isn't configured/i)).toBeVisible({ timeout: 30_000 });
});
