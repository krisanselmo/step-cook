import { test } from '@playwright/test';
import { mockRecipeApis, sampleRecipe } from './fixtures';

/**
 * Génère les captures d'écran utilisées dans le README.
 * Lancer avec : npm run test:e2e:screenshots
 */
const DIR = 'docs/screenshots';

test.beforeEach(async ({ page }) => {
  await mockRecipeApis(page);
});

test('capture : page d’accueil', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Tarte aux pommes').waitFor();
  await page.screenshot({ path: `${DIR}/01-accueil.png` });
});

test('capture : aperçu de la recette', async ({ page }) => {
  await page.goto('/');
  await page
    .getByPlaceholder('Ou collez une recette ici...')
    .fill(sampleRecipe);
  await page.getByRole('button', { name: 'Cuisiner' }).click();
  await page.getByRole('heading', { name: 'Ingrédients' }).waitFor();
  await page.screenshot({ path: `${DIR}/02-apercu.png` });
});

test('capture : étape de cuisson (timer + Thermomix)', async ({ page }) => {
  await page.goto('/');
  await page
    .getByPlaceholder('Ou collez une recette ici...')
    .fill(sampleRecipe);
  await page.getByRole('button', { name: 'Cuisiner' }).click();
  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await page.getByText('Étape 1').waitFor();
  await page.screenshot({ path: `${DIR}/03-etape.png` });
});

test('capture : thème Mario', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('activeThemeId', 'mario'),
  );
  await page.goto('/');
  await page.getByText('Tarte aux pommes').waitFor();
  await page.screenshot({ path: `${DIR}/04-theme-mario.png` });
});
