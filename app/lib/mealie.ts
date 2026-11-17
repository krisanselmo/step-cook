import type { StepResult } from '@/app/lib/cooked';

const TIMEOUT_MS = 15_000;

interface MealieConfig {
  baseUrl: string;
  headers: Record<string, string>;
}

export const mealieConfig = (): MealieConfig | null => {
  const baseUrl = process.env.MEALIE_BASE_URL?.trim().replace(/\/+$/, '');
  const token = process.env.MEALIE_API_TOKEN?.trim();
  const cfCookie = process.env.MEALIE_CF_COOKIE?.trim();

  if (!baseUrl || !token) {
    return null;
  }

  return {
    baseUrl,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(cfCookie ? { Cookie: cfCookie } : {}),
    },
  };
};

const call = async (
  cfg: MealieConfig,
  method: string,
  path: string,
  body?: unknown,
  fetchFn: typeof fetch = fetch,
): Promise<unknown> => {
  const isForm = body instanceof FormData;
  const res = await fetchFn(`${cfg.baseUrl}${path}`, {
    method,
    headers: {
      ...cfg.headers,
      // fetch sets the multipart boundary itself.
      ...(body !== undefined && !isForm
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200);

    throw new Error(`${method} ${path} : HTTP ${res.status} ${detail}`.trim());
  }

  return res.json().catch(() => null);
};

/**
 * What Mealie's own "I made this" does: a timeline event (with the photo)
 * and the recipe's "last made" date. Null when Mealie is not configured.
 */
export const logMealieCook = async (
  slug: string,
  cookedAt: string,
  photo: { bytes: Buffer; contentType: string; extension: string } | null,
  fetchFn: typeof fetch = fetch,
): Promise<StepResult | null> => {
  const cfg = mealieConfig();

  if (!cfg) {
    return null;
  }

  const recipePath = `/api/recipes/${encodeURIComponent(slug)}`;

  try {
    const recipe = (await call(cfg, 'GET', recipePath, undefined, fetchFn)) as {
      id?: string;
    } | null;

    if (!recipe?.id) {
      throw new Error('Recette introuvable sur Mealie');
    }

    const event = (await call(
      cfg,
      'POST',
      '/api/recipes/timeline/events',
      {
        recipeId: recipe.id,
        subject: 'Cuisinée avec Step Cook',
        eventType: 'info',
        timestamp: cookedAt,
      },
      fetchFn,
    )) as { id?: string } | null;

    if (photo && event?.id) {
      const form = new FormData();

      form.append(
        'image',
        new Blob([new Uint8Array(photo.bytes)], { type: photo.contentType }),
        `photo.${photo.extension}`,
      );
      form.append('extension', photo.extension);
      await call(
        cfg,
        'PUT',
        `/api/recipes/timeline/events/${encodeURIComponent(event.id)}/image`,
        form,
        fetchFn,
      );
    }

    await call(
      cfg,
      'PATCH',
      `${recipePath}/last-made`,
      { timestamp: cookedAt },
      fetchFn,
    );

    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);

    console.warn(`[Mealie] cook log for ${slug} failed: ${error}`);

    return { ok: false, error };
  }
};
