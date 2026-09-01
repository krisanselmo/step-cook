/**
 * Deliberately pure (no React, no icons): imported by the UI and by the Gemini
 * routes alike. Icons are resolved UI-side.
 */

export interface EquipmentItem {
  id: string;
  name: string;
  /** Shown under the name in the config modal. */
  description: string;
  /** Shipped with the appliance, so ticked by default. */
  defaultOwned: boolean;
  /** Wording injected into the Gemini prompt. */
  promptHint: string;
  /** Tested against normalised text, so patterns carry no accents. */
  pattern: RegExp;
}

export const VAROMA_ID = 'varoma';
export const CUTTER_ID = 'decoupe-minute';
export const GOBELET_ID = 'gobelet-doseur';

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
    id: GOBELET_ID,
    name: 'Gobelet doseur',
    description: 'Doser les liquides et fermer le bol',
    defaultOwned: true,
    promptHint:
      "Gobelet doseur : en place sur le couvercle par défaut. Ne le signale que lorsqu'il faut le RETIRER (laisser évaporer, réduire, éviter la surpression).",
    // Only removal is information: the cup is on the lid the rest of the time.
    pattern:
      /sans (le )?gobelet|(retirer|enlever|oter) le gobelet|gobelet (doseur )?(retire|enleve|ote)|couvercle sans gobelet/,
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
  /** Indicative thickness, shown under the mode name. */
  detail: string;
  /** Recommended speed for this mode. */
  speed: string;
  pattern: RegExp;
}

/** Two double-sided discs, hence four modes. */
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

/** Default configuration: what ships with the appliance. */
export const DEFAULT_EQUIPMENT_IDS: string[] = EQUIPMENT.filter(
  item => item.defaultOwned,
).map(item => item.id);

export const getEquipmentItem = (id: string): EquipmentItem | undefined =>
  EQUIPMENT.find(item => item.id === id);

export const getCutterMode = (id: string): CutterMode | undefined =>
  CUTTER_MODES.find(mode => mode.id === id);

/** The cup only appears when removed, hence a label naming the action. */
export const getAccessoryStepLabel = (accessory: {
  id: string;
  state?: string;
}): string => {
  const item = getEquipmentItem(accessory.id);

  if (!item) {
    return accessory.id;
  }

  return accessory.id === GOBELET_ID && accessory.state === 'removed'
    ? 'Retirer le gobelet'
    : item.name;
};

/**
 * Keeps known ids only, deduplicated. An unusable value falls back to the
 * defaults so the AI is never left without equipment.
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
 * What the user owns, what is therefore forbidden, and the wording rules for
 * accessories with their own syntax. Absent `ownedIds` falls back to defaults.
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
