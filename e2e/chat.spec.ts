import { test, expect } from '@playwright/test';
import {
  cookManualRecipe,
  mockAgent,
  mockGeminiConfigured,
  mockGeminiGenerate,
  mockRecipeApis,
  sampleRecipe,
  structuredProposal,
} from './fixtures';

/** Plain answer, recipe untouched. */
const answerResponse = {
  action: 'answer',
  reply: 'Le sens inverse évite de hacher les morceaux pendant la cuisson.',
};

/** Schema-2 proposal over a schema-1 recipe: the app must take the mix. */
const proposeResponse = {
  action: 'propose',
  reply: "Je te propose de remplacer le beurre par de l'huile de coco.",
  schemaVersion: 2,
  recipe: {
    title: 'Gâteau au chocolat fondant (sans beurre)',
    schemaVersion: 2,
    ingredients: [
      '200g de chocolat noir',
      '3 œufs',
      '100g de sucre',
      "100g d'huile de coco",
      '50g de farine',
    ],
    steps: [
      {
        text: "Faire fondre le chocolat et l'huile de coco 3 min à 50°C vitesse 2",
        ingredients: ['200g de chocolat noir', "100g d'huile de coco"],
        settings: { seconds: 180, temperature: '50', speed: '2' },
      },
      {
        text: 'Ajouter les œufs et le sucre puis mélanger 30 sec vitesse 4',
        ingredients: ['3 œufs', '100g de sucre'],
        settings: { seconds: 30, speed: '4' },
      },
      {
        text: 'Incorporer la farine 20 sec vitesse 3 sens inverse',
        ingredients: ['50g de farine'],
        settings: { seconds: 20, speed: '3', reverse: true },
      },
      { text: 'Cuire 25 min à 180°C au four' },
    ],
  },
  changes: ["Beurre remplacé par de l'huile de coco", 'Étape 1 : beurre remplacé'],
};

const openChat = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: 'Assistant IA' }).click();
  await expect(page.getByText('Questions et modifications')).toBeVisible();
};

/** Asks for a change, then accepts the proposal. */
const proposeAndAccept = async (
  page: import('@playwright/test').Page,
  message: string,
) => {
  await openChat(page);
  await ask(page, message);
  await page.getByRole('button', { name: 'Appliquer' }).click();
};

const ask = async (page: import('@playwright/test').Page, message: string) => {
  await page
    .getByPlaceholder('Poser une question ou demander une modification...')
    .fill(message);
  await page.keyboard.press('Enter');
};

test.beforeEach(async ({ page }) => {
  await mockRecipeApis(page);
  await mockGeminiConfigured(page);
  await page.goto('/');
  await cookManualRecipe(page, sampleRecipe);
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

  // Until validated, the displayed recipe stays the original.
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
  await proposeAndAccept(page, 'Remplace le beurre');
  await expect(page.getByText('Modifications appliquées')).toBeVisible();

  await page.getByRole('button', { name: 'Fermer' }).click();
  await expect(
    page.getByRole('button', { name: /100g d'huile de coco/ }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /100g de beurre/ })).toHaveCount(0);
});

test('conserve les données structurées de la proposition appliquée', async ({
  page,
}) => {
  await mockAgent(page, proposeResponse);
  await proposeAndAccept(page, 'Remplace le beurre');
  await page.getByRole('button', { name: 'Fermer' }).click();

  // Declared by the agent, not re-read from the text.
  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await expect(page.getByText('Étape 1', { exact: true })).toBeVisible();
  await expect(page.getByText('03:00', { exact: true })).toBeVisible();
  await expect(page.getByText('50°C', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /100g d'huile de coco/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /200g de chocolat noir/ }),
  ).toBeVisible();
  // An ingredient this step does not declare stays out.
  await expect(page.getByRole('button', { name: /50g de farine/ })).toHaveCount(0);
});

test('propose sur une recette générée sans perdre son schéma', async ({
  page,
}) => {
  await mockGeminiGenerate(page);
  await mockAgent(page, structuredProposal);

  await page.goto('/');
  await page
    .getByPlaceholder(/Décrivez votre recette de rêve/)
    .fill('Velouté de carottes');
  await page.getByRole('button', { name: 'Générer Recette' }).click();
  await expect(page.getByRole('heading', { name: 'Ingrédients' })).toBeVisible();

  await proposeAndAccept(page, 'Remplace la crème par du lait de coco');
  await page.getByRole('button', { name: 'Fermer' }).click();

  await expect(
    page.getByRole('button', { name: /150g de lait de coco/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /150g de crème fraîche/ }),
  ).toHaveCount(0);

  // The cutter and its mode survive the proposal.
  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await expect(page.getByRole('button', { name: 'Râpé fin' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
