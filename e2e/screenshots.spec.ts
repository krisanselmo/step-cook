import { test } from '@playwright/test';
import { mockRecipeApis, sampleRecipe } from './fixtures';

/**
 * README screenshots. Tagged @capture so the default E2E run skips them and
 * images do not churn; run with `npm run test:e2e:screenshots`.
 *
 * `animations: 'disabled'` fast-forwards CSS transitions, otherwise a capture
 * can freeze a theme mid-fade.
 */
const DIR = 'docs/screenshots';
const PHONE = { width: 390, height: 844 };
const SHOT = { animations: 'disabled' } as const;

test.describe('@capture', () => {
  test.beforeEach(async ({ page }) => {
    await mockRecipeApis(page);
  });

  test('page d’accueil', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Tarte aux pommes').waitFor();
    await page.screenshot({ path: `${DIR}/01-accueil.png`, ...SHOT });
  });

  test('aperçu de la recette (mobile)', async ({ page }) => {
    // Navigate at desktop size, where the Manual column is visible...
    await page.goto('/');
    await page
      .getByPlaceholder('Ou collez une recette ici...')
      .fill(sampleRecipe);
    await page.getByRole('button', { name: 'Cuisiner' }).click();
    await page.getByRole('heading', { name: 'Ingrédients' }).waitFor();
    // ...then capture on a mobile viewport.
    await page.setViewportSize(PHONE);
    await page.screenshot({ path: `${DIR}/02-apercu.png`, ...SHOT });
  });

  test('étape de cuisson (mobile)', async ({ page }) => {
    await page.goto('/');
    await page
      .getByPlaceholder('Ou collez une recette ici...')
      .fill(sampleRecipe);
    await page.getByRole('button', { name: 'Cuisiner' }).click();
    await page.getByRole('button', { name: 'Étape suivante' }).click();
    await page.getByText('Étape 1', { exact: true }).waitFor();
    await page.setViewportSize(PHONE);
    await page.screenshot({ path: `${DIR}/03-etape.png`, ...SHOT });
  });

  test('thème Chez Gusteau (mode clair)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('activeThemeId', 'ratatouille');
      localStorage.setItem('isDarkMode', 'false');
    });
    await page.goto('/');
    // In light mode the button offers "Passer en mode sombre"; waiting on it
    // avoids capturing mid-transition.
    await page
      .getByRole('button', { name: 'Passer en mode sombre' })
      .waitFor();
    await page.getByText('Tarte aux pommes').waitFor();
    await page.screenshot({ path: `${DIR}/04-theme-gusteau.png`, ...SHOT });
  });
});
