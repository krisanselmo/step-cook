import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {PROMPT} from "@/app/api/gemini/prompt";

export async function POST(req: NextRequest) {
  try {
    const { userPrompt } = await req.json();

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

    const fullPrompt = `${PROMPT}\n\nDirective utilisateur: "${userPrompt}"\n\nRecette générée:`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
    });
    const generatedRecipeText = response.text;

    if (!generatedRecipeText) {
      return NextResponse.json(
        { error: 'Gemini did not generate a recipe.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        generatedRecipeText: generatedRecipeText,
        message: 'Recipe generated successfully.',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error in Gemini generate API:', error);

    // More specific error handling could be implemented here for different Gemini API errors
    return NextResponse.json(
      { error: 'Internal Server Error during Gemini generation.' },
      { status: 500 },
    );
  }
}
