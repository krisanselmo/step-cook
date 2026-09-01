import { detectStepAccessories, extractStepParams } from '@/app/lib/utils';
import { CUTTER_ID, GOBELET_ID, VAROMA_ID } from '@/app/lib/equipment';

const ids = (text: string, temp?: string) =>
  detectStepAccessories(text, temp).map(accessory => accessory.id);

describe('detectStepAccessories', () => {
  it('ne détecte rien sur une étape sans matériel', () => {
    expect(detectStepAccessories('Mixer 10 sec / vitesse 5.')).toEqual([]);
    expect(detectStepAccessories('')).toEqual([]);
  });

  it('détecte le Varoma nommé dans la phrase', () => {
    expect(ids('Placer le poisson dans le Varoma.')).toContain(VAROMA_ID);
  });

  it('détecte le Varoma quand il n’apparaît que comme température', () => {
    const step = 'Cuire 20 min / Varoma / vitesse 1.';
    const params = extractStepParams(step);

    expect(params.temp).toBe('VAROMA');
    expect(ids('Cuire 20 min à la vapeur.', params.temp)).toContain(VAROMA_ID);
  });

  it('détecte le Découpe-minute et ses variantes d’écriture', () => {
    expect(ids('Insérer le Découpe-minute et couper.')).toContain(CUTTER_ID);
    expect(ids('Monter le découpe légumes sur le bol.')).toContain(CUTTER_ID);
  });

  it('reconnaît les quatre modes de coupe', () => {
    const mode = (text: string) =>
      detectStepAccessories(text).find(a => a.id === CUTTER_ID)?.cutterMode;

    expect(mode('Découpe-minute (tranches fines) : couper les courgettes.')).toBe(
      'tranches-fines',
    );
    expect(mode('Découpe-minute (tranches épaisses) pour le gratin.')).toBe(
      'tranches-epaisses',
    );
    expect(mode('Découpe-minute (râpé fin) pour les carottes.')).toBe(
      'rape-fin',
    );
    expect(mode('Découpe-minute (râpé épais) pour les rösti.')).toBe(
      'rape-epais',
    );
  });

  it('laisse le mode indéfini quand la recette ne le précise pas', () => {
    const [cutter] = detectStepAccessories('Utiliser le Découpe-minute.');

    expect(cutter.id).toBe(CUTTER_ID);
    expect(cutter.cutterMode).toBeUndefined();
  });

  it('ne confond pas une découpe au couteau avec le Découpe-minute', () => {
    expect(ids("Découper l'oignon en petits dés.")).not.toContain(CUTTER_ID);
    expect(ids('Couper les légumes en rondelles.')).not.toContain(CUTTER_ID);
  });

  it('détecte les accessoires simples', () => {
    expect(ids('Insérer le fouet et monter les blancs.')).toContain('fouet');
    expect(ids('Cuire dans le panier de cuisson.')).toContain('panier-cuisson');
  });

  describe('gobelet doseur', () => {
    // En place par défaut : seul son retrait est une information.
    it('ne signale que son retrait', () => {
      expect(detectStepAccessories('Retirer le gobelet doseur.')).toEqual([
        { id: GOBELET_ID, state: 'removed' },
      ]);
      expect(ids('Cuire 20 min / 100°C / vitesse 1, sans le gobelet.')).toContain(
        GOBELET_ID,
      );
    });

    it('reste muet quand le gobelet est simplement en place', () => {
      expect(ids('Mettre le gobelet doseur et mixer 10 sec / vitesse 5.')).not.toContain(
        GOBELET_ID,
      );
      expect(ids('Verser 100 g d\'eau à l\'aide du gobelet doseur.')).not.toContain(
        GOBELET_ID,
      );
    });
  });

  it('remonte plusieurs accessoires sur une même étape', () => {
    const detected = ids(
      'Mettre les pommes de terre dans le panier de cuisson et le poisson dans le Varoma.',
    );

    expect(detected).toEqual(
      expect.arrayContaining([VAROMA_ID, 'panier-cuisson']),
    );
  });
});
