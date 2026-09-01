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

export const EMPTY_STEP_PARAMS: StepParams = {
  time: '--:--',
  temp: '---',
  speed: '---',
  seconds: 0,
  reverse: false,
};

/** Durée en secondes → affichage du cadran ("00:45", "05:00", "1:00:00"). */
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

/** Vitesses nommées du robot → code affiché sur le cadran. */
const NAMED_SPEEDS: Record<string, string> = {
  mijotage: 'MIJOT',
  petrin: 'EPI',
  epi: 'EPI',
  turbo: 'TURBO',
};

/**
 * Réglages déclarés (schéma 2) → valeurs d'affichage.
 *
 * Aucune lecture du texte de l'étape ici : ce que le modèle n'a pas déclaré
 * n'existe pas.
 *
 * Accepte aussi un `StepParams` déjà résolu (`temp` au lieu de `temperature`),
 * pour qu'une recette relue depuis Firestore repasse par ici sans se dégrader.
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
  // "aucune" est la façon dont le modèle dit « le robot ne tourne pas » : le
  // champ est obligatoire, il faut bien qu'il puisse répondre ça.
  const speed =
    !rawSpeed || normalizedSpeed === 'aucune'
      ? EMPTY_STEP_PARAMS.speed
      : (NAMED_SPEEDS[normalizedSpeed] ?? rawSpeed);

  return {
    time: formatStepTime(seconds),
    // Une température vide mais mal formée ("°C" seul) ne vaut rien.
    temp: temp === '°C' ? EMPTY_STEP_PARAMS.temp : temp,
    speed,
    seconds,
    // Le pétrin n'a pas de sens inverse, comme dans l'extraction texte.
    reverse: declared.reverse === true && speed !== 'EPI',
  };
};

/** Une étape sans minuteur, sans température, sans vitesse : rien à afficher. */
const hasStepParams = (params: StepParams): boolean =>
  params.seconds > 0 ||
  params.temp !== EMPTY_STEP_PARAMS.temp ||
  params.speed !== EMPTY_STEP_PARAMS.speed ||
  params.reverse;

/**
 * Repère les accessoires mentionnés dans une étape, pour afficher un visuel
 * dédié pendant la cuisson.
 *
 * Heuristique réservée aux recettes qui n'arrivent que sous forme de texte
 * (Mealie, copier-coller manuel) : les recettes générées déclarent leurs
 * accessoires dans le JSON, sans passer par ces motifs.
 *
 * `temp` (issue d'`extractStepParams`) permet d'attraper le Varoma quand il
 * n'apparaît que comme température, sans être nommé dans la phrase.
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
      // Le motif du gobelet ne matche que son retrait (cf. catalogue).
      accessories.push({ id: item.id, state: 'removed' });
    } else {
      accessories.push({ id: item.id });
    }
  }

  return accessories;
};

/**
 * Ne garde que les accessoires connus du catalogue, sans doublon. Un id inventé
 * par le modèle, ou un mode de coupe sur autre chose que le Découpe-minute, est
 * écarté plutôt que propagé jusqu'à l'UI.
 */
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

    // Le gobelet est en place par défaut : une étape qui le « demande » sans
    // préciser son retrait n'apprend rien, on l'écarte.
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
 * Version courante du schéma de recette.
 *
 * 1 (ou absent) — étapes en texte brut : accessoires et ingrédients sont
 *   déduits du texte par heuristique. C'est la forme des recettes
 *   sauvegardées avant la sortie structurée, et la seule possible pour Mealie
 *   et le copier-coller manuel.
 * 2 — étapes structurées : l'étape déclare ses accessoires et ses ingrédients,
 *   on lui fait confiance et aucune heuristique ne tourne.
 */
export const RECIPE_SCHEMA_VERSION = 2;

/** Une version absente vaut 1 : les recettes d'avant le schéma structuré. */
export const isStructuredSchema = (schemaVersion?: unknown): boolean =>
  typeof schemaVersion === 'number' && schemaVersion >= 2;

/**
 * En mode structuré, `ingredients` est obligatoire : les étapes référencent les
 * ingrédients par leur libellé, et sans la liste pour les résoudre ils seraient
 * silencieusement perdus. Le typage force l'appelant à la fournir.
 */
export type NormalizeStepsOptions =
  | { structured: true; ingredients: Ingredient[] }
  | { structured?: false; ingredients?: Ingredient[] };

/**
 * Ramène des étapes de provenance quelconque au type `RecipeStep`.
 *
 * En mode structuré les déclarations du modèle font foi ; sinon accessoires et
 * ingrédients sont déduits du texte. Les `string[]` restent acceptés : c'est la
 * forme des recettes en schéma 1 et celle du parsing texte.
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

      // Schéma 2 : aucune heuristique. Ce que le modèle n'a pas déclaré est
      // simplement absent — on n'ira pas le chercher dans la prose.
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
 * Résout les ingrédients déclarés par une étape contre ceux de la recette, par
 * égalité normalisée (casse, accents, espaces).
 *
 * Un libellé qui ne correspond à rien est écarté : mieux vaut ne rien afficher
 * qu'un ingrédient inventé. Le même ingrédient peut être réclamé par plusieurs
 * étapes — c'est une référence, pas une consommation.
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

/** Ingrédients de la recette mentionnés dans le texte de l'étape (schéma 1). */
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

/** N'ajoute les champs optionnels au `RecipeStep` que s'ils portent quelque chose. */
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

/**
 * Étape issue de texte libre : réglages, accessoires et ingrédients sont
 * extraits du texte, faute d'être déclarés.
 */
const buildTextStep = (raw: string, ingredients: Ingredient[]): RecipeStep => {
  const text = cleanStepText(raw);
  const params = extractStepParams(text);

  return withOptionalFields(text, {
    accessories: detectStepAccessories(text, params.temp),
    ingredients: matchIngredientsInText(text, ingredients),
    params,
  });
};

// Fonction utilitaire pour nettoyer le texte des étapes (gestion des //)
export const cleanStepText = (line: string): string => {
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
    // Un bloc ```json entoure parfois la réponse d'un modèle : on le retire
    // plutôt que de retomber sur le parsing texte, qui prendrait la clôture du
    // fence pour un titre et chaque ligne de JSON pour une étape.
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
