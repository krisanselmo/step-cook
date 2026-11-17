import { createHmac, randomUUID } from 'node:crypto';
import type { StepResult } from '@/app/lib/cooked';

/**
 * Outgoing webhook: one JSON POST per event to WEBHOOK_URL.
 *
 * Body: {event, id, at, app_url, data}. Headers: X-StepCook-Event,
 * X-StepCook-Delivery and, when WEBHOOK_SECRET is set, `Authorization:
 * Bearer <secret>` plus X-StepCook-Signature (`sha256=` HMAC of the raw body).
 */

const ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 10_000;

export const webhookUrl = (): string | null =>
  process.env.WEBHOOK_URL?.trim() || null;

export interface WebhookRequest {
  body: string;
  headers: Record<string, string>;
}

export const buildWebhookRequest = (
  event: string,
  data: unknown,
  opts: {
    secret: string | null;
    appUrl: string | null;
    now: Date;
    deliveryId: string;
  },
): WebhookRequest => {
  const body = JSON.stringify({
    event,
    id: opts.deliveryId,
    at: opts.now.toISOString(),
    app_url: opts.appUrl,
    data,
  });
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'step-cook',
    'X-StepCook-Event': event,
    'X-StepCook-Delivery': opts.deliveryId,
  };

  if (opts.secret) {
    headers.Authorization = `Bearer ${opts.secret}`;
    headers['X-StepCook-Signature'] =
      `sha256=${createHmac('sha256', opts.secret).update(body).digest('hex')}`;
  }

  return { body, headers };
};

// A 4xx other than 408/429 will fail the same way again.
const retryable = (status: number) =>
  status >= 500 || status === 408 || status === 429;

/** Null when no webhook is configured. Never throws. */
export const sendWebhook = async (
  event: string,
  data: unknown,
  appUrl: string | null,
  deps: {
    fetch: typeof fetch;
    sleep: (ms: number) => Promise<void>;
  } = {
    fetch: (...args) => fetch(...args),
    sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
  },
): Promise<StepResult | null> => {
  const url = webhookUrl();

  if (!url) {
    return null;
  }

  const { body, headers } = buildWebhookRequest(event, data, {
    secret: process.env.WEBHOOK_SECRET?.trim() || null,
    appUrl,
    now: new Date(),
    deliveryId: randomUUID(),
  });
  let result: StepResult = { ok: false, status: null, attempts: 0 };

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await deps.sleep(RETRY_DELAY_MS);
    }

    try {
      const res = await deps.fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      result = {
        ok: res.ok,
        status: res.status,
        attempts: attempt,
        ...(res.ok ? {} : { error: `HTTP ${res.status}` }),
      };

      if (res.ok || !retryable(res.status)) {
        break;
      }
    } catch (e) {
      result = {
        ok: false,
        status: null,
        attempts: attempt,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  if (!result.ok) {
    console.warn(`[Webhook] ${event} not delivered: ${result.error}`);
  }

  return result;
};
