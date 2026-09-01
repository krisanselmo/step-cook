import { Ingredient } from '@/app/lib/types';
import {
  RECIPE_SCHEMA_VERSION,
  isStructuredSchema,
  normalizeSteps,
} from '@/app/lib/utils';

interface IncomingRecipe {
  title: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  ingredients?: Ingredient[];
  steps?: unknown;
  schemaVersion?: unknown;
}

/**
 * Steps are normalised on write, so the document is structured whatever came
 * in — hence the current `schemaVersion`. Firestore rejects `undefined`, so
 * absent fields become `null`.
 */
export const toRecipeDocument = (recipe: IncomingRecipe) => {
  const ingredients = recipe.ingredients || [];

  return {
    title: recipe.title,
    description: recipe.description || null,
    prepTime: recipe.prepTime || null,
    cookTime: recipe.cookTime || null,
    totalTime: recipe.totalTime || null,
    ingredients,
    steps: normalizeSteps(recipe.steps, {
      structured: isStructuredSchema(recipe.schemaVersion),
      ingredients,
    }),
    schemaVersion: RECIPE_SCHEMA_VERSION,
  };
};
