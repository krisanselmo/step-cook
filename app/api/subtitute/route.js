import { NextResponse } from 'next/server';

const SUBSTITUTIONS_DB = {
  'beurre': "Pour remplacer le beurre, vous pouvez utiliser de l'huile de coco (ratio 1:1), de la compote de pommes (pour le moelleux) ou de la purée d'avocat.",
  'crème': "Alternative : Yaourt à la grecque, lait de coco (pour un goût exotique) ou crème de soja pour une version végétale.",
  'lait': "Remplacez par du lait d'amande, de soja, d'avoine ou simplement de l'eau si c'est pour une pâte brisée.",
  'sucre': "Alternatives plus saines : Miel, sirop d'agave, sirop d'érable ou sucre de coco.",
  'farine': "Pour une version sans gluten : Mix de farine de riz et maïzena. Sinon, farine complète ou d'épeautre.",
  'oeuf': "1 œuf = 1/2 banane écrasée ou 1 c.à.s de graines de chia trempées dans 3 c.à.s d'eau.",
  'vin': "Remplacez par du bouillon de volaille/légumes ou un peu de vinaigre de cidre dilué.",
  'oignon': "Poudre d'oignon, échalote ou la partie blanche des poireaux.",
  'levure': "Bicarbonate de soude avec un peu de jus de citron.",
  'huile': "Beurre fondu, compote de pommes (dans les gâteaux) ou yaourt."
};

export async function POST(request) {
  try {
    const { ingredient } = await request.json();

    // Recherche simple par mot clé
    const key = Object.keys(SUBSTITUTIONS_DB).find(k => ingredient.toLowerCase().includes(k));
    const suggestion = key
      ? SUBSTITUTIONS_DB[key]
      : `Pour remplacer "${ingredient}", essayez de chercher une alternative végétale ou un ingrédient avec une texture similaire sur internet.`;

    // Petit délai artificiel pour faire "réfléchir" l'IA
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({ suggestion });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
