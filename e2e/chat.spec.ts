import { test, expect } from '@playwright/test';
import { mockRecipeApis, sampleRecipe } from './fixtures';

/** Réponse de l'agent : réponse simple, sans toucher à la recette. */
const answerResponse = {
  action: 'answer',
  reply: 'Le sens inverse évite de hacher les morceaux pendant la cuisson.',
};

/** Réponse de l'agent : proposition de recette modifiée, en attente de validation. */
const proposeResponse = {
  action: 'propose',
  reply: "Je te propose de remplacer le beurre par de l'huile de coco.",
  recipe: {
    title: 'Gâteau au chocolat fondant (sans beurre)',
    ingredients: [
      '200g de chocolat noir',
      '3 œufs',
      '100g de sucre',
      "100g d'huile de coco",
      '50g de farine',
    ],
    steps: [
      "Faire fondre le chocolat et l'huile de coco 3 min à 50°C vitesse 2",
      'Ajouter les œufs et le sucre puis mélanger 30 sec vitesse 4',
      'Incorporer la farine 20 sec vitesse 3 sens inverse',
      'Cuire 25 min à 180°C au four',
    ],
  },
  changes: ["Beurre remplacé par de l'huile de coco", 'Étape 1 : beurre remplacé'],
};

const mockAgent = (page: import('@playwright/test').Page, json: unknown) =>
  page.route('**/api/gemini/chat', route => route.fulfill({ json }));

const openChat = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: 'Assistant IA' }).click();
  await expect(page.getByText('Questions et modifications')).toBeVisible();
};

const ask = async (page: import('@playwright/test').Page, message: string) => {
  await page
    .getByPlaceholder('Poser une question ou demander une modification...')
    .fill(message);
  await page.keyboard.press('Enter');
};

test.beforeEach(async ({ page }) => {
  await mockRecipeApis(page);
  await page.goto('/');
  await page
    .getByPlaceholder('Ou collez une recette ici...')
    .fill(sampleRecipe);
  await page.getByRole('button', { name: 'Cuisiner' }).click();
});

test("répond à une question sans modifier la recette", async ({ page }) => {
  await mockAgent(page, answerResponse);
  await openChat(page);
  await ask(page, 'Pourquoi le sens inverse ?');

  await expect(page.getByText(answerResponse.reply)).toBeVisible();
  await expect(page.getByText('Modifications proposées')).toHaveCount(0);
});

test('propose une modification et attend la validation avant de l’appliquer', async ({
  page,
}) => {
  await mockAgent(page, proposeResponse);
  await openChat(page);
  await ask(page, 'Remplace le beurre');

  await expect(page.getByText('Modifications proposées')).toBeVisible();
  await expect(
    page.getByText("Beurre remplacé par de l'huile de coco"),
  ).toBeVisible();

  // Tant qu'on n'a pas validé, la recette affichée reste l'originale
  await page.getByRole('button', { name: 'Ignorer' }).click();
  await expect(page.getByText('Proposition ignorée')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Appliquer' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Fermer' }).click();
  await expect(
    page.getByRole('button', { name: /100g de beurre/ }),
  ).toBeVisible();
});

test('applique la proposition acceptée à la recette courante', async ({
  page,
}) => {
  await mockAgent(page, proposeResponse);
  await openChat(page);
  await ask(page, 'Remplace le beurre');

  await page.getByRole('button', { name: 'Appliquer' }).click();
  await expect(page.getByText('Modifications appliquées')).toBeVisible();

  await page.getByRole('button', { name: 'Fermer' }).click();
  await expect(
    page.getByRole('button', { name: /100g d'huile de coco/ }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /100g de beurre/ })).toHaveCount(0);
});
