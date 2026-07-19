import { Ingredient, StepParams, Recipe, MealieRecipeDetail } from './types';
import { distance } from 'fastest-levenshtein';

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae');
};

export const isKeywordInText = (keyword: string, text: string): boolean => {
  const normKeyword = normalizeText(keyword);
  const normText = normalizeText(text);

  // On sépare le texte de l'étape en mots individuels (en ignorant la ponctuation)
  const words = normText.split(/[\s,.;:!?\(\)'"’\-]+/);

  for (const word of words) {
    // On ignore les petits mots du texte pour éviter le bruit
    if (word.length < 3 && normKeyword.length >= 3) {
      continue;
    }

    // Correspondance exacte
    if (word === normKeyword) {
      return true;
    }

    // Tolérance dynamique basée sur la taille du mot-clé
    let allowedDistance = 0;

    if (normKeyword.length > 5) {
      allowedDistance = 2; // Grands mots : 2 erreurs max
    } else if (normKeyword.length > 3) {
      allowedDistance = 1; // Mots moyens : 1 erreur max
    }

    // Si on est dans la tolérance de Levenshtein avec fastest-levenshtein
    if (distance(normKeyword, word) <= allowedDistance) {
      return true;
    }

    // Cas spécial pour les pluriels des très petits mots
    if (normKeyword.length <= 3) {
      if (word === normKeyword + 's' || word === normKeyword + 'x') {
        return true;
      }
    }

    // Détection des préfixes pour les mots longs
    if (normKeyword.length >= 4) {
      if (
        (word.startsWith(normKeyword) || normKeyword.startsWith(word)) &&
        Math.abs(word.length - normKeyword.length) <= 2
      ) {
        return true;
      }
    }
  }

  return false;
};

export const parseIngredientLine = (line: string): Ingredient => {
  const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
  const stopWords = new Set([
    // Articles & Prépositions
    'de',
    'd',
    'du',
    'des',
    'le',
    'la',
    'les',
    'un',
    'une',
    'en',
    'a',
    'au',
    'aux',
    'et',
    'ou',
    'pour',
    'avec',
    'sans',
    // Unités courtes
    'g',
    'kg',
    'mg',
    'l',
    'cl',
    'ml',
    'dl',
    'c',
    'cs',
    'cc',
    'cas',
    'cac',
    // Unités longues
    'gramme',
    'grammes',
    'kilo',
    'kilos',
    'litre',
    'litres',
    'cuillere',
    'cuilleres',
    'pincee',
    'pincees',
    'poignee',
    'poignees',
    'verre',
    'verres',
    'tasse',
    'tasses',
    'bol',
    'bols',
    'gousse',
    'gousses',
    'tranche',
    'tranches',
    'morceau',
    'morceaux',
    'sachet',
    'sachets',
    'boite',
    'boites',
    'paquet',
    'paquets',
    'filet',
    'filets',
    'zeste',
    'zestes',
    'brin',
    'brins',
    'feuille',
    'feuilles',
    'branche',
    'branches',
    'botte',
    'bottes',
    'cafe',
    'soupe',
    // Adjectifs & Modificateurs courants
    'facultatif',
    'optionnel',
    'environ',
    'quelques',
    'frais',
    'fraiche',
    'gros',
    'grosse',
    'petit',
    'petite',
    'moyen',
    'moyenne',
    'hache',
    'hachee',
    'coupe',
    'coupee',
    'entier',
    'entiere',
    'battu',
    'battue',
    'moulu',
    'moulue',
    'rape',
    'rapee',
    'bien',
    'tres',
    'peu',
    'plus',
    'moins',
    'selon',
    'gout',
  ]);

  const tokens = cleanLine
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // On enlève les accents pour faciliter le filtrage
    .replace(/[0-9,.\(\)]+/g, ' ')
    .split(/[\s']+/)
    .filter(w => w.length > 2)
    .filter(w => !stopWords.has(w));

  return { fullText: cleanLine, keywords: tokens };
};

export const extractStepParams = (text: string): StepParams => {
  let time = '--:--';
  let temp = '---';
  let speed = '---';
  let seconds = 0;
  let reverse = false;

  if (!text) {
    return { time, temp, speed, seconds, reverse };
  }

  // 1. Détection du temps
  const timeMatch = text.match(/(\d+)\s*(sec|min|mn|h)/i);

  if (timeMatch) {
    const val = parseInt(timeMatch[1], 10);
    const unit = timeMatch[2].toLowerCase();

    if (unit.startsWith('s')) {
      time = `00:${val.toString().padStart(2, '0')}`;
      seconds = val;
    } else if (unit.startsWith('m')) {
      time = `${val.toString().padStart(2, '0')}:00`;
      seconds = val * 60;
    } else if (unit.startsWith('h')) {
      time = `${val}:00:00`;
      seconds = val * 3600;
    }
  }

  // 2. Détection de la température
  const tempMatch = text.match(/(\d+)\s*°|varoma/i);

  if (tempMatch) {
    temp = tempMatch[0].toUpperCase().replace(/\s/g, '');

    if (!temp.includes('C') && !temp.includes('VAROMA')) {
      temp += 'C';
    }
  }

  // 3. Détection de la vitesse et du mode mijotage
  const lowerText = text.toLowerCase();

  if (lowerText.match(/pétrin|pétrir|épi/)) {
    speed = 'EPI';
  } else if (lowerText.match(/turbo/)) {
    speed = 'TURBO';
  } else {
    // Recherche par mot clé
    const speedMatch = text.match(
      /(vit|vitesse)\.?\s*(\d+(\.\d+)?(\-\d+)?)|mijotage|🥄/i,
    );

    if (speedMatch) {
      speed = speedMatch[0].toLowerCase().match(/mijotage|🥄/)
        ? 'MIJOT'
        : speedMatch[2];
    } else {
      // Recherche de vitesse numérique après un slash (ex: /5 ou //3.5)
      const slashSpeedMatch = text.match(/\/\/?(\d+(\.\d+)?)/);

      if (slashSpeedMatch) {
        speed = slashSpeedMatch[1];
      } else if (text.includes('//')) {
        // S'il y a // mais rien après, c'est le mode mijotage par défaut
        speed = 'MIJOT';
      }
    }
  }

  // 4. Détection du sens inverse
  if (
    (text.includes('//') || lowerText.match(/sens inverse|inversé|inverse|⏪/)) &&
    speed !== 'EPI'
  ) {
    reverse = true;
  }

  return { time, temp, speed, seconds, reverse };
};

// Fonction utilitaire pour nettoyer le texte des étapes (gestion des //)
const cleanStepText = (line: string): string => {
  return corrigerInstructionsThermomix(line);
};

function corrigerInstructionsThermomix(texte: string): string {
  if (!texte) {return "";}

  // Cas 1 : Remplacement de //vitesse par "sens inverse / vitesse"
  // On utilise le flag 'g' pour remplacer toutes les occurrences
  let texteCorrige = texte.replace(/\/\/vitesse\s*([\d.]+)/g, " /⏪/vitesse $1");

  // Cas 2 : Remplacement de // seul (souvent en fin de phrase ou après la température)
  // On utilise un lookahead négatif (?!...) pour vérifier que ce n'est pas suivi de "vitesse"
  texteCorrige = texteCorrige.replace(/\/\/(?!\s*vitesse)/g, " /⏪/🥄");

  // Nettoyage des doubles espaces potentiels et espaces en début/fin
  return texteCorrige.replace(/\s\s+/g, ' ').trim();
}

export interface RecipeMetadata {
  description?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
}

export const parseRecipe = (
  input: string,
  slug?: string,
  orgURL?: string,
  metadata?: RecipeMetadata,
): Recipe => {
  try {
    const trimmedInput = input.trim();

    if (trimmedInput.startsWith('{') && trimmedInput.endsWith('}')) {
      const jsonRecipe = JSON.parse(trimmedInput);

      if (jsonRecipe.title && Array.isArray(jsonRecipe.steps)) {
        return {
          title: jsonRecipe.title,
          description: jsonRecipe.description || metadata?.description,
          prepTime: jsonRecipe.prepTime || metadata?.prepTime,
          cookTime: jsonRecipe.cookTime || metadata?.cookTime,
          totalTime: jsonRecipe.totalTime || metadata?.totalTime,
          ingredients: Array.isArray(jsonRecipe.ingredients)
            ? jsonRecipe.ingredients.map((ing: string) =>
                parseIngredientLine(ing),
              )
            : [],
          steps: jsonRecipe.steps.map((step: string) => corrigerInstructionsThermomix(step)),
          slug,
          orgURL,
        };
      }
    }
  } catch {
    console.log('Input is not valid JSON, falling back to text parsing.');
  }

  // 2. PARSING TEXTE CLASSIQUE (Fallback)
  // On ignore les lignes d'images type Markdown ![alt](url)
  const imageRegex = /!\[.*\]\(.*\)/;

  const lines = input
    .split('\n')
    .filter(line => line.trim() !== '')
    .filter(line => !imageRegex.test(line));

  const title = lines[0].trim() || 'Recette';
  const ingredients: Ingredient[] = [];
  let steps: string[] = [];
  let currentSection = 'unknown';

  const ingredientKeywords = [
    /^(ingrédients?|ingredients?|il vous faut|liste):?$/i,
  ];
  const stepKeywords = [
    /^(préparation|étape|instruction|recette|instructions):?$/i,
  ];

  const addIngredient = (line: string) =>
    ingredients.push(parseIngredientLine(line));

  // Small recipes with less than 5 lines are treated as steps
  if (lines.length < 5) {
    steps = lines.map(l => cleanStepText(l));
  } else {
    for (let i = 1; i < lines.length; i++) {
      let line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      if (ingredientKeywords.some(re => re.test(lowerLine))) {
        currentSection = 'ingredients';
        continue;
      }

      if (stepKeywords.some(re => re.test(lowerLine))) {
        currentSection = 'steps';
        continue;
      }

      if (currentSection === 'ingredients') {
        addIngredient(line);
      } else if (currentSection === 'steps') {
        line = cleanStepText(line);

        if (line.match(/^\d+\./) || steps.length === 0) {
          steps.push(line);
        } else {
          steps[steps.length - 1] += ' ' + line;
        }
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

  if (steps.length === 0) {
    steps = ['Ajoutez vos instructions ici.'];
  }

  return {
    title,
    description: metadata?.description,
    prepTime: metadata?.prepTime,
    cookTime: metadata?.cookTime,
    totalTime: metadata?.totalTime,
    ingredients,
    steps,
    slug,
    orgURL,
  };
};

export const formatMealieToText = (
  mealieRecipe: MealieRecipeDetail,
): string => {
  let text = `${mealieRecipe.name}\n\n`;

  text += `Ingrédients:\n`;
  mealieRecipe.recipeIngredient.forEach(ing => {
    let line = '';

    if (ing.display) {
      line = ing.display;
    } else if (ing.note) {
      line = ing.note;
    } else {
      const parts = [];

      if (ing.quantity) {
        parts.push(ing.quantity);
      }

      if (ing.unit?.name) {
        parts.push(ing.unit.name);
      }

      if (ing.food?.name && ing.food.name !== ing.unit?.name) {
        parts.push(ing.food.name);
      }
      line = parts.join(' ');
    }
    text += `- ${line}\n`;
  });

  text += `\nPréparation:\n`;
  mealieRecipe.recipeInstructions.forEach((inst, index) => {
    text += `${index + 1}. ${inst.text}\n`;
  });

  return text;
};
