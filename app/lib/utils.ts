import { Ingredient, StepParams, Recipe, MealieRecipeDetail } from './types';

export const parseIngredientLine = (line: string): Ingredient => {
  const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
  const stopWords = ['de', 'd\'', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'en', 'à', 'au', 'aux', 'et', 'ou', 'g', 'kg', 'mg', 'l', 'cl', 'ml'];

  const tokens = cleanLine.toLowerCase()
  .replace(/[0-9,.\(\)]+/g, ' ')
  .split(/[\s']+/)
  .filter(w => w.length > 2)
  .filter(w => !stopWords.includes(w));

  return { fullText: cleanLine, keywords: tokens };
};

export const extractStepParams = (text: string): StepParams => {
  let time = "--:--";
  let temp = "---";
  let speed = "---";
  let seconds = 0;
  let reverse = false;

  if (!text) return { time, temp, speed, seconds, reverse };

  // 1. Détection du temps
  const timeMatch = text.match(/(\d+)\s*(sec|min|mn|h)/i);
  if (timeMatch) {
    const val = parseInt(timeMatch[1], 10);
    const unit = timeMatch[2].toLowerCase();
    if (unit.startsWith('s')) { time = `00:${val.toString().padStart(2, '0')}`; seconds = val; }
    else if (unit.startsWith('m')) { time = `${val.toString().padStart(2, '0')}:00`; seconds = val * 60; }
    else if (unit.startsWith('h')) { time = `${val}:00:00`; seconds = val * 3600; }
  }

  // 2. Détection de la température
  const tempMatch = text.match(/(\d+)\s*°|varoma/i);
  if (tempMatch) {
    temp = tempMatch[0].toUpperCase().replace(/\s/g, '');
    if (!temp.includes('C') && !temp.includes('VAROMA')) temp += 'C';
  }

  // 3. Détection de la vitesse et du mode mijotage
  const lowerText = text.toLowerCase();
  if (lowerText.match(/pétrin|pétrir|épi/)) {
    speed = "EPI";
  } else if (lowerText.match(/turbo/)) {
    speed = "TURBO";
  } else {
    // Recherche par mot clé
    const speedMatch = text.match(/(vit|vitesse)\.?\s*(\d+(\.\d+)?(\-\d+)?)|mijotage/i);
    if (speedMatch) {
      speed = speedMatch[0].toLowerCase().includes('mijotage') ? "MIJOT" : speedMatch[2];
    } else {
      // Recherche de vitesse numérique après un slash (ex: /5 ou //3.5)
      const slashSpeedMatch = text.match(/\/\/?(\d+(\.\d+)?)/);
      if (slashSpeedMatch) {
        speed = slashSpeedMatch[1];
      } else if (text.includes('//')) {
        // S'il y a // mais rien après, c'est le mode mijotage par défaut
        speed = "MIJOT";
      }
    }
  }

  // 4. Détection du sens inverse
  if ((text.includes('//') || lowerText.match(/sens inverse|inversé|inverse/)) && speed !== "EPI") {
    reverse = true;
  }

  return { time, temp, speed, seconds, reverse };
};

export const parseRecipe = (text: string, slug?: string): Recipe => {
  // On ignore les lignes d'images type Markdown ![alt](url)
  const imageRegex = /!\[.*\]\(.*\)/;

  const lines = text.split('\n')
  .filter(line => line.trim() !== '')
  .filter(line => !imageRegex.test(line));

  const title = lines[0] || "Recette";
  const ingredients: Ingredient[] = [];
  let steps: string[] = [];
  let currentSection = 'unknown';

  const ingredientKeywords = ['ingrédient', 'ingredients', 'il vous faut', 'liste'];
  const stepKeywords = ['préparation', 'étape', 'instruction', 'recette', 'instructions'];

  const addIngredient = (line: string) => ingredients.push(parseIngredientLine(line));

  const cleanStepText = (line: string): string => {
    // Si // est suivi d'un chiffre, on remplace par "sens inverse"
    if (line.match(/\/\/\d/)) {
      return line.replace(/\/\//g, ' (sens inverse) ');
    }
    // Si // est à la fin ou seul, on précise le mijotage
    if (line.includes('//')) {
      return line.replace(/\/\//g, ' (sens inverse + mijotage) ');
    }
    return line;
  };

  if (lines.length < 5) {
    steps = lines.map(l => cleanStepText(l));
  } else {
    for (let i = 1; i < lines.length; i++) {
      let line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      if (ingredientKeywords.some(k => lowerLine.includes(k)) && line.length < 30) {
        currentSection = 'ingredients';
        continue;
      }
      if (stepKeywords.some(k => lowerLine.includes(k)) && line.length < 30) {
        currentSection = 'steps';
        continue;
      }

      if (currentSection === 'ingredients') {
        addIngredient(line);
      } else if (currentSection === 'steps') {
        line = cleanStepText(line);
        if (line.match(/^\d+\./) || steps.length === 0) steps.push(line);
        else steps[steps.length - 1] += " " + line;
      } else {
        if (line.startsWith('-') || line.startsWith('•')) {
          addIngredient(line);
        } else {
          line = cleanStepText(line);
          steps.push(line);
        }
      }
    }
  }

  if (steps.length === 0) steps = ["Ajoutez vos instructions ici."];
  return { title, ingredients, steps, slug };
};

export const formatMealieToText = (mealieRecipe: MealieRecipeDetail): string => {
  let text = `${mealieRecipe.name}\n\n`;

  text += `Ingrédients:\n`;
  mealieRecipe.recipeIngredient.forEach(ing => {
    const line = ing.display || ing.note || `${ing.quantity || ''} ${ing.unit?.name || ''} ${ing.food?.name || ''}`;
    text += `- ${line}\n`;
  });

  text += `\nPréparation:\n`;
  mealieRecipe.recipeInstructions.forEach((inst, index) => {
    text += `${index + 1}. ${inst.text}\n`;
  });

  return text;
};
