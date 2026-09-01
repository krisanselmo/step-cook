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
 * Champs communs à la création et à la mise à jour d'une recette.
 *
 * Les étapes sont normalisées à l'écriture : après ce passage le document est
 * structuré quelle que soit la forme reçue, d'où le `schemaVersion` courant.
 * Firestore refusant les `undefined`, les champs absents deviennent `null`.
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
