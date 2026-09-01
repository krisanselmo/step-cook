import React from 'react';

export interface Ingredient {
  fullText: string;
  keywords: string[];
}

/** Step settings, ready to display (dials + timer). */
export interface StepParams {
  time: string;
  temp: string;
  speed: string;
  seconds: number;
  reverse: boolean;
}

/** Raw settings as declared by the model (schema 2). `StepParams` derives from these. */
export interface StepSettings {
  /** Absent or 0 means no timer. */
  seconds?: number;
  /** Degrees ("100") or "Varoma". */
  temperature?: string;
  /** "0.5" to "10", or "mijotage" / "petrin" / "turbo". */
  speed?: string;
  reverse?: boolean;
}

/**
 * `cutterMode` only applies to the Découpe-minute, `state` only to the
 * measuring cup — on the lid by default, so only its removal is reported.
 */
export interface StepAccessory {
  id: string;
  cutterMode?: string;
  state?: 'in-place' | 'removed';
}

/**
 * Every optional field is filled at the source — declared by the model, or
 * inferred from the text for schema 1. See `RECIPE_SCHEMA_VERSION`.
 *
 * `ingredients` holds `fullText` values already resolved against
 * `Recipe.ingredients`, so the UI only reads them.
 */
export interface RecipeStep {
  text: string;
  accessories?: StepAccessory[];
  ingredients?: string[];
  /** Resolved settings (declared in schema 2, inferred in schema 1). */
  params?: StepParams;
}

export interface Recipe {
  title: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  slug?: string;
  orgURL?: string;
  firestoreId?: string;
  /** Absent means 1. See `RECIPE_SCHEMA_VERSION`. */
  schemaVersion?: number;
}

export interface SavedRecipeSummary {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

/**
 * `stale` means another proposal was applied since: applying this one would
 * overwrite that change.
 */
export type ProposalStatus = 'pending' | 'applied' | 'rejected' | 'stale';

/** Applied only after the user validates it. */
export interface RecipeProposal {
  recipe: Recipe;
  changes: string[];
  status: ProposalStatus;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  proposal?: RecipeProposal;
  /** An error message rather than an agent reply. */
  isError?: boolean;
}

export interface MealieRecipeSummary {
  id: string;
  slug: string;
  name: string;
  image?: string;
  description?: string;
  dateAdded?: string;
}

export interface MealieIngredient {
  note?: string;
  food?: { name: string };
  unit?: { name: string };
  quantity?: number;
  display?: string;
}

export interface MealieInstruction {
  text: string;
}

export interface MealieRecipeDetail {
  slug?: string;
  name: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  performTime?: string;
  recipeIngredient: MealieIngredient[];
  recipeInstructions: MealieInstruction[];
  orgURL?: string;
}

export interface ThemePlugin {
  id: string;
  name: string;
  title: string;
  icon: React.ElementType;
  properties: {
    font: string; // font-sans, font-mono, font-serif
    radius: string; // rounded-xl, rounded-md, rounded-none
    buttonStyle: string; // Style de base des boutons
  };
  colors: {
    accent: string;
    accentDarker: string;
    bgPrimary: string;
    bgPrimaryHover: string;
    borderAccent: string;
    shadowAccent: string;

    checkedBgDark: string;
    checkedBgLight: string;

    rootBgDark: string;
    rootBgLight: string;

    cardBgDark: string;
    cardBgLight: string;
  };
}
