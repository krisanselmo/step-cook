import { NextResponse } from 'next/server';

// Permet à l'UI de masquer les fonctions IA plutôt que de les proposer puis d'échouer.
export async function GET() {
  return NextResponse.json({ configured: !!process.env.GEMINI_API_KEY });
}
