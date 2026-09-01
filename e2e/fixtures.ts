import type { Page, Route } from '@playwright/test';

/**
 * Recette en texte libre qui se parse intégralement côté client
 * (mode manuel) — aucun service externe requis.
 */
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
 * Recette en schéma 2 telle que la route `/api/gemini/generate` la renvoie,
 * décalquée d'une vraie génération Gemini.
 *
 * Les tests rejouent cette capture au lieu d'appeler le modèle : le quota de
 * l'API est limité, et une sortie non déterministe ne permettrait pas
 * d'affirmer quoi que ce soit sur ce que l'UI affiche.
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
    // Étape sans robot : ni minuteur, ni matériel, ni ingrédient.
    { text: 'Servir bien chaud.' },
  ],
};

/** Proposition de l'agent : même schéma 2, crème remplacée par du lait de coco. */
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

/**
 * Intercepte les routes Mealie + Firestore pour des données déterministes,
 * sans dépendre des variables d'environnement ni des services externes.
 */
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

/** Force l'UI à considérer Gemini comme configuré, sans clé d'API réelle. */
export async function mockGeminiConfigured(page: Page) {
  await page.route('**/api/gemini/config', route =>
    route.fulfill({ json: { configured: true } }),
  );
}

/**
 * Mocke la génération et capture ce que l'app tente ensuite d'enregistrer.
 *
 * Le tableau renvoyé se remplit à la sauvegarde : c'est lui qui permet de
 * vérifier que les données structurées survivent au passage par le client, là
 * où une re-normalisation les avait déjà effacées en silence.
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
 * Fixe le matériel possédé avant le chargement de l'app.
 *
 * La configuration vit dans le localStorage et plusieurs accessoires ne sont
 * pas cochés d'origine (Découpe-minute, épluche-légumes…) : sans ce réglage,
 * une étape qui les utilise afficherait le bandeau « non configuré » au lieu
 * du panneau attendu.
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

/** Mocke l'agent conversationnel avec une réponse donnée. */
export async function mockAgent(page: Page, json: unknown) {
  await page.route('**/api/gemini/chat', route => route.fulfill({ json }));
}

/** Saisit une recette en mode manuel et démarre la cuisson. */
export async function cookManualRecipe(page: Page, recipe = sampleRecipe) {
  await page.getByPlaceholder('Ou collez une recette ici...').fill(recipe);
  await page.getByRole('button', { name: 'Cuisiner' }).click();
}
