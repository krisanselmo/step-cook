import { test } from '@playwright/test';
import { mockRecipeApis, sampleRecipe } from './fixtures';

/**
 * Génère les captures d'écran utilisées dans le README.
 * Taguées @capture → exclues du run E2E par défaut (évite le churn d'images),
 * lancées explicitement via : npm run test:e2e:screenshots
 *
 * `animations: 'disabled'` fast-forward les transitions CSS — sinon une capture
 * peut figer un thème / dark mode en pleine transition de couleurs.
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
    // Navigation à la taille desktop (la colonne Manuel y est visible)...
    await page.goto('/');
    await page
      .getByPlaceholder('Ou collez une recette ici...')
      .fill(sampleRecipe);
    await page.getByRole('button', { name: 'Cuisiner' }).click();
    await page.getByRole('heading', { name: 'Ingrédients' }).waitFor();
    // ...puis capture en viewport mobile (la vue cuisine est responsive).
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
    // Attend que le mode clair soit appliqué : en clair, le bouton propose
    // « Passer en mode sombre » (évite de capturer pendant la transition).
    await page
      .getByRole('button', { name: 'Passer en mode sombre' })
      .waitFor();
    await page.getByText('Tarte aux pommes').waitFor();
    await page.screenshot({ path: `${DIR}/04-theme-gusteau.png`, ...SHOT });
  });
});
