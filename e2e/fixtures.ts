import type { Page, Route } from '@playwright/test';

/** Free text, parsed entirely client-side: no external service needed. */
export const sampleRecipe = `Gâteau au chocolat fondant
Ingrédients:
- 200g de chocolat noir
- 3 œufs
- 100g de sucre
- 100g de beurre
- 50g de farine
Préparation:
1. Faire fondre le chocolat et le beurre 3 min à 50°C vitesse 2
2. Ajouter les œufs et le sucre puis mélanger 30 sec vitesse 4
3. Incorporer la farine 20 sec vitesse 3 sens inverse
4. Cuire 25 min à 180°C au four`;

const mealieRecipes = [
  {
    id: '1',
    slug: 'tarte-aux-pommes',
    name: 'Tarte aux pommes',
    description: 'Classique et réconfortante',
    dateAdded: '2026-05-20',
  },
  {
    id: '2',
    slug: 'risotto-champignons',
    name: 'Risotto aux champignons',
    description: 'Crémeux à souhait',
    dateAdded: '2026-05-22',
  },
];

const savedRecipes = [
  {
    id: 'a1',
    title: 'Velouté de potimarron',
    description: 'Généré par IA',
    createdAt: '2026-06-01',
  },
];

/**
 * Traced from a real Gemini generation. Tests replay this capture rather than
 * call the model: the API quota is limited and its output is not deterministic.
 */
export const structuredRecipe = {
  title: 'Velouté de carottes au cumin',
  description: 'Un velouté de carottes parfumé au cumin, préparé au Thermomix.',
  prepTime: '15 min',
  cookTime: '24 min',
  totalTime: '39 min',
  schemaVersion: 2,
  ingredients: [
    '800g de carottes',
    '1 oignon',
    '20g de beurre',
    '1 c. à café de cumin en poudre',
    "600g d'eau",
    '150g de crème fraîche',
  ],
  steps: [
    {
      text: "Mettre l'oignon coupé en deux dans le bol et hacher 5 sec / vitesse 5.",
      ingredients: ['1 oignon'],
      settings: { seconds: 5, speed: '5' },
    },
    {
      text: 'Racler les parois du bol avec la spatule, ajouter le beurre et faire suer 3 min / 120°C / vitesse 1.',
      ingredients: ['20g de beurre'],
      accessories: [{ id: 'spatule' }],
      settings: { seconds: 180, temperature: '120', speed: '1' },
    },
    {
      text: 'Insérer le Découpe-minute (râpé fin) et couper les carottes 1 min / vitesse 5.',
      ingredients: ['800g de carottes'],
      accessories: [{ id: 'decoupe-minute', cutterMode: 'rape-fin' }],
      settings: { seconds: 60, speed: '5' },
    },
    {
      text: "Ajouter l'eau et le cumin, puis cuire 20 min / Varoma / vitesse 1 sans le gobelet doseur pour laisser réduire.",
      ingredients: ["600g d'eau", '1 c. à café de cumin en poudre'],
      accessories: [
        { id: 'varoma' },
        { id: 'gobelet-doseur', state: 'removed' },
      ],
      settings: { seconds: 1200, temperature: 'Varoma', speed: '1', reverse: true },
    },
    {
      text: 'Ajouter la crème fraîche et mixer 1 min / vitesse 10.',
      ingredients: ['150g de crème fraîche'],
      settings: { seconds: 60, speed: '10' },
    },
    // No appliance: no timer, no equipment, no ingredient.
    { text: 'Servir bien chaud.' },
  ],
};

/** Agent proposal, same schema 2, cream swapped for coconut milk. */
export const structuredProposal = {
  action: 'propose',
  reply: 'Je te propose de remplacer la crème fraîche par du lait de coco.',
  recipe: {
    ...structuredRecipe,
    title: 'Velouté de carottes au cumin et lait de coco',
    ingredients: structuredRecipe.ingredients.map(ing =>
      ing === '150g de crème fraîche' ? '150g de lait de coco' : ing,
    ),
    steps: structuredRecipe.steps.map(step =>
      step.ingredients?.includes('150g de crème fraîche')
        ? {
          ...step,
          text: 'Ajouter le lait de coco et mixer 1 min / vitesse 10.',
          ingredients: ['150g de lait de coco'],
        }
        : step,
    ),
  },
  changes: [
    'Ingrédients : 150g de crème fraîche remplacé par 150g de lait de coco',
    'Étape 5 : crème fraîche remplacée par du lait de coco',
  ],
};

/** Deterministic Mealie + Firestore data, independent of env and services. */
export async function mockRecipeApis(
  page: Page,
  opts: { mealie?: unknown[]; saved?: unknown[] } = {},
) {
  await page.route('**/api/mealie/recipes', route =>
    route.fulfill({ json: opts.mealie ?? mealieRecipes }),
  );
  await page.route('**/api/firestore/recipes', route =>
    route.fulfill({ json: opts.saved ?? savedRecipes }),
  );
}

/** Makes the UI treat Gemini as configured, without a real API key. */
export async function mockGeminiConfigured(page: Page) {
  await page.route('**/api/gemini/config', route =>
    route.fulfill({ json: { configured: true } }),
  );
}

/**
 * Mocks generation and captures what the app then tries to save. The returned
 * array is how a test asserts the structured data survives the client, where a
 * re-normalisation once erased it silently.
 */
export async function mockGeminiGenerate(
  page: Page,
  recipe: unknown = structuredRecipe,
) {
  const savedPayloads: Record<string, unknown>[] = [];

  await page.route('**/api/gemini/generate', route =>
    route.fulfill({ json: { recipe } }),
  );

  await page.route('**/api/firestore/recipes', (route: Route) => {
    if (route.request().method() === 'POST') {
      savedPayloads.push(route.request().postDataJSON());

      return route.fulfill({ status: 201, json: { id: 'generated-1' } });
    }

    return route.fulfill({ json: savedRecipes });
  });

  return savedPayloads;
}

/**
 * Several accessories are unticked by default, so a step using one would show
 * the "not configured" banner instead of the panel under test.
 */
export async function mockOwnedEquipment(page: Page, ids: string[] = ALL_EQUIPMENT) {
  await page.addInitScript(
    value => window.localStorage.setItem('ownedEquipment', value),
    JSON.stringify(ids),
  );
}

export const ALL_EQUIPMENT = [
  'varoma',
  'panier-cuisson',
  'fouet',
  'gobelet-doseur',
  'spatule',
  'decoupe-minute',
  'eplucheur',
  'couvercle-lames',
  'bol-supplementaire',
  'sensor',
];

/** Mocks the chat agent with a given response. */
export async function mockAgent(page: Page, json: unknown) {
  await page.route('**/api/gemini/chat', route => route.fulfill({ json }));
}

/** Enters a recipe in manual mode and starts cooking. */
export async function cookManualRecipe(page: Page, recipe = sampleRecipe) {
  await page.getByPlaceholder('Ou collez une recette ici...').fill(recipe);
  await page.getByRole('button', { name: 'Cuisiner' }).click();
}
