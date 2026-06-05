import { test, expect } from '@playwright/test';
import { mockRecipeApis } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockRecipeApis(page);
});

test('affiche les colonnes Manuel et Assistant IA', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Mode Manuel')).toBeVisible();
  await expect(page.getByText('Assistant IA')).toBeVisible();
  await expect(
    page.getByPlaceholder('Ou collez une recette ici...'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cuisiner' })).toBeVisible();
});

test('liste les recettes Mealie et sauvegardées (mockées)', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Tarte aux pommes')).toBeVisible();
  await expect(page.getByText('Risotto aux champignons')).toBeVisible();
  await expect(page.getByText('Velouté de potimarron')).toBeVisible();
});

test('le bouton Cuisiner est désactivé tant que la zone est vide', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Cuisiner' })).toBeDisabled();

  await page
    .getByPlaceholder('Ou collez une recette ici...')
    .fill('Une recette');

  await expect(page.getByRole('button', { name: 'Cuisiner' })).toBeEnabled();
});
