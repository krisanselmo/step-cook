import {
  CUTTER_ID,
  CUTTER_MODES,
  DEFAULT_EQUIPMENT_IDS,
  EQUIPMENT,
  VAROMA_ID,
  buildEquipmentPromptBlock,
  getCutterMode,
  getEquipmentItem,
  sanitizeEquipmentIds,
} from '@/app/lib/equipment';

describe('catalogue de matériel', () => {
  it('a des identifiants uniques', () => {
    const ids = EQUIPMENT.map(item => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('expose les ids référencés par le reste du code', () => {
    expect(getEquipmentItem(VAROMA_ID)).toBeDefined();
    expect(getEquipmentItem(CUTTER_ID)).toBeDefined();
  });

  it('propose le matériel fourni d’origine par défaut, sans le Découpe-minute', () => {
    expect(DEFAULT_EQUIPMENT_IDS).toContain(VAROMA_ID);
    expect(DEFAULT_EQUIPMENT_IDS).not.toContain(CUTTER_ID);
  });

  it('décrit quatre modes de coupe distincts', () => {
    const ids = CUTTER_MODES.map(mode => mode.id);

    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(getCutterMode('rape-fin')?.name).toBe('Râpé fin');
  });
});

describe('sanitizeEquipmentIds', () => {
  it('retombe sur la configuration par défaut si la valeur est inexploitable', () => {
    expect(sanitizeEquipmentIds(null)).toEqual(DEFAULT_EQUIPMENT_IDS);
    expect(sanitizeEquipmentIds('varoma')).toEqual(DEFAULT_EQUIPMENT_IDS);
  });

  it('écarte les ids inconnus et les doublons', () => {
    expect(sanitizeEquipmentIds([VAROMA_ID, 'licorne', VAROMA_ID])).toEqual([
      VAROMA_ID,
    ]);
  });

  it('accepte une configuration vide (aucun accessoire)', () => {
    expect(sanitizeEquipmentIds([])).toEqual([]);
  });
});

describe('buildEquipmentPromptBlock', () => {
  it('liste le matériel possédé et interdit le reste', () => {
    const block = buildEquipmentPromptBlock([VAROMA_ID]);

    expect(block).toContain('MATÉRIEL DISPONIBLE');
    expect(block).toContain('Varoma');
    expect(block).toContain('MATÉRIEL NON DISPONIBLE');
    expect(block).toContain('Découpe-minute');
  });

  it('n’injecte les consignes Découpe-minute que si l’accessoire est possédé', () => {
    const without = buildEquipmentPromptBlock([VAROMA_ID]);
    const with_ = buildEquipmentPromptBlock([VAROMA_ID, CUTTER_ID]);

    expect(without).not.toContain('CONSIGNE DÉCOUPE-MINUTE');
    expect(with_).toContain('CONSIGNE DÉCOUPE-MINUTE');
    CUTTER_MODES.forEach(mode => expect(with_).toContain(mode.name));
  });

  it('n’injecte la consigne Varoma que si le Varoma est possédé', () => {
    expect(buildEquipmentPromptBlock([CUTTER_ID])).not.toContain(
      'CONSIGNE VAROMA',
    );
    expect(buildEquipmentPromptBlock([VAROMA_ID])).toContain('CONSIGNE VAROMA');
  });

  it('gère une configuration vide sans laisser l’IA sans instruction', () => {
    const block = buildEquipmentPromptBlock([]);

    expect(block).toContain('Aucun accessoire');
    expect(block).toContain('MATÉRIEL NON DISPONIBLE');
  });

  it('retombe sur la configuration par défaut sans argument', () => {
    expect(buildEquipmentPromptBlock()).toBe(
      buildEquipmentPromptBlock(DEFAULT_EQUIPMENT_IDS),
    );
  });
});
