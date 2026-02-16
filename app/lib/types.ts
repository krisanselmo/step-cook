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
  ingredients: Ingredient[];
  steps: string[];
  slug?: string;
}

export interface ModalData {
  ingredient: string;
  suggestion: string;
  loading: boolean;
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
  recipeIngredient: MealieIngredient[];
  recipeInstructions: MealieInstruction[];
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
