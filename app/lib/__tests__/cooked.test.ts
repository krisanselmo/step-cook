/** @jest-environment node */
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  CookedInputError,
  describePhoto,
  isCookedId,
  listCooked,
  newCookedId,
  parseCookedRecipe,
  readCooked,
  readPhoto,
  saveCooked,
  savePhoto,
  type StoredCooked,
} from '../cooked';

const record = (id: string): StoredCooked => ({
  id,
  cooked_at: '2026-11-17T18:30:05.000Z',
  recipe: {
    title: 'Gratin',
    source: 'other',
    slug: null,
    saved_id: null,
    source_url: null,
    ingredients: [{ text: '500 g de pommes de terre' }],
  },
  photo: null,
});

describe('parseCookedRecipe', () => {
  it('keeps the fields the receiver needs and derives the source', () => {
    expect(
      parseCookedRecipe(
        JSON.stringify({
          title: ' Gratin ',
          ingredients: ['500 g de pommes de terre', '', 42, ' 20 cl de crème '],
          slug: 'gratin-dauphinois',
          orgURL: 'https://example.org/gratin',
        }),
      ),
    ).toEqual({
      title: 'Gratin',
      source: 'mealie',
      slug: 'gratin-dauphinois',
      saved_id: null,
      source_url: 'https://example.org/gratin',
      ingredients: [
        { text: '500 g de pommes de terre' },
        { text: '20 cl de crème' },
      ],
    });
  });

  it('marks a saved recipe and one without origin', () => {
    expect(
      parseCookedRecipe(JSON.stringify({ title: 'A', firestoreId: 'abc' }))
        .source,
    ).toBe('saved');
    expect(parseCookedRecipe(JSON.stringify({ title: 'A' })).source).toBe(
      'other',
    );
  });

  it.each([
    ['missing', null],
    ['not JSON', '{'],
    ['without title', JSON.stringify({ ingredients: [] })],
    ['with a path in the slug', JSON.stringify({ title: 'A', slug: '../x' })],
  ])('rejects a recipe %s', (_, raw) => {
    expect(() => parseCookedRecipe(raw)).toThrow(CookedInputError);
  });
});

describe('ids', () => {
  it('are sortable by date and guard the file system', () => {
    const id = newCookedId(new Date('2026-11-17T18:30:05.123Z'));

    expect(id).toMatch(/^20261117-183005-[0-9a-f]{6}$/);
    expect(isCookedId(id)).toBe(true);
    expect(isCookedId('../../etc/passwd')).toBe(false);
  });
});

describe('describePhoto', () => {
  it('gives an absolute url only with a public address', () => {
    const id = '20261117-183005-abcdef';

    expect(describePhoto(id, 'image/jpeg', 10, null)).toEqual({
      path: `/api/cooked/${id}/photo`,
      url: null,
      content_type: 'image/jpeg',
      size: 10,
    });
    expect(
      describePhoto(id, 'image/jpeg', 10, 'https://cook.example.org').url,
    ).toBe(`https://cook.example.org/api/cooked/${id}/photo`);
  });
});

describe('storage', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'step-cook-'));
    process.env.DATA_DIR = dir;
  });

  afterEach(async () => {
    delete process.env.DATA_DIR;
    await rm(dir, { recursive: true, force: true });
  });

  it('lists nothing before the first validation', async () => {
    expect(await listCooked()).toEqual([]);
  });

  it('saves a record with its photo and reads them back', async () => {
    const id = '20261117-183005-abcdef';
    const bytes = Buffer.from('jpeg bytes');

    await savePhoto(id, 'image/jpeg', bytes);
    await saveCooked({
      ...record(id),
      photo: describePhoto(id, 'image/jpeg', bytes.length, null),
    });

    expect((await readCooked(id))?.recipe.title).toBe('Gratin');
    expect(await readPhoto(id)).toEqual({ bytes, contentType: 'image/jpeg' });
    expect((await readdir(path.join(dir, 'cooked'))).sort()).toEqual([
      `${id}.jpg`,
      `${id}.json`,
    ]);
  });

  it('has no photo for a record saved without one', async () => {
    const id = '20261117-183005-abcdef';

    await saveCooked(record(id));

    expect(await readPhoto(id)).toBeNull();
    expect(await readPhoto('nope')).toBeNull();
  });

  it('refuses a photo format it cannot serve back', async () => {
    await expect(
      savePhoto('20261117-183005-abcdef', 'image/svg+xml', Buffer.from('')),
    ).rejects.toThrow(CookedInputError);
  });

  it('lists the most recent first, up to the limit', async () => {
    await saveCooked(record('20261115-120000-aaaaaa'));
    await saveCooked(record('20261117-120000-bbbbbb'));
    await saveCooked(record('20261116-120000-cccccc'));

    expect((await listCooked()).map(r => r.id)).toEqual([
      '20261117-120000-bbbbbb',
      '20261116-120000-cccccc',
      '20261115-120000-aaaaaa',
    ]);
    expect(await listCooked(1)).toHaveLength(1);
  });
});
