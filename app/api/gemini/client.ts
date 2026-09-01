import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Client Gemini et modèle à utiliser, ou la réponse d'erreur à renvoyer telle
 * quelle si l'intégration n'est pas configurée.
 *
 * Les deux routes IA partagent la même clé et le même modèle : les garder
 * synchronisées à la main, c'est risquer que l'une parle à un autre modèle que
 * l'autre.
 */
export const getGeminiClient = ():
  | { ai: GoogleGenAI; modelName: string; error?: never }
  | { ai?: never; modelName?: never; error: NextResponse } => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      error: NextResponse.json(
        { error: 'Gemini API key not configured.' },
        { status: 500 },
      ),
    };
  }

  return {
    ai: new GoogleGenAI({ apiKey }),
    modelName: process.env.GEMINI_MODEL_NAME || DEFAULT_MODEL,
  };
};
