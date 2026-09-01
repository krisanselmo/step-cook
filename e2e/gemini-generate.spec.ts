import { test, expect } from '@playwright/test';
import {
  mockGeminiConfigured,
  mockGeminiGenerate,
  mockOwnedEquipment,
  mockRecipeApis,
  structuredRecipe,
} from './fixtures';

/**
 * End-to-end generation with the model mocked. In schema 2 the step declares
 * everything and the app never re-reads its text, so these assert each
 * declaration reaches the screen and the save payload.
 */

const generate = async (page: import('@playwright/test').Page) => {
  await page
    .getByPlaceholder(/Décrivez votre recette de rêve/)
    .fill('Velouté de carottes au cumin');
  await page.getByRole('button', { name: 'Générer Recette' }).click();
  await expect(
    page.getByRole('heading', { name: 'Ingrédients' }),
  ).toBeVisible();
};

/** Advances to step `n` (1-indexed) from the overview. */
const goToStep = async (page: import('@playwright/test').Page, n: number) => {
  for (let i = 0; i < n; i++) {
    await page.getByRole('button', { name: 'Étape suivante' }).click();
  }
  await expect(page.getByText(`Étape ${n}`, { exact: true })).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  await mockRecipeApis(page);
  await mockGeminiConfigured(page);
  await mockOwnedEquipment(page);
});

test('affiche la recette générée et ses ingrédients', async ({ page }) => {
  await mockGeminiGenerate(page);
  await page.goto('/');
  await generate(page);

  await expect(
    page.getByRole('heading', { name: structuredRecipe.title }),
  ).toHaveCount(0); // le titre est dans l'en-tête, pas un heading de section
  await expect(page.getByText(structuredRecipe.title, { exact: false })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /800g de carottes/ }),
  ).toBeVisible();
});

test('renseigne les cadrans depuis les réglages déclarés', async ({ page }) => {
  await mockGeminiGenerate(page);
  await page.goto('/');
  await generate(page);
  await goToStep(page, 2);

  await expect(page.getByText('03:00', { exact: true })).toBeVisible();
  await expect(page.getByText('120°C', { exact: true })).toBeVisible();
});

test('affiche les ingrédients déclarés par l’étape', async ({ page }) => {
  await mockGeminiGenerate(page);
  await page.goto('/');
  await generate(page);
  await goToStep(page, 3);

  // Only the ingredient step 3 declares shows under the instruction.
  await expect(
    page.getByRole('button', { name: /800g de carottes/ }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /1 oignon/ })).toHaveCount(0);
});

test('présélectionne le mode de coupe déclaré', async ({ page }) => {
  await mockGeminiGenerate(page);
  await page.goto('/');
  await generate(page);
  await goToStep(page, 3);

  await expect(page.getByText('Découpe-minute', { exact: true })).toBeVisible();
  await expect(page.getByText('Mode de l’étape')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Râpé fin' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('ne signale le gobelet doseur que lorsqu’il faut le retirer', async ({
  page,
}) => {
  await mockGeminiGenerate(page);
  await page.goto('/');
  await generate(page);

  // Step 2: cup on the lid, nothing to report.
  await goToStep(page, 2);
  await expect(page.getByRole('button', { name: /gobelet/i })).toHaveCount(0);

  // Step 4 declares `state: 'removed'`.
  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await expect(page.getByText('Étape 4', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Retirer le gobelet' }),
  ).toBeVisible();
});

test('n’affiche ni minuteur ni matériel sur une étape sans robot', async ({
  page,
}) => {
  await mockGeminiGenerate(page);
  await page.goto('/');
  await generate(page);
  await goToStep(page, 6);

  await expect(page.getByText('Servir bien chaud.')).toBeVisible();
  await expect(page.getByText('--:--', { exact: true })).toBeVisible();
});

test('sauvegarde la recette en conservant les données structurées', async ({
  page,
}) => {
  // Regression: the client re-normalised the route response without passing
  // the ingredient list back, erasing every step's ingredients before saving.
  const saved = await mockGeminiGenerate(page);

  await page.goto('/');
  await generate(page);

  await expect.poll(() => saved.length).toBeGreaterThan(0);

  const recipe = saved[0].recipe as {
    schemaVersion: number;
    steps: {
      text: string;
      ingredients?: string[];
      accessories?: { id: string; cutterMode?: string; state?: string }[];
      params?: { time: string; temp: string; speed: string };
    }[];
  };

  expect(recipe.schemaVersion).toBe(2);

  const withIngredients = recipe.steps.filter(s => s.ingredients?.length);
  expect(withIngredients).toHaveLength(5);
  expect(recipe.steps[2].ingredients).toEqual(['800g de carottes']);

  expect(recipe.steps[2].accessories).toEqual([
    { id: 'decoupe-minute', cutterMode: 'rape-fin' },
  ]);
  expect(recipe.steps[3].accessories).toContainEqual({
    id: 'gobelet-doseur',
    state: 'removed',
  });

  expect(recipe.steps[3].params).toMatchObject({
    time: '20:00',
    temp: 'VAROMA',
    speed: '1',
  });

  // No appliance, so no settings attached.
  expect(recipe.steps[5].params).toBeUndefined();
});

test('signale un accessoire absent du matériel configuré', async ({ page }) => {
  await mockGeminiGenerate(page);
  await mockOwnedEquipment(page, ['varoma', 'spatule', 'gobelet-doseur']);

  await page.goto('/');
  await generate(page);
  await goToStep(page, 3);

  await expect(
    page.getByText('Découpe-minute absent de votre matériel configuré.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Configurer' })).toBeVisible();
});
