import { defineConfig, devices } from '@playwright/test';

/**
 * Uses system Chrome (`channel: 'chrome'`): Playwright's bundled Chromium has
 * no Ubuntu 26.04 build.
 */
// Dedicated port. On Next's default 3000, `reuseExistingServer` would silently
// run the suite against whatever else is listening.
const PORT = Number(process.env.E2E_PORT ?? 4010);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 800 },
    // The app's service worker would replay fetches and bypass the API mocks.
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  // Production build, not the dev server: no Next dev indicator on captures.
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
