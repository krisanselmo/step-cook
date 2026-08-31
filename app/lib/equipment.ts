/**
 * Catalogue du matériel Thermomix.
 *
 * Ce module est volontairement pur (pas de React, pas d'icônes) : il est importé
 * aussi bien par l'UI que par les routes API Gemini, qui s'en servent pour
 * construire le pré-prompt décrivant le matériel réellement possédé.
 */

export interface EquipmentItem {
  id: string;
  name: string;
  /** Une ligne d'explication affichée sous le nom dans la modale de config. */
  description: string;
  /** Accessoire fourni d'origine avec le robot : coché par défaut. */
  defaultOwned: boolean;
  /** Formulation injectée dans le pré-prompt Gemini. */
  promptHint: string;
  /**
   * Détection de l'accessoire dans le texte d'une étape. Le texte est normalisé
   * (minuscules, sans accents) avant le test : les motifs s'écrivent donc sans
   * accent.
   */
  pattern: RegExp;
}

export const VAROMA_ID = 'varoma';
export const CUTTER_ID = 'decoupe-minute';

export const EQUIPMENT: EquipmentItem[] = [
  {
    id: VAROMA_ID,
    name: 'Varoma',
    description: 'Cuisson vapeur sur deux niveaux (récipient + plateau)',
    defaultOwned: true,
    promptHint:
      'Varoma : cuisson vapeur sur deux niveaux (récipient et plateau). La température s\'écrit "Varoma".',
    pattern: /\bvaroma\b/,
  },
  {
    id: 'panier-cuisson',
    name: 'Panier de cuisson',
    description: 'Cuisson douce immergée, égouttage et filtration',
    defaultOwned: true,
    promptHint:
      'Panier de cuisson : cuisson immergée dans le bol, égouttage, filtration.',
    pattern: /panier (de )?cuisson|\bpanier\b/,
  },
  {
    id: 'fouet',
    name: 'Fouet (papillon)',
    description: 'Monter les blancs, émulsionner, crème fouettée',
    defaultOwned: true,
    promptHint:
      'Fouet (papillon) : monter les blancs et la crème, émulsionner. Vitesse 3 à 4 maximum.',
    pattern: /\bfouet\b|papillon/,
  },
  {
    id: 'gobelet-doseur',
    name: 'Gobelet doseur',
    description: 'Doser les liquides et fermer le bol',
    defaultOwned: true,
    promptHint:
      'Gobelet doseur : dosage des liquides et fermeture du bol (à retirer pour laisser évaporer).',
    pattern: /gobelet/,
  },
  {
    id: 'spatule',
    name: 'Spatule',
    description: 'Mélanger et racler le bol sans risque',
    defaultOwned: true,
    promptHint: 'Spatule : mélanger et racler les parois du bol.',
    pattern: /spatule/,
  },
  {
    id: CUTTER_ID,
    name: 'Découpe-minute',
    description: 'Accessoire de découpe officiel, 4 modes de coupe',
    defaultOwned: false,
    promptHint:
      'Découpe-minute : accessoire de découpe officiel qui tranche et râpe les légumes directement dans le bol.',
    pattern: /decoupe[- ]minute|decoupe[- ]legumes|coupe[- ]legumes|\bcutter\b/,
  },
  {
    id: 'eplucheur',
    name: 'Épluche-légumes',
    description: 'Éplucher pommes de terre et carottes en vrac',
    defaultOwned: false,
    promptHint:
      'Épluche-légumes (Peeler) : épluchage en vrac des pommes de terre et carottes dans le bol.',
    pattern: /eplucheur|epluche[- ]legumes|\bpeeler\b/,
  },
  {
    id: 'couvercle-lames',
    name: 'Couvercle de lames',
    description: 'Mijoter sans abîmer les morceaux',
    defaultOwned: false,
    promptHint:
      'Couvercle de lames : protège les aliments fragiles pendant un mijotage prolongé.',
    pattern: /couvercle de lames|blade cover/,
  },
  {
    id: 'bol-supplementaire',
    name: 'Bol supplémentaire',
    description: 'Enchaîner deux préparations sans laver le bol',
    defaultOwned: false,
    promptHint:
      'Bol supplémentaire : permet d\'enchaîner deux préparations sans laver le bol entre les deux.',
    pattern: /bol supplementaire|second bol|deuxieme bol/,
  },
  {
    id: 'sensor',
    name: 'Sonde Sensor',
    description: 'Cuisson à cœur pilotée par la température',
    defaultOwned: false,
    promptHint:
      'Sonde Sensor : mesure la température à cœur des viandes et préparations.',
    pattern: /\bsensor\b|sonde/,
  },
];

export type CutterModeId =
  | 'tranches-fines'
  | 'tranches-epaisses'
  | 'rape-fin'
  | 'rape-epais';

export interface CutterMode {
  id: CutterModeId;
  name: string;
  /** Épaisseur / grain indicatif, affiché sous le nom du mode. */
  detail: string;
  /** Vitesse conseillée pour ce mode. */
  speed: string;
  pattern: RegExp;
}

/**
 * Les 4 modes du Découpe-minute (deux disques, chacun à double face).
 */
export const CUTTER_MODES: CutterMode[] = [
  {
    id: 'tranches-fines',
    name: 'Tranches fines',
    detail: '≈ 1 mm — courgettes, concombres, pommes de terre',
    speed: 'vitesse 5',
    pattern: /tranches? fines?|fines tranches|emince[er]? fin|1 ?mm/,
  },
  {
    id: 'tranches-epaisses',
    name: 'Tranches épaisses',
    detail: '≈ 3 mm — gratins, chips, poêlées',
    speed: 'vitesse 5',
    pattern: /tranches? epaisses?|epaisses? tranches?|3 ?mm/,
  },
  {
    id: 'rape-fin',
    name: 'Râpé fin',
    detail: 'Carottes râpées, fromage, salades',
    speed: 'vitesse 6',
    pattern: /rap[ei]e?s? fine?s?|finement rap|julienne fine/,
  },
  {
    id: 'rape-epais',
    name: 'Râpé épais',
    detail: 'Rösti, galettes, gratins de légumes',
    speed: 'vitesse 6',
    pattern: /rap[ei]e?s? (gros|epais)|gros(se)? rap|rosti/,
  },
];

/** Ids du matériel fourni d'origine, valeur par défaut de la configuration. */
export const DEFAULT_EQUIPMENT_IDS: string[] = EQUIPMENT.filter(
  item => item.defaultOwned,
).map(item => item.id);

export const getEquipmentItem = (id: string): EquipmentItem | undefined =>
  EQUIPMENT.find(item => item.id === id);

export const getCutterMode = (id: string): CutterMode | undefined =>
  CUTTER_MODES.find(mode => mode.id === id);

/**
 * Nettoie une configuration venue du localStorage ou d'un appel API : ne garde
 * que des ids connus, sans doublon. Une valeur inexploitable retombe sur la
 * configuration par défaut, pour ne jamais laisser l'IA sans matériel.
 */
export const sanitizeEquipmentIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [...DEFAULT_EQUIPMENT_IDS];
  }

  const known = value.filter(
    (id): id is string => typeof id === 'string' && !!getEquipmentItem(id),
  );

  return [...new Set(known)];
};

/**
 * Bloc « matériel » du pré-prompt Gemini : ce dont l'utilisateur dispose, ce
 * qu'il n'a pas (et qui est donc interdit), et les consignes de rédaction des
 * accessoires qui ont une syntaxe propre.
 *
 * `ownedIds` absent (ancien client, appel direct) → configuration par défaut.
 */
export const buildEquipmentPromptBlock = (ownedIds?: unknown): string => {
  const owned = sanitizeEquipmentIds(ownedIds);
  const ownedItems = EQUIPMENT.filter(item => owned.includes(item.id));
  const missingItems = EQUIPMENT.filter(item => !owned.includes(item.id));

  const lines: string[] = [];

  lines.push(
    'MATÉRIEL DISPONIBLE — tu ne peux utiliser que les accessoires de cette liste :',
  );

  if (ownedItems.length > 0) {
    ownedItems.forEach(item => lines.push(`- ${item.promptHint}`));
  } else {
    lines.push(
      '- Aucun accessoire : seul le bol du robot est disponible (mixer, chauffer, pétrir).',
    );
  }

  if (missingItems.length > 0) {
    lines.push('');
    lines.push(
      "MATÉRIEL NON DISPONIBLE — l'utilisateur ne le possède pas. Ne propose aucune étape qui en dépend et adapte la technique avec le matériel disponible (sans commenter cette absence) :",
    );
    missingItems.forEach(item => lines.push(`- ${item.name}`));
  }

  if (owned.includes(VAROMA_ID)) {
    lines.push('');
    lines.push(
      'CONSIGNE VAROMA : pour une cuisson vapeur, écris la température "Varoma" et précise la répartition des aliments (récipient Varoma et/ou plateau).',
    );
  }

  if (owned.includes(CUTTER_ID)) {
    const modes = CUTTER_MODES.map(mode => mode.name).join(', ');

    lines.push('');
    lines.push(
      `CONSIGNE DÉCOUPE-MINUTE : quand tu l'utilises, nomme-le "Découpe-minute" et précise le mode de coupe entre parenthèses parmi : ${modes}.`,
    );
    lines.push(
      'Exemple : "Insérer le Découpe-minute (tranches fines) et couper les courgettes 40 sec / vitesse 5."',
    );
  }

  return lines.join('\n');
};
