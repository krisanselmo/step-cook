import { randomBytes } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * "I cooked it": one JSON file per validation, plus its photo, under
 * `DATA_DIR/cooked/`. `CookedRecord` is also the webhook's `data`: add
 * fields, don't rename them.
 */

export const COOKED_EVENT = 'recipe.cooked';

export type RecipeSource = 'mealie' | 'saved' | 'other';

export interface CookedRecipe {
  title: string;
  source: RecipeSource;
  /** Mealie slug. */
  slug: string | null;
  /** Saved-recipe id. */
  saved_id: string | null;
  /** Page the recipe was imported from. */
  source_url: string | null;
  ingredients: { text: string }[];
}

export interface CookedPhoto {
  /** Served by the app; `url` is the same, absolute, when APP_PUBLIC_URL is set. */
  path: string;
  url: string | null;
  content_type: string;
  size: number;
}

export interface CookedRecord {
  id: string;
  cooked_at: string;
  recipe: CookedRecipe;
  photo: CookedPhoto | null;
}

export interface StepResult {
  ok: boolean;
  /** HTTP status of the last attempt, null = no answer. */
  status?: number | null;
  attempts?: number;
  error?: string;
}

/** What the app keeps: the record plus how each integration went. */
export interface StoredCooked extends CookedRecord {
  mealie?: StepResult | null;
  webhook?: StepResult | null;
}

export class CookedInputError extends Error {}

export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const MAX_INGREDIENTS = 300;
const MAX_TEXT = 500;

const PHOTO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export const photoExtension = (contentType: string): string | null =>
  PHOTO_TYPES[contentType.toLowerCase()] ?? null;

// Also the path guard: ids reach the file system.
const ID_RE = /^\d{8}-\d{6}-[0-9a-f]{6}$/;

export const isCookedId = (id: string): boolean => ID_RE.test(id);

export const newCookedId = (now: Date): string => {
  const iso = now.toISOString(); // 2026-11-17T18:30:05.123Z
  const stamp = `${iso.slice(0, 10).replaceAll('-', '')}-${iso.slice(11, 19).replaceAll(':', '')}`;

  return `${stamp}-${randomBytes(3).toString('hex')}`;
};

export const appPublicUrl = (): string | null =>
  process.env.APP_PUBLIC_URL?.trim().replace(/\/+$/, '') || null;

export const cookedDir = (): string =>
  path.join(process.env.DATA_DIR?.trim() || path.join(process.cwd(), 'data'), 'cooked');

const text = (v: unknown, max = MAX_TEXT): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

/** Validates what the client sent (`recipe` form field, JSON). */
export const parseCookedRecipe = (raw: unknown): CookedRecipe => {
  let value: unknown;

  try {
    value = typeof raw === 'string' ? JSON.parse(raw) : null;
  } catch {
    throw new CookedInputError('Recette illisible');
  }

  if (!value || typeof value !== 'object') {
    throw new CookedInputError('Recette manquante');
  }

  const r = value as Record<string, unknown>;
  const title = text(r.title, 300);

  if (!title) {
    throw new CookedInputError('Titre de recette manquant');
  }

  const slug = text(r.slug, 200);

  if (slug && !/^[\w-]+$/.test(slug)) {
    throw new CookedInputError('Slug invalide');
  }

  const savedId = text(r.firestoreId, 200);
  const ingredients = (Array.isArray(r.ingredients) ? r.ingredients : [])
    .slice(0, MAX_INGREDIENTS)
    .map(i => text(i))
    .filter((i): i is string => i !== null)
    .map(t => ({ text: t }));

  return {
    title,
    source: slug ? 'mealie' : savedId ? 'saved' : 'other',
    slug,
    saved_id: savedId,
    source_url: text(r.orgURL, 2000),
    ingredients,
  };
};

export const photoPath = (id: string): string => `/api/cooked/${id}/photo`;

export const describePhoto = (
  id: string,
  contentType: string,
  size: number,
  appUrl: string | null,
): CookedPhoto => ({
  path: photoPath(id),
  url: appUrl ? `${appUrl}${photoPath(id)}` : null,
  content_type: contentType,
  size,
});

const writeAtomic = async (file: string, data: string | Buffer) => {
  const tmp = `${file}.tmp`;

  await writeFile(tmp, data);
  await rename(tmp, file);
};

export const savePhoto = async (
  id: string,
  contentType: string,
  bytes: Buffer,
): Promise<void> => {
  const ext = photoExtension(contentType);

  if (!ext) {
    throw new CookedInputError('Format de photo non pris en charge');
  }
  await mkdir(cookedDir(), { recursive: true });
  await writeAtomic(path.join(cookedDir(), `${id}.${ext}`), bytes);
};

export const saveCooked = async (record: StoredCooked): Promise<void> => {
  await mkdir(cookedDir(), { recursive: true });
  await writeAtomic(
    path.join(cookedDir(), `${record.id}.json`),
    JSON.stringify(record, null, 2),
  );
};

export const readCooked = async (id: string): Promise<StoredCooked | null> => {
  if (!isCookedId(id)) {
    return null;
  }

  try {
    return JSON.parse(
      await readFile(path.join(cookedDir(), `${id}.json`), 'utf8'),
    ) as StoredCooked;
  } catch {
    return null;
  }
};

export const readPhoto = async (
  id: string,
): Promise<{ bytes: Buffer; contentType: string } | null> => {
  const record = await readCooked(id);
  const ext = record?.photo && photoExtension(record.photo.content_type);

  if (!record?.photo || !ext) {
    return null;
  }

  try {
    return {
      bytes: await readFile(path.join(cookedDir(), `${id}.${ext}`)),
      contentType: record.photo.content_type,
    };
  } catch {
    return null;
  }
};

/** Most recent first. */
export const listCooked = async (limit = 50): Promise<StoredCooked[]> => {
  let files: string[];

  try {
    files = await readdir(cookedDir());
  } catch {
    return [];
  }

  const ids = files
    .filter(f => f.endsWith('.json'))
    .map(f => f.slice(0, -'.json'.length))
    .filter(isCookedId)
    .sort()
    .reverse()
    .slice(0, limit);
  const records = await Promise.all(ids.map(readCooked));

  return records.filter((r): r is StoredCooked => r !== null);
};
