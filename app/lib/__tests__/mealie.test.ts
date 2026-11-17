/** @jest-environment node */
import { logMealieCook } from '../mealie';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe('logMealieCook', () => {
  beforeEach(() => {
    process.env.MEALIE_BASE_URL = 'http://mealie.local/';
    process.env.MEALIE_API_TOKEN = 'token';
  });

  afterEach(() => {
    delete process.env.MEALIE_BASE_URL;
    delete process.env.MEALIE_API_TOKEN;
  });

  it('does nothing when Mealie is not configured', async () => {
    delete process.env.MEALIE_API_TOKEN;
    const fetchFn = jest.fn();

    expect(await logMealieCook('gratin', 'now', null, fetchFn)).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('adds a timeline event with the photo, then the last-made date', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(json({ id: 'recipe-uuid' }))
      .mockResolvedValueOnce(json({ id: 'event-uuid' }, 201))
      .mockResolvedValueOnce(json({ image: 'x' }))
      .mockResolvedValueOnce(json({}));
    const at = '2026-11-17T18:30:05.000Z';

    expect(
      await logMealieCook(
        'gratin',
        at,
        { bytes: Buffer.from('jpg'), contentType: 'image/jpeg', extension: 'jpg' },
        fetchFn,
      ),
    ).toEqual({ ok: true });

    const calls = fetchFn.mock.calls.map(([url, init]) => [
      init.method,
      url,
    ]);

    expect(calls).toEqual([
      ['GET', 'http://mealie.local/api/recipes/gratin'],
      ['POST', 'http://mealie.local/api/recipes/timeline/events'],
      ['PUT', 'http://mealie.local/api/recipes/timeline/events/event-uuid/image'],
      ['PATCH', 'http://mealie.local/api/recipes/gratin/last-made'],
    ]);
    expect(JSON.parse(fetchFn.mock.calls[1][1].body)).toEqual({
      recipeId: 'recipe-uuid',
      subject: 'Cuisinée avec Step Cook',
      eventType: 'info',
      timestamp: at,
    });
    const form = fetchFn.mock.calls[2][1].body as FormData;

    expect(form.get('extension')).toBe('jpg');
    expect(form.get('image')).toBeInstanceOf(Blob);
    expect(JSON.parse(fetchFn.mock.calls[3][1].body)).toEqual({
      timestamp: at,
    });
    expect(fetchFn.mock.calls[0][1].headers.Authorization).toBe('Bearer token');
  });

  it('skips the image without a photo', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(json({ id: 'recipe-uuid' }))
      .mockResolvedValueOnce(json({ id: 'event-uuid' }, 201))
      .mockResolvedValueOnce(json({}));

    expect(await logMealieCook('gratin', 'now', null, fetchFn)).toEqual({
      ok: true,
    });
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('reports a failure instead of throwing', async () => {
    const fetchFn = jest.fn().mockResolvedValueOnce(json({ detail: 'nope' }, 404));

    expect(await logMealieCook('gratin', 'now', null, fetchFn)).toEqual({
      ok: false,
      error: expect.stringContaining('HTTP 404'),
    });
  });
});
