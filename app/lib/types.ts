import React from 'react';

export interface Ingredient {
  fullText: string;
  keywords: string[];
}

export interface StepParams {
  time: string;
  temp: string;
  speed: string;
  seconds: number;
  reverse: boolean;
}

export interface Recipe {
  title: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  ingredients: Ingredient[];
  steps: string[];
  slug?: string;
  orgURL?: string;
  firestoreId?: string;
}

export interface SavedRecipeSummary {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

/**
 * Statut d'une proposition de modification soumise à l'utilisateur.
 * - `pending`  : en attente de décision
 * - `applied`  : acceptée, la recette courante a été remplacée
 * - `rejected` : refusée
 * - `stale`    : caduque, la recette a changé depuis (une autre proposition a été
 *                appliquée), l'appliquer écraserait ces modifications
 */
export type ProposalStatus = 'pending' | 'applied' | 'rejected' | 'stale';

/** Modification proposée par l'agent, appliquée uniquement après validation. */
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
  /** Message d'erreur (échec de l'appel à l'agent) plutôt que réponse de l'agent. */
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

    // Checkbox states
    checkedBgDark: string;
    checkedBgLight: string;

    // App Backgrounds
    rootBgDark: string;
    rootBgLight: string;

    // Cards
    cardBgDark: string;
    cardBgLight: string;
  };
}
