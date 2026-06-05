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
  // Bouton de démarrage : libellé visible « Démarrer », aria-label « Étape suivante ».
  await expect(
    page.getByRole('button', { name: 'Étape suivante' }),
  ).toBeVisible();
});

test('navigue dans les étapes et extrait les paramètres Thermomix', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Étape suivante' }).click(); // Démarrer

  // Étape 1 : "3 min à 50°C vitesse 2" — on cible les cadrans (texte exact)
  // car la valeur figure aussi dans le texte de l'étape.
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
  // L'ingrédient coché reçoit un style barré.
  await expect(ingredient).toHaveClass(/line-through/);
});
