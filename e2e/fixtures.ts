import type { Page } from '@playwright/test';

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
