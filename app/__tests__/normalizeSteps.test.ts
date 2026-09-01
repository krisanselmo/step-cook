import {
  RECIPE_SCHEMA_VERSION,
  isStructuredSchema,
  normalizeSteps,
  parseIngredientLine,
  parseRecipe,
  sanitizeStepAccessories,
} from '@/app/lib/utils';
import {
  CUTTER_ID,
  GOBELET_ID,
  VAROMA_ID,
  getAccessoryStepLabel,
} from '@/app/lib/equipment';

const INGREDIENTS = [
  '200 g de farine T45',
  '3 œufs',
  '50 g de beurre doux',
].map(parseIngredientLine);

describe('isStructuredSchema', () => {
  it('traite une version absente comme du legacy', () => {
    expect(isStructuredSchema(undefined)).toBe(false);
    expect(isStructuredSchema(1)).toBe(false);
    expect(isStructuredSchema(RECIPE_SCHEMA_VERSION)).toBe(true);
  });
});

describe('sanitizeStepAccessories', () => {
  it('écarte les ids inconnus et les doublons', () => {
    expect(
      sanitizeStepAccessories([
        { id: VAROMA_ID },
        { id: VAROMA_ID },
        { id: 'four-a-bois' },
      ]),
    ).toEqual([{ id: VAROMA_ID }]);
  });

  it('ne garde cutterMode que sur le Découpe-minute, et seulement s\'il est connu', () => {
    expect(
      sanitizeStepAccessories([
        { id: CUTTER_ID, cutterMode: 'rape-fin' },
        { id: VAROMA_ID, cutterMode: 'rape-fin' },
      ]),
    ).toEqual([{ id: CUTTER_ID, cutterMode: 'rape-fin' }, { id: VAROMA_ID }]);

    expect(sanitizeStepAccessories([{ id: CUTTER_ID, cutterMode: 'julienne' }])).toEqual([
      { id: CUTTER_ID },
    ]);
  });

  it('tolère une valeur qui n\'est pas un tableau', () => {
    expect(sanitizeStepAccessories(undefined)).toEqual([]);
    expect(sanitizeStepAccessories('varoma')).toEqual([]);
  });
});

describe('normalizeSteps — schéma 1 (texte)', () => {
  it('convertit les string[] et devine accessoires et ingrédients', () => {
    const [step] = normalizeSteps(['Cuire la farine 20 min / Varoma / vitesse 1.'], {
      ingredients: INGREDIENTS,
    });

    expect(step.text).toBe('Cuire la farine 20 min / Varoma / vitesse 1.');
    expect(step.accessories).toEqual([{ id: VAROMA_ID }]);
    expect(step.ingredients).toEqual(['200 g de farine T45']);
  });

  it('ignore les déclarations tant que le schéma n\'est pas structuré', () => {
    const [step] = normalizeSteps(
      [{ text: 'Mélanger.', accessories: [{ id: VAROMA_ID }], ingredients: ['3 œufs'] }],
      { ingredients: INGREDIENTS },
    );

    expect(step.accessories).toBeUndefined();
    expect(step.ingredients).toBeUndefined();
  });
});

describe('normalizeSteps — schéma 2 (structuré)', () => {
  const structured = { structured: true, ingredients: INGREDIENTS };

  it('fait confiance aux déclarations plutôt qu\'au texte', () => {
    const [step] = normalizeSteps(
      [
        {
          text: 'Couper les courgettes 40 sec / vitesse 5.',
          accessories: [{ id: CUTTER_ID, cutterMode: 'tranches-fines' }],
          ingredients: ['3 œufs'],
        },
      ],
      structured,
    );

    expect(step.accessories).toEqual([{ id: CUTTER_ID, cutterMode: 'tranches-fines' }]);
    expect(step.ingredients).toEqual(['3 œufs']);
  });

  it('ne devine plus rien : une étape déclarée vide reste vide', () => {
    const [step] = normalizeSteps(
      [{ text: 'Cuire la farine 20 min / Varoma / vitesse 1.', accessories: [] }],
      structured,
    );

    expect(step.accessories).toBeUndefined();
    expect(step.ingredients).toBeUndefined();
  });

  it('résout les ingrédients par égalité normalisée (casse et accents)', () => {
    const [step] = normalizeSteps(
      [{ text: 'Ajouter.', ingredients: ['3 OEUFS', '  200 g de Farine T45 '] }],
      structured,
    );

    expect(step.ingredients).toEqual(['3 œufs', '200 g de farine T45']);
  });

  it('écarte un libellé qui ne correspond à aucun ingrédient de la recette', () => {
    const [step] = normalizeSteps(
      [{ text: 'Ajouter.', ingredients: ['farine', '2 kg de sucre'] }],
      structured,
    );

    expect(step.ingredients).toBeUndefined();
  });

  it('laisse un même ingrédient servir dans plusieurs étapes', () => {
    const steps = normalizeSteps(
      [
        { text: 'Verser la moitié du beurre.', ingredients: ['50 g de beurre doux'] },
        { text: 'Ajouter le reste du beurre.', ingredients: ['50 g de beurre doux'] },
      ],
      structured,
    );

    expect(steps[0].ingredients).toEqual(['50 g de beurre doux']);
    expect(steps[1].ingredients).toEqual(['50 g de beurre doux']);
  });

  it('dédoublonne à l\'intérieur d\'une même étape', () => {
    const [step] = normalizeSteps(
      [{ text: 'Ajouter.', ingredients: ['3 œufs', '3 œufs'] }],
      structured,
    );

    expect(step.ingredients).toEqual(['3 œufs']);
  });

  it('ne devine rien pour une étape sans aucune déclaration', () => {
    const [step] = normalizeSteps(
      [{ text: 'Cuire la farine 20 min / Varoma / vitesse 1.' }],
      structured,
    );

    // Le texte contient pourtant « Varoma », « farine » et « 20 min » : en
    // schéma 2 aucun regex ne tourne, l'étape reste nue.
    expect(step.text).toBe('Cuire la farine 20 min / Varoma / vitesse 1.');
    expect(step.accessories).toBeUndefined();
    expect(step.ingredients).toBeUndefined();
    expect(step.params).toBeUndefined();
  });

  it('écarte les étapes sans texte exploitable', () => {
    expect(normalizeSteps([{ text: '   ' }, { accessories: [] }, null, 42])).toEqual([]);
  });
});

describe('parseRecipe — sortie de modèle', () => {
  const payload = {
    schemaVersion: RECIPE_SCHEMA_VERSION,
    title: 'Courgettes vapeur',
    ingredients: ['2 courgettes', '200 g de farine T45'],
    steps: [
      {
        text: 'Couper les courgettes.',
        accessories: [{ id: CUTTER_ID, cutterMode: 'tranches-fines' }],
        ingredients: ['2 courgettes'],
      },
      { text: 'Cuire 20 min / Varoma / vitesse 1.' },
    ],
  };

  it('accepte un JSON entouré d\'un bloc markdown ```json', () => {
    const recipe = parseRecipe('```json\n' + JSON.stringify(payload) + '\n```');

    expect(recipe.title).toBe('Courgettes vapeur');
    expect(recipe.steps).toHaveLength(2);
    expect(recipe.steps[0].accessories).toEqual([
      { id: CUTTER_ID, cutterMode: 'tranches-fines' },
    ]);
    expect(recipe.steps[0].ingredients).toEqual(['2 courgettes']);
    expect(recipe.schemaVersion).toBe(RECIPE_SCHEMA_VERSION);
  });

  it('ne prend jamais une clôture de fence pour un titre', () => {
    const recipe = parseRecipe('```json\n' + JSON.stringify(payload) + '\n```');

    expect(recipe.title).not.toContain('```');
    expect(recipe.steps.map(step => step.text)).not.toContain('{');
  });

  it('traite un JSON sans schemaVersion comme du legacy', () => {
    const legacy: Partial<typeof payload> = { ...payload };
    delete legacy.schemaVersion;

    const recipe = parseRecipe(JSON.stringify(legacy));

    expect(recipe.schemaVersion).toBeUndefined();
    // Les déclarations sont ignorées : le Découpe-minute n'est pas dans le texte.
    expect(recipe.steps[0].accessories).toBeUndefined();
  });
});

describe('gobelet doseur — déclaration structurée', () => {
  it('écarte une déclaration sans retrait, quoi que dise le modèle', () => {
    expect(sanitizeStepAccessories([{ id: GOBELET_ID }])).toEqual([]);
    expect(sanitizeStepAccessories([{ id: GOBELET_ID, state: 'in-place' }])).toEqual([]);
  });

  it('ne garde que le retrait', () => {
    expect(sanitizeStepAccessories([{ id: GOBELET_ID, state: 'removed' }])).toEqual([
      { id: GOBELET_ID, state: 'removed' },
    ]);
  });

  it('n\'empêche pas les autres accessoires de la même étape', () => {
    expect(
      sanitizeStepAccessories([{ id: GOBELET_ID }, { id: VAROMA_ID }]),
    ).toEqual([{ id: VAROMA_ID }]);
  });

  it('affiche l\'action plutôt que l\'objet', () => {
    expect(getAccessoryStepLabel({ id: GOBELET_ID, state: 'removed' })).toBe(
      'Retirer le gobelet',
    );
    expect(getAccessoryStepLabel({ id: VAROMA_ID })).toBe('Varoma');
  });
});

describe('réglages du robot', () => {
  const structured = { structured: true, ingredients: INGREDIENTS };
  const paramsOf = (settings: unknown) =>
    normalizeSteps([{ text: 'Cuire.', settings }], structured)[0]?.params;

  it('convertit les secondes déclarées en cadran', () => {
    expect(paramsOf({ seconds: 40 })).toMatchObject({ time: '00:40', seconds: 40 });
    expect(paramsOf({ seconds: 300 })).toMatchObject({ time: '05:00', seconds: 300 });
    expect(paramsOf({ seconds: 3600 })).toMatchObject({ time: '1:00:00', seconds: 3600 });
  });

  it('formate la température, Varoma compris', () => {
    expect(paramsOf({ temperature: '100' })?.temp).toBe('100°C');
    expect(paramsOf({ temperature: '100°C' })?.temp).toBe('100°C');
    expect(paramsOf({ temperature: 'Varoma' })?.temp).toBe('VAROMA');
  });

  it('traduit les vitesses nommées', () => {
    expect(paramsOf({ speed: 'mijotage' })?.speed).toBe('MIJOT');
    expect(paramsOf({ speed: 'petrin' })?.speed).toBe('EPI');
    expect(paramsOf({ speed: 'turbo' })?.speed).toBe('TURBO');
    expect(paramsOf({ speed: '3.5' })?.speed).toBe('3.5');
  });

  it('ignore le sens inverse en mode pétrin', () => {
    expect(paramsOf({ speed: 'petrin', reverse: true })?.reverse).toBe(false);
    expect(paramsOf({ speed: '1', reverse: true })?.reverse).toBe(true);
  });

  it('n\'attache aucun réglage à une étape sans robot', () => {
    expect(paramsOf(undefined)).toBeUndefined();
    expect(paramsOf({})).toBeUndefined();
    expect(paramsOf({ seconds: 0 })).toBeUndefined();
  });

  it('survit à un aller-retour Firestore (params déjà résolus)', () => {
    const [step] = normalizeSteps(
      [{ text: 'Cuire.', settings: { seconds: 900, temperature: 'Varoma', speed: '1', reverse: true } }],
      structured,
    );
    // Relecture : l'étape porte désormais `params`, pas `settings`.
    const [reread] = normalizeSteps([step], structured);

    expect(reread.params).toEqual(step.params);
    expect(reread.params).toMatchObject({ time: '15:00', temp: 'VAROMA', speed: '1' });
  });

  it('extrait toujours les réglages du texte en schéma 1', () => {
    const [step] = normalizeSteps(['Cuire 15 min / 100°C / vitesse 1 / sens inverse.']);

    expect(step.params).toMatchObject({
      time: '15:00',
      temp: '100°C',
      speed: '1',
      seconds: 900,
      reverse: true,
    });
  });
});

describe('vitesse « aucune »', () => {
  const paramsOf = (settings: unknown) =>
    normalizeSteps([{ text: 'Reposer.', settings }], {
      structured: true,
      ingredients: [],
    })[0]?.params;

  // Le schéma rend "speed" obligatoire : le modèle doit pouvoir dire
  // « le robot ne tourne pas » sans inventer une vitesse.
  it('vaut une absence de vitesse, pas une vitesse nommée', () => {
    expect(paramsOf({ seconds: 600, speed: 'aucune' })).toMatchObject({
      time: '10:00',
      speed: '---',
    });
  });

  it('ne crée pas de réglage à elle seule', () => {
    expect(paramsOf({ speed: 'aucune' })).toBeUndefined();
  });
});

describe('re-normalisation côté client (réponse de route → état de l\'app)', () => {
  // La route résout déjà les ingrédients ; le client re-normalise la réponse.
  // Sans lui repasser la liste, cette seconde passe les effaçait en silence.
  const routeResponse = {
    ingredients: ['200 g de comté', '4 carottes'],
    steps: [
      {
        text: 'Râper le comté 30 sec / vitesse 5.',
        ingredients: ['200 g de comté'],
        accessories: [{ id: CUTTER_ID, cutterMode: 'rape-fin' }],
        params: { time: '00:30', temp: '---', speed: '5', seconds: 30, reverse: false },
      },
    ],
  };

  it('conserve les ingrédients résolus au second passage', () => {
    const ingredients = routeResponse.ingredients.map(parseIngredientLine);
    const [step] = normalizeSteps(routeResponse.steps, {
      structured: true,
      ingredients,
    });

    expect(step.ingredients).toEqual(['200 g de comté']);
    expect(step.accessories).toEqual([{ id: CUTTER_ID, cutterMode: 'rape-fin' }]);
    expect(step.params).toMatchObject({ time: '00:30', speed: '5', seconds: 30 });
  });

  it('est stable : re-normaliser deux fois ne dégrade rien', () => {
    const ingredients = routeResponse.ingredients.map(parseIngredientLine);
    const once = normalizeSteps(routeResponse.steps, { structured: true, ingredients });
    const twice = normalizeSteps(once, { structured: true, ingredients });

    expect(twice).toEqual(once);
  });
});
