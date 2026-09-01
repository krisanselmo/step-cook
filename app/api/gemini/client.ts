import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * The client and model, or the error response to return as-is when the
 * integration is unconfigured. Shared so both AI routes cannot drift apart.
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
