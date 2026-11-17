/** @jest-environment node */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { GET as list, POST } from '../route';
import { GET as photo } from '../[id]/photo/route';

const post = (fields: Record<string, string | Blob>) => {
  const form = new FormData();

  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }

  return POST(
    new Request('http://localhost/api/cooked', { method: 'POST', body: form }),
  );
};

const RECIPE = JSON.stringify({
  title: 'Gratin',
  ingredients: ['500 g de pommes de terre'],
});

describe('/api/cooked', () => {
  let dir: string;
  const realFetch = global.fetch;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'step-cook-'));
    process.env.DATA_DIR = dir;
    process.env.APP_PUBLIC_URL = 'https://cook.example.org/';
  });

  afterEach(async () => {
    global.fetch = realFetch;
    delete process.env.DATA_DIR;
    delete process.env.APP_PUBLIC_URL;
    delete process.env.WEBHOOK_URL;
    await rm(dir, { recursive: true, force: true });
  });

  it('saves the validation and its photo, then sends the webhook', async () => {
    process.env.WEBHOOK_URL = 'http://hooks.local/cooked';
    global.fetch = jest.fn().mockResolvedValue(new Response('', { status: 200 }));

    const res = await post({
      recipe: RECIPE,
      photo: new Blob(['jpeg bytes'], { type: 'image/jpeg' }),
    });
    const saved = await res.json();

    expect(res.status).toBe(201);
    expect(saved).toMatchObject({
      recipe: { title: 'Gratin', ingredients: [{ text: '500 g de pommes de terre' }] },
      photo: {
        url: `https://cook.example.org/api/cooked/${saved.id}/photo`,
        content_type: 'image/jpeg',
        size: 10,
      },
      mealie: null,
      webhook: { ok: true, status: 200, attempts: 1 },
    });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body);

    expect(url).toBe('http://hooks.local/cooked');
    expect(body).toMatchObject({
      event: 'recipe.cooked',
      app_url: 'https://cook.example.org',
      data: { id: saved.id, recipe: { title: 'Gratin' } },
    });
    // The receiver gets the validation, not the delivery bookkeeping.
    expect(body.data.webhook).toBeUndefined();

    const served = await photo(new Request('http://localhost'), {
      params: Promise.resolve({ id: saved.id }),
    });

    expect(served.headers.get('Content-Type')).toBe('image/jpeg');
    expect(await served.text()).toBe('jpeg bytes');

    const all = await (await list(new Request('http://localhost/api/cooked'))).json();

    expect(all).toEqual([saved]);
  });

  it('works without photo nor webhook', async () => {
    const res = await post({ recipe: RECIPE });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      photo: null,
      mealie: null,
      webhook: null,
    });
  });

  it('keeps the validation when the webhook is down', async () => {
    process.env.WEBHOOK_URL = 'http://hooks.local/cooked';
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await post({ recipe: RECIPE });
    const saved = await res.json();

    expect(res.status).toBe(201);
    expect(saved.webhook).toMatchObject({ ok: false, error: 'ECONNREFUSED' });
    expect(
      await (await list(new Request('http://localhost/api/cooked'))).json(),
    ).toHaveLength(1);
  });

  it.each([
    ['a recipe without title', { recipe: '{}' }],
    [
      'a photo it cannot serve back',
      { recipe: RECIPE, photo: new Blob(['<svg/>'], { type: 'image/svg+xml' }) },
    ],
  ])('rejects %s', async (_, fields) => {
    const res = await post(fields);

    expect(res.status).toBe(400);
    expect(
      await (await list(new Request('http://localhost/api/cooked'))).json(),
    ).toEqual([]);
  });

  it('answers 404 for an unknown photo', async () => {
    const res = await photo(new Request('http://localhost'), {
      params: Promise.resolve({ id: '../secret' }),
    });

    expect(res.status).toBe(404);
  });
});
