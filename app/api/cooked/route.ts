import { NextResponse } from 'next/server';
import {
  COOKED_EVENT,
  CookedInputError,
  MAX_PHOTO_BYTES,
  appPublicUrl,
  describePhoto,
  listCooked,
  newCookedId,
  parseCookedRecipe,
  photoExtension,
  saveCooked,
  savePhoto,
  type StoredCooked,
} from '@/app/lib/cooked';
import { logMealieCook } from '@/app/lib/mealie';
import { sendWebhook } from '@/app/lib/webhook';

export const dynamic = 'force-dynamic';

/** Recent validations, most recent first (`?limit=`, 50 by default). */
export async function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get('limit')) || 50;

  return NextResponse.json(await listCooked(Math.min(Math.max(limit, 1), 500)));
}

/**
 * Multipart: `recipe` (JSON: title, ingredients, slug?, firestoreId?, orgURL?)
 * and an optional `photo`. Saves the record and its photo, then tells Mealie
 * and the webhook; their failures are reported, never fatal.
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData().catch(() => {
      throw new CookedInputError('Formulaire illisible');
    });
    const recipe = parseCookedRecipe(form.get('recipe'));
    const photoField = form.get('photo');
    const photo =
      photoField instanceof Blob && photoField.size > 0 ? photoField : null;
    const contentType = photo?.type.toLowerCase() ?? '';
    const extension = photo ? photoExtension(contentType) : null;

    if (photo && !extension) {
      throw new CookedInputError('Format de photo non pris en charge');
    }

    if (photo && photo.size > MAX_PHOTO_BYTES) {
      throw new CookedInputError('Photo trop lourde (15 Mo au plus)');
    }

    const now = new Date();
    const id = newCookedId(now);
    const cookedAt = now.toISOString();
    const bytes = photo ? Buffer.from(await photo.arrayBuffer()) : null;

    if (bytes) {
      await savePhoto(id, contentType, bytes);
    }

    const record: StoredCooked = {
      id,
      cooked_at: cookedAt,
      recipe,
      photo: bytes
        ? describePhoto(id, contentType, bytes.length, appPublicUrl())
        : null,
    };

    // Saved before the integrations: the validation survives them.
    await saveCooked(record);

    const mealie = recipe.slug
      ? await logMealieCook(
          recipe.slug,
          cookedAt,
          bytes && extension ? { bytes, contentType, extension } : null,
        )
      : null;
    const webhook = await sendWebhook(COOKED_EVENT, record, appPublicUrl());
    const stored: StoredCooked = { ...record, mealie, webhook };

    await saveCooked(stored);

    return NextResponse.json(stored, { status: 201 });
  } catch (error) {
    if (error instanceof CookedInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('[Cooked] Failed to save:', error);

    return NextResponse.json(
      {
        error: "Impossible d'enregistrer la recette cuisinée",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
