import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('recipes')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const recipes = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      description: doc.data().description || null,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('[Firestore] Error listing recipes:', error);

    return NextResponse.json(
      { error: 'Impossible de récupérer les recettes sauvegardées' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipe, userPrompt } = body;

    if (!recipe?.title || !Array.isArray(recipe?.steps)) {
      return NextResponse.json(
        { error: 'Recette invalide (title et steps requis)' },
        { status: 400 },
      );
    }

    const db = getDb();
    const docRef = await db.collection('recipes').add({
      title: recipe.title,
      description: recipe.description || null,
      prepTime: recipe.prepTime || null,
      cookTime: recipe.cookTime || null,
      totalTime: recipe.totalTime || null,
      ingredients: recipe.ingredients || [],
      steps: recipe.steps,
      userPrompt: userPrompt || '',
      source: 'gemini',
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('[Firestore] Error saving recipe:', error);

    return NextResponse.json(
      { error: 'Impossible de sauvegarder la recette' },
      { status: 500 },
    );
  }
}
