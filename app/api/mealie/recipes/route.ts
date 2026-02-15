import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.MEALIE_BASE_URL;
  const token = process.env.MEALIE_API_TOKEN;

  if (!baseUrl) {
    return NextResponse.json({ error: "MEALIE_BASE_URL non définie" }, { status: 500 });
  }

  try {
    const response = await fetch(`${baseUrl}/api/recipes?perPage=100&orderBy=date_added&orderDirection=desc`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur Mealie: ${response.status}`);
    }

    const data = await response.json();
    // On retourne items si paginé, ou la réponse directe
    return NextResponse.json(data.items || data);
  } catch (error) {
    console.error("Erreur fetch Mealie:", error);
    return NextResponse.json({ error: "Impossible de récupérer les recettes" }, { status: 500 });
  }
}
