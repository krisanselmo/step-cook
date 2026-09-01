import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { buildAgentPrompt } from './prompt';
import { getGeminiClient } from '@/app/api/gemini/client';
import { RECIPE_SCHEMA } from '@/app/api/gemini/recipeSchema';
import {
  RECIPE_SCHEMA_VERSION,
  normalizeSteps,
  parseIngredientLine,
} from '@/app/lib/utils';

/** Nombre de tours de conversation renvoyés au modèle (borne la taille du prompt). */
const MAX_HISTORY_MESSAGES = 12;

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    action: { type: Type.STRING, enum: ['answer', 'propose'] },
    reply: { type: Type.STRING },
    recipe: RECIPE_SCHEMA,
    changes: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['action', 'reply'],
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

/** Ne garde que les chaînes non vides d'un tableau potentiellement hétérogène. */
const toCleanStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
    : [];

export async function POST(req: NextRequest) {
  try {
    const { recipe, message, history, equipment } = await req.json();

    if (!recipe || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: 'Recipe et message requis' },
        { status: 400 },
      );
    }

    const { ai, modelName, error } = getGeminiClient();

    if (error) {
      return error;
    }

    const recipeJson = JSON.stringify(
      {
        title: recipe.title,
        description: recipe.description,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        totalTime: recipe.totalTime,
        ingredients:
          recipe.ingredients?.map((ing: { fullText: string }) => ing.fullText) || [],
        steps: recipe.steps,
      },
      null,
      2,
    );

    // La recette est jointe au dernier tour plutôt qu'au prompt système : elle
    // évolue au fil des propositions acceptées, l'agent doit voir la version courante.
    const pastTurns: HistoryMessage[] = Array.isArray(history)
      ? history
          .filter(
            (msg: unknown): msg is HistoryMessage =>
              !!msg &&
              typeof (msg as HistoryMessage).content === 'string' &&
              ((msg as HistoryMessage).role === 'user' ||
                (msg as HistoryMessage).role === 'assistant'),
          )
          .slice(-MAX_HISTORY_MESSAGES)
      : [];

    const contents = [
      ...pastTurns.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [
          {
            text: `Recette actuelle (JSON) :\n${recipeJson}\n\nMessage de l'utilisateur : "${message}"`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: buildAgentPrompt(equipment),
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = (response.text ?? '').trim();
    const jsonText = text
      .replace(/^```json\s*/, '')
      .replace(/```\s*$/, '')
      .trim();
    const parsed = JSON.parse(jsonText);

    if (typeof parsed.reply !== 'string' || parsed.reply.trim() === '') {
      throw new Error('Format de réponse invalide');
    }

    const proposedRecipe = parsed.recipe;
    const proposedIngredients = toCleanStringArray(proposedRecipe?.ingredients);
    const proposedSteps = normalizeSteps(proposedRecipe?.steps, {
      structured: true,
      ingredients: proposedIngredients.map(parseIngredientLine),
    });
    const hasUsableProposal =
      parsed.action === 'propose' &&
      !!proposedRecipe &&
      typeof proposedRecipe.title === 'string' &&
      isStringArray(proposedRecipe.ingredients) &&
      proposedSteps.length > 0;

    // Le modèle peut annoncer une proposition sans fournir de recette exploitable :
    // on retombe alors sur une simple réponse plutôt que d'échouer.
    if (!hasUsableProposal) {
      return NextResponse.json({ action: 'answer', reply: parsed.reply });
    }

    return NextResponse.json({
      action: 'propose',
      reply: parsed.reply,
      recipe: {
        title: proposedRecipe.title,
        description: proposedRecipe.description,
        prepTime: proposedRecipe.prepTime,
        cookTime: proposedRecipe.cookTime,
        totalTime: proposedRecipe.totalTime,
        ingredients: proposedIngredients,
        steps: proposedSteps,
        schemaVersion: RECIPE_SCHEMA_VERSION,
      },
      changes: toCleanStringArray(parsed.changes),
    });
  } catch (error) {
    console.error('[Gemini Chat] Error:', error);

    return NextResponse.json(
      { error: "Erreur lors de l'échange avec l'assistant" },
      { status: 500 },
    );
  }
}
