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

/** Bounds the prompt size. */
const MAX_HISTORY_MESSAGES = 12;

/** Gemini regularly answers 503 "overloaded" or truncated JSON: both are transient. */
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;

/** A 4xx (bad key, bad request) fails the same way every time, quota aside. */
const isRetryable = (error: unknown): boolean => {
  const status = (error as { status?: unknown } | null)?.status;

  if (typeof status !== 'number') {return true;}

  return status === 408 || status === 429 || status >= 500;
};

const withRetry = async <T>(run: () => Promise<T>): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS || !isRetryable(error)) {throw error;}

      console.warn(`[Gemini Chat] Attempt ${attempt} failed, retrying:`, error);
      await new Promise(resolve =>
        setTimeout(resolve, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)),
      );
    }
  }
};

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

/** Non-empty strings only, from a possibly heterogeneous array. */
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

    // Attached to the last turn, not the system prompt: it changes as
    // proposals are accepted and the agent must see the current version.
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

    // Generation and parsing are retried together: an unparsable or empty
    // answer is as transient as a network error.
    const parsed = await withRetry(async () => {
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
      const result = JSON.parse(jsonText);

      if (typeof result.reply !== 'string' || result.reply.trim() === '') {
        throw new Error('Format de réponse invalide');
      }

      return result;
    });

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

    // The model can announce a proposal without a usable recipe; fall back to
    // a plain answer rather than fail.
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
      {
        error: "Erreur lors de l'échange avec l'assistant",
        // Shown on demand (copy button) to diagnose from the device.
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
