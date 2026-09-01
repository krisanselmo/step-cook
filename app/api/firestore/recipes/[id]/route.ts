import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/firebase';
import { toRecipeDocument } from '../document';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const db = getDb();
    const doc = await db.collection('recipes').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Recette introuvable' },
        { status: 404 },
      );
    }

    const data = doc.data();

    return NextResponse.json({
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
    });
  } catch (error) {
    console.error('[Firestore] Error fetching recipe:', error);

    return NextResponse.json(
      { error: 'Impossible de récupérer la recette' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { recipe } = body;

    if (!recipe?.title || !Array.isArray(recipe?.steps)) {
      return NextResponse.json(
        { error: 'Recette invalide (title et steps requis)' },
        { status: 400 },
      );
    }

    const db = getDb();
    await db.collection('recipes').doc(id).update(toRecipeDocument(recipe));

    return NextResponse.json({ message: 'Recette mise à jour' });
  } catch (error) {
    console.error('[Firestore] Error updating recipe:', error);

    return NextResponse.json(
      { error: 'Impossible de mettre à jour la recette' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const db = getDb();
    await db.collection('recipes').doc(id).delete();

    return NextResponse.json({ message: 'Recette supprimée' });
  } catch (error) {
    console.error('[Firestore] Error deleting recipe:', error);

    return NextResponse.json(
      { error: 'Impossible de supprimer la recette' },
      { status: 500 },
    );
  }
}
