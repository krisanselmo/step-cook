import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildPrompt } from '@/app/api/gemini/prompt';
import { RECIPE_SCHEMA } from '@/app/api/gemini/recipeSchema';
import {
  RECIPE_SCHEMA_VERSION,
  normalizeSteps,
  parseIngredientLine,
} from '@/app/lib/utils';

/** Ne garde que les chaînes non vides d'un tableau potentiellement hétérogène. */
const toCleanStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === 'string' && item.trim() !== '',
      )
    : [];

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value : undefined;

export async function POST(req: NextRequest) {
  try {
    const { userPrompt, equipment } = await req.json();

    if (!userPrompt) {
      return NextResponse.json(
        { error: 'User prompt is required' },
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

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Directive utilisateur: "${userPrompt}"`,
      config: {
        systemInstruction: buildPrompt(equipment),
        responseMimeType: 'application/json',
        responseSchema: RECIPE_SCHEMA,
      },
    });

    const text = (response.text ?? '').trim();

    if (!text) {
      return NextResponse.json(
        { error: 'Gemini did not generate a recipe.' },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(text);
    const ingredientLines = toCleanStringArray(parsed.ingredients);
    const steps = normalizeSteps(parsed.steps, {
      structured: true,
      ingredients: ingredientLines.map(parseIngredientLine),
    });

    // La sortie structurée garantit la forme, pas le contenu : une recette sans
    // titre ni étape est un échec, pas quelque chose à afficher.
    if (typeof parsed.title !== 'string' || !parsed.title.trim() || steps.length === 0) {
      return NextResponse.json(
        { error: 'Gemini a renvoyé une recette inexploitable.' },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        recipe: {
          title: parsed.title.trim(),
          description: asOptionalString(parsed.description),
          prepTime: asOptionalString(parsed.prepTime),
          cookTime: asOptionalString(parsed.cookTime),
          totalTime: asOptionalString(parsed.totalTime),
          ingredients: ingredientLines,
          steps,
          schemaVersion: RECIPE_SCHEMA_VERSION,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error in Gemini generate API:', error);

    return NextResponse.json(
      { error: 'Internal Server Error during Gemini generation.' },
      { status: 500 },
    );
  }
}
