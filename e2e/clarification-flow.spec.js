import { test, expect } from "@playwright/test";

import { server } from "../server.js";

let baseUrl;

test.beforeAll(async () => {
  delete process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY_PATH = "/tmp/key-results-generator-missing-key";

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  baseUrl = `http://${address.address}:${address.port}`;
});

test.afterAll(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("objective clarification flow generates final graph-backed key results", async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(request.url()));

  await page.goto(baseUrl);
  await expect(page.locator("#objective-heading")).toContainText("Improve dependable rail service");
  await expect(page.locator(".clarification-field")).toHaveCount(6);

  await page.locator("#objective").fill("Expand enterprise customer retention");
  await page.getByRole("button", { name: /generate$/i }).click();
  await expect(page.locator("#objective-heading")).toContainText("Expand enterprise customer retention");
  await expect(page.locator(".variable-node")).toHaveCount(10);
  await expect(page.locator(".clarification-field")).toHaveCount(6);

  await setRangeValue(page, 'input[name="cycle-time:influenceability"]', 5);
  await setRangeValue(page, 'input[name="cycle-time:gap"]', 5);
  await expect(page.locator('input[name="cycle-time:gap"] + output')).toHaveText("5");

  await page.getByRole("button", { name: "Generate final KRs" }).click();
  await expect(page.locator(".kr-item")).toHaveCount(4);
  await expect(page.locator(".kr-item").first()).toContainText(/Reduce|Increase|Improve/);
  await expect(page.locator(".kr-item").first()).toContainText(/Leading indicator|Lagging indicator/);
  await expect(page.locator("#provider-status")).toContainText(/Local fallback|AI generated/);

  await page.locator("#objective").fill("Improve onboarding activation");
  await page.getByRole("button", { name: /generate$/i }).click();
  await expect(page.locator("#objective-heading")).toContainText("Improve onboarding activation");
  await expect(page.locator(".kr-item.pending")).toContainText("Rate the top metrics");
  await expect(page.locator(".clarification-field")).toHaveCount(6);

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

async function setRangeValue(page, selector, value) {
  await page.locator(selector).evaluate((input, nextValue) => {
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
