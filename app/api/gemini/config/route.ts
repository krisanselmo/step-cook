import { NextResponse } from 'next/server';

// Lets the UI hide the AI features rather than offer them and fail.
export async function GET() {
  return NextResponse.json({ configured: !!process.env.GEMINI_API_KEY });
}
