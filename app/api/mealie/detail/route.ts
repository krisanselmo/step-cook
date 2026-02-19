import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  const baseUrl = process.env.MEALIE_BASE_URL;
  const token = process.env.MEALIE_API_TOKEN;
  const cfCookie = process.env.MEALIE_CF_COOKIE;

  if (!slug)
    return NextResponse.json({ error: 'Slug manquant' }, { status: 400 });

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  if (cfCookie) {
    headers['Cookie'] = cfCookie;
  }

  try {
    console.log(`[Mealie Detail] Fetching slug: ${slug}`);

    const response = await fetch(`${baseUrl}/api/recipes/${slug}`, {
      headers,
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        `[Mealie Detail] Error ${response.status}:`,
        responseText.slice(0, 200),
      );
      // Si 404, on renvoie 404 au front pour qu'il le sache
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Recette introuvable sur Mealie' },
          { status: 404 },
        );
      }

      throw new Error(`Erreur Mealie: ${response.status}`);
    }

    try {
      const data = JSON.parse(responseText);

      return NextResponse.json(data);
    } catch {
      console.error(
        '[Mealie Detail] JSON Parse Error. Content:',
        responseText.slice(0, 200),
      );

      throw new Error('Réponse invalide (HTML reçu au lieu de JSON)');
    }
  } catch (error) {
    console.error('[Mealie Detail] Critical Error:', error);
    return NextResponse.json(
      {
        error: 'Impossible de récupérer la recette',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
