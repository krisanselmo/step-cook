import { test } from '@playwright/test';
import { mockRecipeApis, sampleRecipe } from './fixtures';

/**
 * Génère les captures d'écran utilisées dans le README.
 * Taguées @capture → exclues du run E2E par défaut (évite le churn d'images),
 * lancées explicitement via : npm run test:e2e:screenshots
 */
const DIR = 'docs/screenshots';

test.describe('@capture', () => {
  test.beforeEach(async ({ page }) => {
    await mockRecipeApis(page);
  });

  test('page d’accueil', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Tarte aux pommes').waitFor();
    await page.screenshot({ path: `${DIR}/01-accueil.png` });
  });

  test('aperçu de la recette', async ({ page }) => {
    await page.goto('/');
    await page
      .getByPlaceholder('Ou collez une recette ici...')
      .fill(sampleRecipe);
    await page.getByRole('button', { name: 'Cuisiner' }).click();
    await page.getByRole('heading', { name: 'Ingrédients' }).waitFor();
    await page.screenshot({ path: `${DIR}/02-apercu.png` });
  });

  test('étape de cuisson (timer + Thermomix)', async ({ page }) => {
    await page.goto('/');
    await page
      .getByPlaceholder('Ou collez une recette ici...')
      .fill(sampleRecipe);
    await page.getByRole('button', { name: 'Cuisiner' }).click();
    await page.getByRole('button', { name: 'Étape suivante' }).click();
    await page.getByText('Étape 1', { exact: true }).waitFor();
    await page.screenshot({ path: `${DIR}/03-etape.png` });
  });

  test('thème Mario', async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem('activeThemeId', 'mario'),
    );
    await page.goto('/');
    await page.getByText('Tarte aux pommes').waitFor();
    await page.screenshot({ path: `${DIR}/04-theme-mario.png` });
  });
});
