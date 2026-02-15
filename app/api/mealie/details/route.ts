import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  const baseUrl = process.env.MEALIE_BASE_URL;
  const token = process.env.MEALIE_API_TOKEN;
  const cfCookie = process.env.MEALIE_CF_COOKIE; // Récupération du cookie

  if (!slug) return NextResponse.json({ error: "Slug manquant" }, { status: 400 });

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  if (cfCookie) {
    headers['Cookie'] = cfCookie;
  }

  try {
    console.log(`[Mealie Proxy] Fetching detail for slug: ${slug}`);

    const response = await fetch(`${baseUrl}/api/recipes/${slug}`, {
      headers
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`[Mealie Proxy] Error ${response.status} for slug ${slug}:`, responseText.slice(0, 500));
      throw new Error(`Erreur Mealie: ${response.status}`);
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (jsonError) {
      console.error("[Mealie Proxy] JSON Parse Error for detail. Received content start:", responseText.slice(0, 200));
      throw new Error("Réponse invalide (HTML reçu au lieu de JSON)");
    }

  } catch (error) {
    console.error("[Mealie Proxy] Critical Error detail:", error);
    return NextResponse.json({
      error: "Impossible de récupérer la recette",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
