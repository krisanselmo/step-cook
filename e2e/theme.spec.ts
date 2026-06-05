import { test, expect } from '@playwright/test';
import { mockRecipeApis } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockRecipeApis(page);
});

test('le choix du thème est persisté dans le localStorage', async ({ page }) => {
  await page.goto('/');

  // Ouvre le sélecteur de thème (bouton avec title="Changer de thème").
  await page.getByTitle('Changer de thème').click();
  await page.getByRole('button', { name: 'Mario' }).click();

  // Persisté côté client...
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('activeThemeId')))
    .toBe('mario');

  // ...et restauré après rechargement.
  await page.reload();
  await expect(page.getByTitle('Changer de thème')).toContainText('Mario');
});

test('le mode sombre/clair est persisté', async ({ page }) => {
  await page.goto('/');

  // Par défaut sombre : le bouton propose « Passer en mode clair ».
  await page.getByRole('button', { name: 'Passer en mode clair' }).click();

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('isDarkMode')))
    .toBe('false');

  await page.reload();
  // En mode clair, le bouton propose désormais « Passer en mode sombre ».
  await expect(
    page.getByRole('button', { name: 'Passer en mode sombre' }),
  ).toBeVisible();
});
