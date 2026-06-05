import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const EDIT_PROMPT = `Tu es un assistant culinaire expert spécialisé Thermomix. L'utilisateur va te donner une recette existante au format JSON et une demande de modification.

Tu dois :
1. Appliquer la modification demandée sur la recette
2. Retourner la recette modifiée au format JSON
3. Lister précisément ce qui a changé (ingrédients modifiés, étapes changées avec leur numéro)

IMPORTANT pour les étapes :
- Garde la même syntaxe Thermomix : temps ("5 min"), température ("100°C", "Varoma"), vitesse ("vitesse 3", "vitesse mijotage", "mode pétrin", "mode turbo"), sens inverse si besoin.

Retourne UNIQUEMENT un objet JSON brut (pas de markdown, pas de \`\`\`json) avec cette structure :
{
  "recipe": {
    "title": "...",
    "description": "...",
    "prepTime": "...",
    "cookTime": "...",
    "totalTime": "...",
    "ingredients": ["..."],
    "steps": ["..."]
  },
  "changes": [
    "Remplacé X par Y dans les ingrédients",
    "Modifié l'étape 3 : nouveau texte"
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { recipe, message } = await req.json();

    if (!recipe || !message) {
      return NextResponse.json(
        { error: 'Recipe et message requis' },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured.' },
        { status: 500 },
      );
    }

    const recipeJson = JSON.stringify({
      title: recipe.title,
      description: recipe.description,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      ingredients: recipe.ingredients?.map((ing: { fullText: string }) => ing.fullText) || [],
      steps: recipe.steps,
    }, null, 2);

    const fullPrompt = `${EDIT_PROMPT}\n\nRecette actuelle :\n${recipeJson}\n\nDemande de l'utilisateur : "${message}"\n\nRéponse :`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text().trim();

    const jsonText = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(jsonText);

    if (!parsed.recipe || !parsed.changes) {
      throw new Error('Format de réponse invalide');
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('[Gemini Edit] Error:', error);

    return NextResponse.json(
      { error: 'Erreur lors de la modification de la recette' },
      { status: 500 },
    );
  }
}
