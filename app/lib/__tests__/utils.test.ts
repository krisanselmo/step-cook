import {
  parseIngredientLine,
  extractStepParams,
  parseRecipe,
  formatMealieToText,
} from '../utils';
import { MealieRecipeDetail } from '../types';

describe('parseIngredientLine', () => {
  it('should parse a simple ingredient line', () => {
    const line = '200g de farine';
    const result = parseIngredientLine(line);
    expect(result).toEqual({
      fullText: '200g de farine',
      keywords: ['farine'],
    });
  });

  it('should clean and extract keywords, ignoring numbers and stop words', () => {
    const line = "- 150 ml d'eau tiède";
    const result = parseIngredientLine(line);
    expect(result).toEqual({
      fullText: "150 ml d'eau tiède",
      keywords: ['eau', 'tiede'], // les accents sont retirés lors de l'extraction
    });
  });

  it('should handle lines with multiple keywords', () => {
    // 'frais' fait partie des stop-words (modificateur) : on teste avec 'bio'.
    const line = '3 œufs bio';
    const result = parseIngredientLine(line);
    expect(result).toEqual({
      fullText: '3 œufs bio',
      keywords: ['œufs', 'bio'],
    });
  });

  it('should return empty keywords for lines with only stop words or numbers', () => {
    const line = "2. de l'eau";
    const result = parseIngredientLine(line);
    expect(result).toEqual({
      fullText: "2. de l'eau",
      keywords: ['eau'],
    });
  });
});

describe('extractStepParams', () => {
  it('should extract time in minutes', () => {
    const text = 'Cuire 10 min à 100°C';
    const result = extractStepParams(text);
    expect(result.time).toBe('10:00');
    expect(result.seconds).toBe(600);
  });

  it('should extract time in seconds', () => {
    const text = 'Mélanger 30 sec';
    const result = extractStepParams(text);
    expect(result.time).toBe('00:30');
    expect(result.seconds).toBe(30);
  });

  it('should extract temperature', () => {
    const text = 'Chauffer à 80°C';
    const result = extractStepParams(text);
    expect(result.temp).toBe('80°C');
  });

  it('should extract Varoma temperature', () => {
    const text = 'Cuire au Varoma';
    const result = extractStepParams(text);
    expect(result.temp).toBe('VAROMA');
  });

  it('should extract speed', () => {
    const text = 'Mélanger vitesse 3';
    const result = extractStepParams(text);
    expect(result.speed).toBe('3');
  });

  it('should extract speed with abbreviation', () => {
    const text = 'Mixer vit.5';
    const result = extractStepParams(text);
    expect(result.speed).toBe('5');
  });

  it('should extract knead (EPI) mode', () => {
    const text = 'Pétrir en mode épi';
    const result = extractStepParams(text);
    expect(result.speed).toBe('EPI');
  });

  it('should extract Turbo mode', () => {
    const text = 'Mixer au Turbo';
    const result = extractStepParams(text);
    expect(result.speed).toBe('TURBO');
  });

  it('should detect reverse mode', () => {
    const text = 'Mélanger sens inverse vitesse 2';
    const result = extractStepParams(text);
    expect(result.reverse).toBe(true);
  });

  it('should handle complex step with all parameters', () => {
    const text = 'Cuire 5 min à 90°C vitesse 1 sens inverse';
    const result = extractStepParams(text);
    expect(result.time).toBe('05:00');
    expect(result.seconds).toBe(300);
    expect(result.temp).toBe('90°C');
    expect(result.speed).toBe('1');
    expect(result.reverse).toBe(true);
  });

  it('should return default values if no parameters found', () => {
    const text = 'Laisser reposer';
    const result = extractStepParams(text);
    expect(result).toEqual({
      time: '--:--',
      temp: '---',
      speed: '---',
      seconds: 0,
      reverse: false,
    });
  });
});

describe('parseRecipe', () => {
  it('should parse a simple text recipe', () => {
    const input = `
      Mon Super Gâteau
      - 200g farine
      - 100g sucre
      1. Mélanger tout
      2. Cuire 30 min
    `;
    const result = parseRecipe(input);
    expect(result.title).toBe('Mon Super Gâteau');
    expect(result.ingredients.length).toBe(2);
    expect(result.ingredients[0].fullText).toBe('200g farine');
    expect(result.steps.length).toBe(2);
    expect(result.steps[0]).toBe('1. Mélanger tout');
  });

  it('should parse a JSON recipe', () => {
    const jsonInput = JSON.stringify({
      title: 'Gâteau au chocolat',
      ingredients: ['3 œufs', '100g de chocolat'],
      steps: ['Faire fondre le chocolat', 'Mélanger avec les œufs', 'Cuire'],
    });
    const result = parseRecipe(jsonInput);
    expect(result.title).toBe('Gâteau au chocolat');
    expect(result.ingredients.length).toBe(2);
    expect(result.ingredients[0].fullText).toBe('3 œufs');
    expect(result.steps.length).toBe(3);
  });

  it('should handle Mealie / recipe instructions for reverse and mijotage', () => {
    const input = `Test Recette Mealie
- Ingrédient
Préparation:
1. Étape avec //2
2. Étape avec //`;
    const result = parseRecipe(input);
    // La notation `//` est désormais normalisée en emojis lisibles (sens inverse).
    expect(result.steps[0]).toBe('1. Étape avec /⏪/🥄2');
    expect(result.steps[1]).toBe('2. Étape avec /⏪/🥄');
  });

  it('should assign a slug if provided for a JSON recipe', () => {
    const jsonInput = JSON.stringify({
      title: 'Gâteau au chocolat',
      ingredients: ['3 œufs', '100g de chocolat'],
      steps: ['Faire fondre le chocolat', 'Mélanger avec les œufs', 'Cuire'],
    });
    const result = parseRecipe(jsonInput, 'gateau-chocolat');
    expect(result.slug).toBe('gateau-chocolat');
  });
});

describe('formatMealieToText', () => {
  it('should format a MealieRecipeDetail into a readable text format', () => {
    const mealieRecipe: MealieRecipeDetail = {
      name: 'Tarte aux pommes',
      recipeIngredient: [
        { display: '1 pâte brisée' },
        { quantity: 3, unit: { name: 'pommes' }, food: { name: 'pommes' } },
        { note: 'Sucre selon goût' },
      ],
      recipeInstructions: [
        { text: 'Étaler la pâte' },
        { text: 'Couper les pommes' },
        { text: 'Mettre au four' },
      ],
    };
    const expectedText = `Tarte aux pommes

Ingrédients:
- 1 pâte brisée
- 3 pommes
- Sucre selon goût

Préparation:
1. Étaler la pâte
2. Couper les pommes
3. Mettre au four
`;
    const result = formatMealieToText(mealieRecipe);
    expect(result).toBe(expectedText);
  });

  it('should handle missing display, quantity, unit, and food gracefully', () => {
    const mealieRecipe: MealieRecipeDetail = {
      name: 'Salade simple',
      recipeIngredient: [
        { note: 'Laitue' },
        { quantity: 1, unit: { name: '' }, food: { name: 'tomate' } },
        { display: undefined, note: undefined, food: { name: 'sel' } }, // Should fall back to food name
      ],
      recipeInstructions: [{ text: 'Laver la salade' }],
    };
    const expectedText = `Salade simple

Ingrédients:
- Laitue
- 1 tomate
- sel

Préparation:
1. Laver la salade
`;
    const result = formatMealieToText(mealieRecipe);
    expect(result).toBe(expectedText);
  });
});
