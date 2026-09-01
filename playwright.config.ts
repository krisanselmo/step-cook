import { defineConfig, devices } from '@playwright/test';

/**
 * Tests E2E Playwright.
 *
 * On utilise le Chrome système (`channel: 'chrome'`) plutôt que le Chromium
 * empaqueté par Playwright : les builds Playwright ne couvrent pas Ubuntu 26.04,
 * et Chrome est de toute façon présent sur les postes de dev.
 */
// Port dédié aux tests : le 3000 par défaut de Next est le plus disputé des
// ports de dev, et `reuseExistingServer` y ferait tourner la suite contre
// l'application de quelqu'un d'autre sans le moindre avertissement.
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
  // On teste contre un build de production (`next start`), pas le serveur de dev :
  // évite l'indicateur de dev Next.js sur les captures et reflète le rendu réel.
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
