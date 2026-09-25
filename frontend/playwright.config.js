import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5101",
    browserName: "chromium",
    channel: process.env.CI ? undefined : "msedge",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node ../backend/tests/browser-server.js",
    url: "http://127.0.0.1:5101/api/health",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
