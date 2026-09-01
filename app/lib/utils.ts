import {
  Ingredient,
  StepParams,
  Recipe,
  RecipeStep,
  StepAccessory,
  StepSettings,
  MealieRecipeDetail,
} from './types';
import { distance } from 'fastest-levenshtein';
import {
  CUTTER_ID,
  CUTTER_MODES,
  EQUIPMENT,
  GOBELET_ID,
  VAROMA_ID,
  getCutterMode,
  getEquipmentItem,
} from './equipment';

export type { RecipeStep, StepAccessory };

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

  const words = normText.split(/[\s,.;:!?\(\)'"’\-]+/);

  for (const word of words) {
    if (word.length < 3 && normKeyword.length >= 3) {
      continue;
    }

    if (word === normKeyword) {
      return true;
    }

    let allowedDistance = 0;

    if (normKeyword.length > 5) {
      allowedDistance = 2; // Grands mots : 2 erreurs max
    } else if (normKeyword.length > 3) {
      allowedDistance = 1; // Mots moyens : 1 erreur max
    }

    if (distance(normKeyword, word) <= allowedDistance) {
      return true;
    }

    // Plurals of words too short for the Levenshtein tolerance above.
    if (normKeyword.length <= 3) {
      if (word === normKeyword + 's' || word === normKeyword + 'x') {
        return true;
      }
    }

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
    // Articles and prepositions
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
    // Short units
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
    // Long units
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
    // Common adjectives and modifiers
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

  const tempMatch = text.match(/(\d+)\s*°|varoma/i);

  if (tempMatch) {
    temp = tempMatch[0].toUpperCase().replace(/\s/g, '');

    if (!temp.includes('C') && !temp.includes('VAROMA')) {
      temp += 'C';
    }
  }

  const lowerText = text.toLowerCase();

  if (lowerText.match(/pétrin|pétrir|épi/)) {
    speed = 'EPI';
  } else if (lowerText.match(/turbo/)) {
    speed = 'TURBO';
  } else {
    const speedMatch = text.match(
      /(vit|vitesse)\.?\s*(\d+(\.\d+)?(\-\d+)?)|mijotage|🥄/i,
    );

    if (speedMatch) {
      speed = speedMatch[0].toLowerCase().match(/mijotage|🥄/)
        ? 'MIJOT'
        : speedMatch[2];
    } else {
      // Speed written after a slash, e.g. /5 or //3.5.
      const slashSpeedMatch = text.match(/\/\/?(\d+(\.\d+)?)/);

      if (slashSpeedMatch) {
        speed = slashSpeedMatch[1];
      } else if (text.includes('//')) {
        // A bare // means simmer speed.
        speed = 'MIJOT';
      }
    }
  }

  if (
    (text.includes('//') || lowerText.match(/sens inverse|inversé|inverse|⏪/)) &&
    speed !== 'EPI'
  ) {
    reverse = true;
  }

  return { time, temp, speed, seconds, reverse };
};

export const EMPTY_STEP_PARAMS: StepParams = {
  time: '--:--',
  temp: '---',
  speed: '---',
  seconds: 0,
  reverse: false,
};

/** Seconds to dial display ("00:45", "05:00", "1:00:00"). */
const formatStepTime = (seconds: number): string => {
  if (seconds <= 0) {
    return EMPTY_STEP_PARAMS.time;
  }

  if (seconds < 60) {
    return `00:${seconds.toString().padStart(2, '0')}`;
  }

  if (seconds < 3600) {
    return `${Math.round(seconds / 60).toString().padStart(2, '0')}:00`;
  }

  return `${Math.floor(seconds / 3600)}:00:00`;
};

/** Named speeds to the code shown on the dial. */
const NAMED_SPEEDS: Record<string, string> = {
  mijotage: 'MIJOT',
  petrin: 'EPI',
  epi: 'EPI',
  turbo: 'TURBO',
};

/**
 * Declared settings (schema 2) to display values. Never reads the step text.
 * Also accepts an already-resolved `StepParams` (`temp` rather than
 * `temperature`) so a recipe re-read from Firestore survives a second pass.
 */
export const resolveStepSettings = (value: unknown): StepParams => {
  const declared = (value || {}) as StepSettings & { temp?: string };

  const seconds =
    typeof declared.seconds === 'number' &&
    Number.isFinite(declared.seconds) &&
    declared.seconds > 0
      ? Math.round(declared.seconds)
      : 0;

  const rawTemp = (declared.temperature ?? declared.temp ?? '').trim();
  const temp = !rawTemp
    ? EMPTY_STEP_PARAMS.temp
    : normalizeText(rawTemp).includes('varoma')
      ? 'VAROMA'
      : `${rawTemp.replace(/[^\d]/g, '')}°C`;

  const rawSpeed = (declared.speed || '').trim();
  const normalizedSpeed = normalizeText(rawSpeed);
  // "aucune" is how the model says the blades do not turn; speed is required.
  const speed =
    !rawSpeed || normalizedSpeed === 'aucune'
      ? EMPTY_STEP_PARAMS.speed
      : (NAMED_SPEEDS[normalizedSpeed] ?? rawSpeed);

  return {
    time: formatStepTime(seconds),
    // A malformed temperature (bare "°C") is worth nothing.
    temp: temp === '°C' ? EMPTY_STEP_PARAMS.temp : temp,
    speed,
    seconds,
    // Kneading has no reverse, same rule as the text extraction.
    reverse: declared.reverse === true && speed !== 'EPI',
  };
};

/** No timer, no temperature, no speed: nothing worth attaching. */
const hasStepParams = (params: StepParams): boolean =>
  params.seconds > 0 ||
  params.temp !== EMPTY_STEP_PARAMS.temp ||
  params.speed !== EMPTY_STEP_PARAMS.speed ||
  params.reverse;

/**
 * Guesses the accessories a step needs. Reserved for text-only recipes (Mealie,
 * manual paste) — generated ones declare theirs in the JSON.
 *
 * `temp` catches the Varoma when it appears only as a temperature.
 */
export const detectStepAccessories = (
  text: string,
  temp?: string,
): StepAccessory[] => {
  const normalized = normalizeText(text || '');
  const isVaromaTemp = (temp || '').toUpperCase().includes('VAROMA');

  const accessories: StepAccessory[] = [];

  for (const item of EQUIPMENT) {
    const matches =
      item.pattern.test(normalized) || (item.id === VAROMA_ID && isVaromaTemp);

    if (!matches) {
      continue;
    }

    if (item.id === CUTTER_ID) {
      const mode = CUTTER_MODES.find(m => m.pattern.test(normalized));

      accessories.push({ id: item.id, cutterMode: mode?.id });
    } else if (item.id === GOBELET_ID) {
      // The catalogue pattern only matches its removal.
      accessories.push({ id: item.id, state: 'removed' });
    } else {
      accessories.push({ id: item.id });
    }
  }

  return accessories;
};

/** Keeps only catalogue accessories, deduplicated; invented ids are dropped. */
export const sanitizeStepAccessories = (value: unknown): StepAccessory[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const accessories: StepAccessory[] = [];

  for (const raw of value) {
    const id =
      typeof raw === 'string'
        ? raw
        : typeof (raw as StepAccessory)?.id === 'string'
          ? (raw as StepAccessory).id
          : undefined;

    if (!id || !getEquipmentItem(id) || seen.has(id)) {
      continue;
    }

    // The cup sits on the lid by default: only its removal is information.
    if (id === GOBELET_ID) {
      if ((raw as StepAccessory)?.state !== 'removed') {
        continue;
      }

      seen.add(id);
      accessories.push({ id, state: 'removed' });
      continue;
    }

    seen.add(id);

    const mode =
      id === CUTTER_ID ? (raw as StepAccessory)?.cutterMode : undefined;

    accessories.push(
      mode && getCutterMode(mode) ? { id, cutterMode: mode } : { id },
    );
  }

  return accessories;
};

/**
 * 1 (or absent) — plain-text steps, everything inferred by heuristics.
 * 2 — the step declares its settings, accessories and ingredients; no heuristic
 *     runs and the declaration is trusted.
 */
export const RECIPE_SCHEMA_VERSION = 2;

/** An absent version means 1: recipes predating the structured schema. */
export const isStructuredSchema = (schemaVersion?: unknown): boolean =>
  typeof schemaVersion === 'number' && schemaVersion >= 2;

/**
 * `ingredients` is required in structured mode: steps reference ingredients by
 * label, and without the list to resolve against they would be silently lost.
 */
export type NormalizeStepsOptions =
  | { structured: true; ingredients: Ingredient[] }
  | { structured?: false; ingredients?: Ingredient[] };

/**
 * Normalises steps of any provenance. `string[]` stays accepted: that is the
 * schema-1 shape and what the text parser produces.
 */
export const normalizeSteps = (
  value: unknown,
  options: NormalizeStepsOptions = {},
): RecipeStep[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const { ingredients = [], structured = false } = options;

  return value
    .map((raw): RecipeStep | null => {
      if (typeof raw === 'string') {
        return buildTextStep(raw, ingredients);
      }

      const rawText = (raw as RecipeStep)?.text;

      if (typeof rawText !== 'string' || rawText.trim() === '') {
        return null;
      }

      if (!structured) {
        return buildTextStep(rawText, ingredients);
      }

      // Schema 2: what the model did not declare is simply absent.
      return withOptionalFields(cleanStepText(rawText), {
        accessories: sanitizeStepAccessories((raw as RecipeStep).accessories),
        ingredients: resolveDeclaredIngredients(
          (raw as RecipeStep).ingredients,
          ingredients,
        ),
        params: resolveStepSettings(
          (raw as { settings?: unknown }).settings ??
            (raw as RecipeStep).params,
        ),
      });
    })
    .filter((step): step is RecipeStep => step !== null);
};

/**
 * Resolves declared labels against the recipe's ingredients by normalised
 * equality. An unmatched label is dropped rather than invented, and the same
 * ingredient may be claimed by several steps — it is a reference, not a spend.
 */
const resolveDeclaredIngredients = (
  declared: unknown,
  ingredients: Ingredient[],
): string[] => {
  if (!Array.isArray(declared) || ingredients.length === 0) {
    return [];
  }

  const byNormalized = new Map(
    ingredients.map(ing => [normalizeText(ing.fullText).trim(), ing.fullText]),
  );
  const resolved: string[] = [];

  for (const label of declared) {
    if (typeof label !== 'string') {
      continue;
    }

    const match = byNormalized.get(normalizeText(label).trim());

    if (match && !resolved.includes(match)) {
      resolved.push(match);
    }
  }

  return resolved;
};

/** Recipe ingredients mentioned in the step text (schema 1). */
const matchIngredientsInText = (
  text: string,
  ingredients: Ingredient[],
): string[] =>
  ingredients
    .filter(
      ing =>
        ing.keywords.length > 0 &&
        ing.keywords.some(keyword => isKeywordInText(keyword, text)),
    )
    .map(ing => ing.fullText);

/** Adds optional fields only when they carry something. */
const withOptionalFields = (
  text: string,
  fields: {
    accessories: StepAccessory[];
    ingredients: string[];
    params: StepParams;
  },
): RecipeStep => ({
  text,
  ...(fields.accessories.length > 0 ? { accessories: fields.accessories } : {}),
  ...(fields.ingredients.length > 0 ? { ingredients: fields.ingredients } : {}),
  ...(hasStepParams(fields.params) ? { params: fields.params } : {}),
});

/** Free-text step: settings, accessories and ingredients are inferred. */
const buildTextStep = (raw: string, ingredients: Ingredient[]): RecipeStep => {
  const text = cleanStepText(raw);
  const params = extractStepParams(text);

  return withOptionalFields(text, {
    accessories: detectStepAccessories(text, params.temp),
    ingredients: matchIngredientsInText(text, ingredients),
    params,
  });
};

export const cleanStepText = (line: string): string => {
  return corrigerInstructionsThermomix(line);
};

function corrigerInstructionsThermomix(texte: string): string {
  if (!texte) {return "";}

  let texteCorrige = texte.replace(/\/\/vitesse\s*([\d.]+)/g, " /⏪/vitesse $1");

  texteCorrige = texteCorrige.replace(/\/\/(?!\s*vitesse)/g, " /⏪/🥄");

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
    // A model sometimes wraps its answer in a ```json fence; strip it rather
    // than fall through to the text parser, which would read the fence as a
    // title and every JSON line as a step.
    const trimmedInput = input
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/, '')
      .trim();

    if (trimmedInput.startsWith('{') && trimmedInput.endsWith('}')) {
      const jsonRecipe = JSON.parse(trimmedInput);
      const ingredients: Ingredient[] = Array.isArray(jsonRecipe.ingredients)
        ? jsonRecipe.ingredients.map((ing: string) => parseIngredientLine(ing))
        : [];
      const structured = isStructuredSchema(jsonRecipe.schemaVersion);
      const steps = normalizeSteps(jsonRecipe.steps, { ingredients, structured });

      if (jsonRecipe.title && steps.length > 0) {
        return {
          title: jsonRecipe.title,
          description: jsonRecipe.description || metadata?.description,
          prepTime: jsonRecipe.prepTime || metadata?.prepTime,
          cookTime: jsonRecipe.cookTime || metadata?.cookTime,
          totalTime: jsonRecipe.totalTime || metadata?.totalTime,
          ingredients,
          steps,
          slug,
          orgURL,
          ...(structured ? { schemaVersion: jsonRecipe.schemaVersion } : {}),
        };
      }
    }
  } catch {
    console.log('Input is not valid JSON, falling back to text parsing.');
  }

  // Skip Markdown image lines.
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

  // Under 5 lines, everything is a step.
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
    steps: normalizeSteps(steps, { ingredients }),
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
