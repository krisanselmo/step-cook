/** @jest-environment node */
import { createHmac } from 'node:crypto';
import { buildWebhookRequest, sendWebhook } from '../webhook';

const response = (status: number) =>
  ({ ok: status >= 200 && status < 300, status }) as Response;

const deps = (...answers: (number | Error)[]) => {
  const fetch = jest.fn();

  for (const a of answers) {
    if (a instanceof Error) {
      fetch.mockRejectedValueOnce(a);
    } else {
      fetch.mockResolvedValueOnce(response(a));
    }
  }

  return { fetch, sleep: jest.fn().mockResolvedValue(undefined) };
};

describe('buildWebhookRequest', () => {
  const opts = {
    appUrl: 'https://cook.example.org',
    now: new Date('2026-11-17T18:30:05.000Z'),
    deliveryId: 'delivery-1',
  };

  it('wraps the data in the event envelope', () => {
    const { body, headers } = buildWebhookRequest(
      'recipe.cooked',
      { id: 'x' },
      { ...opts, secret: null },
    );

    expect(JSON.parse(body)).toEqual({
      event: 'recipe.cooked',
      id: 'delivery-1',
      at: '2026-11-17T18:30:05.000Z',
      app_url: 'https://cook.example.org',
      data: { id: 'x' },
    });
    expect(headers['X-StepCook-Event']).toBe('recipe.cooked');
    expect(headers.Authorization).toBeUndefined();
  });

  it('signs the raw body with the secret', () => {
    const { body, headers } = buildWebhookRequest(
      'recipe.cooked',
      {},
      { ...opts, secret: 's3cret' },
    );

    expect(headers.Authorization).toBe('Bearer s3cret');
    expect(headers['X-StepCook-Signature']).toBe(
      `sha256=${createHmac('sha256', 's3cret').update(body).digest('hex')}`,
    );
  });
});

describe('sendWebhook', () => {
  afterEach(() => {
    delete process.env.WEBHOOK_URL;
    delete process.env.WEBHOOK_SECRET;
  });

  it('does nothing without WEBHOOK_URL', async () => {
    const d = deps();

    expect(await sendWebhook('recipe.cooked', {}, null, d)).toBeNull();
    expect(d.fetch).not.toHaveBeenCalled();
  });

  it('posts once when the receiver answers', async () => {
    process.env.WEBHOOK_URL = 'http://hooks.local/cooked';
    const d = deps(200);

    expect(await sendWebhook('recipe.cooked', {}, null, d)).toEqual({
      ok: true,
      status: 200,
      attempts: 1,
    });
    expect(d.fetch).toHaveBeenCalledWith(
      'http://hooks.local/cooked',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('retries once after a server error or no answer', async () => {
    process.env.WEBHOOK_URL = 'http://hooks.local/cooked';

    expect(
      await sendWebhook('recipe.cooked', {}, null, deps(503, 200)),
    ).toMatchObject({ ok: true, attempts: 2 });
    expect(
      await sendWebhook(
        'recipe.cooked',
        {},
        null,
        deps(new Error('ECONNREFUSED'), new Error('ECONNREFUSED')),
      ),
    ).toEqual({ ok: false, status: null, attempts: 2, error: 'ECONNREFUSED' });
  });

  it('does not retry a request the receiver refused', async () => {
    process.env.WEBHOOK_URL = 'http://hooks.local/cooked';
    const d = deps(401);

    expect(await sendWebhook('recipe.cooked', {}, null, d)).toEqual({
      ok: false,
      status: 401,
      attempts: 1,
      error: 'HTTP 401',
    });
  });
});
