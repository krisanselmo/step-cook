import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const baseUrl = process.env.MEALIE_BASE_URL;
  const token = process.env.MEALIE_API_TOKEN;
  const cfCookie = process.env.MEALIE_CF_COOKIE;

  if (!baseUrl || !token) {
    return NextResponse.json({ error: "Configuration Mealie manquante (URL ou Token)" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const slug = formData.get('slug') as string;

    if (!slug) {
      return NextResponse.json({ error: "Slug manquant" }, { status: 400 });
    }

    const commonHeaders: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      ...(cfCookie ? { 'Cookie': cfCookie } : {})
    };

    // 1. CRÉATION DU COOK LOG (Pour la Timeline)
    // C'est cette étape qui permet de voir la recette dans https://mealie.../timeline
    try {
      console.log(`[Mealie Log] Creating cook log for slug: ${slug}`);
      const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

      const logResponse = await fetch(`${baseUrl}/api/recipes/${slug}/cook-logs`, {
        method: 'POST',
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cookDate: today })
      });

      if (!logResponse.ok) {
        const logError = await logResponse.text();
        console.error("[Mealie Log] Error creating log:", logError);
      } else {
        console.log("[Mealie Log] Cook log created successfully");
      }
    } catch (e) {
      console.error("[Mealie Log] Failed to contact cook-logs endpoint:", e);
    }

    // 2. TRAITEMENT DE L'IMAGE (Si présente)
    if (image && image.size > 0) {
      console.log(`[Mealie Image] Attempting upload for slug: ${slug} (${image.name})`);

      const mealieFormData = new FormData();
      // On passe directement le File. Fetch en Node gère le stream correctement.
      mealieFormData.append('image', image);

      const imgResponse = await fetch(`${baseUrl}/api/recipes/${slug}/image`, {
        method: 'POST',
        headers: commonHeaders, // Ne pas mettre Content-Type, fetch le génère
        body: mealieFormData,
      });

      if (!imgResponse.ok) {
        const imgErrorText = await imgResponse.text();
        console.error(`[Mealie Image] Upload failed (${imgResponse.status}):`, imgErrorText);

        // On retourne une erreur spécifique pour l'image mais le log a été tenté
        return NextResponse.json({
          success: false,
          error: "Le log a été créé mais l'image a été rejetée par Mealie.",
          details: imgErrorText
        }, { status: imgResponse.status });
      }

      console.log("[Mealie Image] Image uploaded successfully");
    }

    return NextResponse.json({ success: true, message: "Cuisiné ! Ajouté à la timeline." });

  } catch (error: unknown) {
    console.error("[Mealie Upload] Critical Error:", error);
    return NextResponse.json({
      error: "Échec du traitement de la requête",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
