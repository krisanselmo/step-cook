import React from 'react';

export interface Ingredient {
  fullText: string;
  keywords: string[];
}

/** Réglages d'une étape, prêts pour l'affichage (cadrans + minuteur). */
export interface StepParams {
  time: string;
  temp: string;
  speed: string;
  seconds: number;
  reverse: boolean;
}

/**
 * Réglages bruts tels que déclarés par le modèle (schéma 2). Les valeurs
 * d'affichage de `StepParams` en sont dérivées, jamais l'inverse.
 */
export interface StepSettings {
  /** Durée totale en secondes. Absent ou 0 = pas de minuteur. */
  seconds?: number;
  /** Température en °C ("100") ou "Varoma". */
  temperature?: string;
  /** "0.5" à "10", ou "mijotage" / "petrin" / "turbo". */
  speed?: string;
  reverse?: boolean;
}

/**
 * Accessoire réclamé par une étape.
 *
 * `cutterMode` n'a de sens que pour le Découpe-minute, `state` que pour le
 * gobelet doseur — en place par défaut, seul son retrait vaut d'être signalé.
 */
export interface StepAccessory {
  id: string;
  cutterMode?: string;
  state?: 'in-place' | 'removed';
}

/**
 * Une étape de recette.
 *
 * `accessories` et `ingredients` sont renseignés à la source : déclarés par le
 * modèle pour les recettes générées (schéma JSON structuré), déduits du texte
 * pour celles qui n'arrivent que sous cette forme (Mealie, copier-coller
 * manuel). Voir `RECIPE_SCHEMA_VERSION`.
 *
 * `ingredients` contient les `fullText` des ingrédients de la recette utilisés
 * par l'étape, déjà résolus contre `Recipe.ingredients` : l'UI n'a plus qu'à
 * les lire.
 */
export interface RecipeStep {
  text: string;
  accessories?: StepAccessory[];
  ingredients?: string[];
  /** Réglages résolus (déclarés en schéma 2, extraits du texte en schéma 1). */
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
  /** Absent = 1 (étapes en texte brut). Voir `RECIPE_SCHEMA_VERSION`. */
  schemaVersion?: number;
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
