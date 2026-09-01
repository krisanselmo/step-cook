import { test, expect } from '@playwright/test';
import { mockRecipeApis, sampleRecipe } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockRecipeApis(page);
  await page.goto('/');
  await page
    .getByPlaceholder('Ou collez une recette ici...')
    .fill(sampleRecipe);
  await page.getByRole('button', { name: 'Cuisiner' }).click();
});

test('parse une recette manuelle et affiche l’aperçu', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Ingrédients' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /200g de chocolat noir/ }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /3 œufs/ })).toBeVisible();
  // Visible label is "Démarrer", accessible name is "Étape suivante".
  await expect(
    page.getByRole('button', { name: 'Étape suivante' }),
  ).toBeVisible();
});

test('navigue dans les étapes et extrait les paramètres Thermomix', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Étape suivante' }).click(); // Démarrer

  // Exact text targets the dials: the values also appear in the step text.
  await expect(page.getByText('Étape 1', { exact: true })).toBeVisible();
  await expect(page.getByText('50°C', { exact: true })).toBeVisible();
  await expect(page.getByText('03:00', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await expect(page.getByText('Étape 2', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Étape précédente' }).click();
  await expect(page.getByText('Étape 1', { exact: true })).toBeVisible();
});

test('coche un ingrédient dans l’aperçu', async ({ page }) => {
  const ingredient = page.getByRole('button', { name: /3 œufs/ });

  await ingredient.click();
  // A ticked ingredient is struck through.
  await expect(ingredient).toHaveClass(/line-through/);
});
