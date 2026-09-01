import { Type } from '@google/genai';
import { CUTTER_MODES, EQUIPMENT, GOBELET_ID } from '@/app/lib/equipment';

/**
 * Structured output imposed on Gemini. Accessories are constrained to the
 * catalogue enum, so the app never guesses them from the step prose.
 */
export const STEP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description: "Instruction de l'étape, à l'impératif.",
    },
    ingredients: {
      type: Type.ARRAY,
      description:
        "Ingrédients utilisés par cette étape, recopiés À L'IDENTIQUE depuis le tableau ingredients de la recette. Vide si l'étape n'en met aucun en œuvre.",
      items: { type: Type.STRING },
    },
    settings: {
      type: Type.OBJECT,
      description:
        "Réglages du robot pour cette étape. Omettre pour une étape sans robot (préchauffer, dresser, servir…).",
      properties: {
        seconds: {
          type: Type.INTEGER,
          description:
            'Durée en SECONDES (5 min = 300, 1 h = 3600). Omettre si pas de minuteur.',
        },
        temperature: {
          type: Type.STRING,
          description:
            'Température en degrés, chiffres seuls ("100"), ou "Varoma". Omettre si pas de chauffe.',
        },
        speed: {
          type: Type.STRING,
          description:
            'Vitesse : "0.5" à "10", ou "mijotage", "petrin", "turbo". "aucune" si le robot ne tourne pas (repos, chauffe sans agitation). Toujours renseigné.',
        },
        reverse: {
          type: Type.BOOLEAN,
          description: 'true pour le sens inverse.',
        },
      },
      // Most often omitted when it accompanies a time and a temperature, so
      // the model is forced to answer rather than skip it.
      required: ['speed'],
    },
    accessories: {
      type: Type.ARRAY,
      description:
        "Accessoires réellement utilisés par cette étape. Vide si l'étape n'en demande aucun.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            enum: EQUIPMENT.map(item => item.id),
          },
          cutterMode: {
            type: Type.STRING,
            enum: CUTTER_MODES.map(mode => mode.id),
            description:
              "Mode de coupe, uniquement quand id vaut 'decoupe-minute'.",
          },
          state: {
            type: Type.STRING,
            enum: ['in-place', 'removed'],
            description:
              "Uniquement pour 'gobelet-doseur' : 'removed' quand l'étape impose de le retirer.",
          },
        },
        required: ['id'],
      },
    },
  },
  required: ['text'],
};

export const RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    prepTime: { type: Type.STRING },
    cookTime: { type: Type.STRING },
    totalTime: { type: Type.STRING },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    steps: { type: Type.ARRAY, items: STEP_SCHEMA },
  },
  required: ['title', 'ingredients', 'steps'],
};

/** Shared by both prompts: the declared fields are authoritative. */
export const ACCESSORIES_FIELD_INSTRUCTIONS = `CHAMPS "settings", "accessories" ET "ingredients" DE CHAQUE ÉTAPE — ce sont eux qui pilotent l'affichage dans l'application, le texte de l'étape n'est JAMAIS analysé. Une étape qui oublie de les renseigner s'affichera sans minuteur, sans matériel et sans ingrédients.

"settings" :
- RÈGLE ABSOLUE : chaque réglage écrit dans le texte doit se retrouver dans "settings". Si le texte dit "5 min / 100°C / vitesse 1", alors settings vaut {"seconds": 300, "temperature": "100", "speed": "1"} — les trois, sans en oublier un seul. Un réglage écrit mais non déclaré n'apparaîtra pas sur le robot.
- "seconds" est en SECONDES : "30 sec" → 30, "5 min" → 300, "1 h" → 3600.
- "temperature" : chiffres seuls ("37", "100") ou "Varoma".
- "speed" est TOUJOURS renseigné quand "settings" est présent : "0.5" à "10", ou "mijotage", "petrin", "turbo", ou "aucune" si le robot ne tourne pas. Une vitesse lente reste une vitesse : "vitesse 1" → "1".
- "reverse" : true uniquement pour le sens inverse.
- Omets le champ entier uniquement pour une étape sans robot (préchauffer le four, dresser, servir, laisser refroidir).

"accessories" :
- Renseigne-le pour chaque étape qui utilise un accessoire, avec les ids exacts suivants : ${EQUIPMENT.map(item => `"${item.id}" (${item.name})`).join(', ')}.
- Omets le champ (ou laisse-le vide) quand l'étape n'utilise que le bol.
- Pour "decoupe-minute", ajoute toujours "cutterMode" parmi : ${CUTTER_MODES.map(mode => `"${mode.id}" (${mode.name})`).join(', ')}.
- Le gobelet doseur est en place sur le couvercle par défaut, ce n'est donc PAS une information : ne déclare "${GOBELET_ID}" que lorsque l'étape impose de le retirer (laisser évaporer, réduire, éviter la surpression), et alors avec "state": "removed". Ne le déclare jamais pour un simple dosage ou une fermeture du bol.
- N'y mets que du matériel réellement disponible, et reste cohérent avec le texte de l'étape.

"ingredients" :
- Liste les ingrédients que l'étape met en œuvre, en recopiant chaque libellé CARACTÈRE POUR CARACTÈRE depuis le tableau "ingredients" de la recette (quantité comprise, ex : "200 g de farine T45", pas "farine").
- Un libellé qui ne correspond pas exactement à une entrée de la liste est ignoré par l'application.
- Un même ingrédient peut être repris par plusieurs étapes : répète son libellé à chaque fois qu'il sert, même partiellement.
- Omets le champ pour une étape qui n'ajoute aucun ingrédient (mixer, cuire, réserver, préchauffer…).`;
