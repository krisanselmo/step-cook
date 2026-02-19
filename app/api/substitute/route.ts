import { NextResponse } from 'next/server';

// Définition du type pour la base de données
type SubstitutionDB = {
  [key: string]: string;
};

// Base de connaissance (Backend)
const SUBSTITUTIONS_DB: SubstitutionDB = {
  beurre:
    "Pour remplacer le beurre, vous pouvez utiliser de l'huile de coco (ratio 1:1), de la compote de pommes (pour le moelleux) ou de la purée d'avocat.",
  crème:
    'Alternative : Yaourt à la grecque, lait de coco (pour un goût exotique) ou crème de soja pour une version végétale.',
  lait: "Remplacez par du lait d'amande, de soja, d'avoine ou simplement de l'eau si c'est pour une pâte brisée.",
  sucre:
    "Alternatives plus saines : Miel, sirop d'agave, sirop d'érable ou sucre de coco.",
  farine:
    "Pour une version sans gluten : Mix de farine de riz et maïzena. Sinon, farine complète ou d'épeautre.",
  oeuf: "1 œuf = 1/2 banane écrasée ou 1 c.à.s de graines de chia trempées dans 3 c.à.s d'eau.",
  vin: 'Remplacez par du bouillon de volaille/légumes ou un peu de vinaigre de cidre dilué.',
  oignon: "Poudre d'oignon, échalote ou la partie blanche des poireaux.",
  levure: 'Bicarbonate de soude avec un peu de jus de citron.',
  huile: 'Beurre fondu, compote de pommes (dans les gâteaux) ou yaourt.',
};

// Définition du type pour le corps de la requête
interface RequestBody {
  ingredient: string;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { ingredient } = body;

    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingrédient manquant' },
        { status: 400 },
      );
    }

    // Recherche simple par mot clé
    const key = Object.keys(SUBSTITUTIONS_DB).find(k =>
      ingredient.toLowerCase().includes(k),
    );

    const suggestion = key
      ? SUBSTITUTIONS_DB[key]
      : `Pour remplacer "${ingredient}", essayez de chercher une alternative végétale ou un ingrédient avec une texture similaire sur internet.`;

    // Simulation d'un délai réseau pour l'effet "Analyse de l'IA"
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 },
    );
  }
}
