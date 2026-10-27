import { defineConfig } from '@playwright/test';

/** Browser smoke flows over the web build (docs/technical-design.md, Browser harness). */
const PORT = 8081;
const baseURL = process.env.WEB_URL ?? `http://localhost:${PORT}`;
const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: ci ? 1 : 0,
  reporter: ci ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    // The headless shell crashes on this app; full Chromium runs headless too.
    channel: 'chromium',
    locale: 'de-DE',
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npx expo start --web --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !ci,
    timeout: 180_000,
  },
});
