import { buildEquipmentPromptBlock } from '@/app/lib/equipment';
import { ACCESSORIES_FIELD_INSTRUCTIONS } from '@/app/api/gemini/recipeSchema';

/**
 * Pré-prompt de génération de recette.
 *
 * Le bloc « matériel » est construit à partir de la configuration de
 * l'utilisateur : l'IA ne doit proposer que des étapes réalisables avec les
 * accessoires qu'il possède réellement.
 *
 * `ownedEquipment` absent → configuration par défaut (matériel fourni d'origine).
 */
export const buildPrompt = (ownedEquipment?: unknown): string =>
  `Agis comme un assistant culinaire expert. Je vais te fournir une liste d'ingrédient, des idées ou une recette et tu dois adapter la recette pour utiliser le thermomix. la convertir strictement au format JSON pour mon application de cuisine.

${buildEquipmentPromptBlock(ownedEquipment)}

Voici le schéma JSON attendu :
{
  "title": "Nom de la recette",
  "description": "Courte description de la recette (1-2 phrases)",
  "prepTime": "15 min",
  "cookTime": "30 min",
  "totalTime": "45 min",
  "ingredients": [
    "500g de farine",
    "3 oeufs",
    "1 pincée de sel"
  ],
  "steps": [
    { "text": "Préchauffer le four à 180°C." },
    {
      "text": "Mettre la farine et les oeufs dans le bol. Pétrir 2 min / mode pétrin.",
      "ingredients": ["500g de farine", "3 oeufs"],
      "settings": { "seconds": 120, "speed": "petrin" }
    },
    {
      "text": "Insérer le Découpe-minute et couper les courgettes 40 sec / vitesse 5.",
      "accessories": [{ "id": "decoupe-minute", "cutterMode": "tranches-fines" }],
      "settings": { "seconds": 40, "speed": "5" }
    },
    {
      "text": "Cuire 15 min / 100°C / vitesse 1 / sens inverse.",
      "settings": { "seconds": 900, "temperature": "100", "speed": "1", "reverse": true }
    }
  ]
}

CONSIGNES DE RÉDACTION POUR LES ÉTAPES :
1. Sois concis et direct (impératif).
2. Pour les réglages du robot, utilise cette syntaxe standard dans le texte :
   - Temps : "30 sec", "5 min", "1 h"
   - Température : "37°C", "100°C", "Varoma"
   - Vitesse : "vitesse 3.5", "vitesse mijotage", "mode pétrin", "mode turbo"
3. Options spécifiques :
   - Si nécessaire, ajoute simplement "sens inverse" dans la phrase.
   - Exemple : "Cuire 15 min / 100°C / vitesse 1 / sens inverse."

${ACCESSORIES_FIELD_INSTRUCTIONS}
`;
