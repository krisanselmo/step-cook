import { defineConfig, devices } from '@playwright/test';

/**
 * Tests E2E Playwright.
 *
 * On utilise le Chrome système (`channel: 'chrome'`) plutôt que le Chromium
 * empaqueté par Playwright : les builds Playwright ne couvrent pas Ubuntu 26.04,
 * et Chrome est de toute façon présent sur les postes de dev.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 800 },
    // Le service worker de l'app est un passthrough qui rejouerait les fetch et
    // contournerait le mock des routes API : on le bloque pour des tests fiables.
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
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
