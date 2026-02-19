import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.MEALIE_BASE_URL;
  const token = process.env.MEALIE_API_TOKEN;
  const cfCookie = process.env.MEALIE_CF_COOKIE; // Récupération du cookie

  if (!baseUrl) {
    return NextResponse.json(
      { error: 'MEALIE_BASE_URL non définie' },
      { status: 500 },
    );
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Injection du cookie si présent (pour passer Cloudflare Zero Trust)
  if (cfCookie) {
    headers['Cookie'] = cfCookie;
  }

  try {
    console.log(`[Mealie Proxy] Fetching recipes list from ${baseUrl}`);

    const response = await fetch(
      `${baseUrl}/api/recipes?perPage=100&orderBy=date_added&orderDirection=desc`,
      {
        headers,
      },
    );

    // On lit le texte brut d'abord pour pouvoir le logger en cas d'erreur
    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        `[Mealie Proxy] Error ${response.status}:`,
        responseText.slice(0, 500),
      );
      throw new Error(`Erreur Mealie: ${response.status}`);
    }

    try {
      const data = JSON.parse(responseText);

      // On retourne items si paginé, ou la réponse directe
      return NextResponse.json(data.items || data);
    } catch {
      console.error(
        '[Mealie Proxy] JSON Parse Error. Received content start:',
        responseText.slice(0, 200),
      );
      throw new Error('Réponse invalide (HTML reçu au lieu de JSON)');
    }
  } catch (error) {
    console.error('[Mealie Proxy] Critical Error:', error);

    return NextResponse.json(
      {
        error: 'Impossible de récupérer les recettes',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
