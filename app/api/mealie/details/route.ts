import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  const baseUrl = process.env.MEALIE_BASE_URL;
  const token = process.env.MEALIE_API_TOKEN;

  if (!slug) return NextResponse.json({ error: "Slug manquant" }, { status: 400 });

  try {
    const response = await fetch(`${baseUrl}/api/recipes/${slug}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`Erreur Mealie: ${response.status}`);

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Impossible de récupérer la recette" }, { status: 500 });
  }
}
