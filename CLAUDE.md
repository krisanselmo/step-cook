# Step Cook

Application de cuisine interactive pour Thermomix, construite avec Next.js.
Elle permet de suivre une recette étape par étape avec timer, température et vitesse.

## Stack technique

- **Framework** : Next.js 16 (App Router), React 19, TypeScript
- **Style** : Tailwind CSS 4
- **Icônes** : lucide-react
- **IA** : Google Generative AI (Gemini) pour la génération/substitution de recettes
- **Backend externe** : Mealie (gestionnaire de recettes auto-hébergé, derrière Cloudflare Access)
- **Stockage** : Firebase Firestore (recettes générées par Gemini)
- **Tests** : Jest + Testing Library
- **Dev server** : port 4000 (`next dev -p 4000`)

## Commandes

```bash
npm run dev       # Serveur dev sur http://localhost:4000
npm run build     # Build production
npm run lint      # ESLint
npm test          # Jest
```

## Architecture

```
app/
├── api/
│   ├── gemini/
│   │   ├── prompt.ts          # Prompt système pour Gemini (format JSON attendu)
│   │   └── generate/route.ts  # POST - Génère une recette via Gemini
│   ├── mealie/
│   │   ├── recipes/route.ts   # GET - Liste les recettes Mealie
│   │   ├── detail/route.ts    # GET - Détail d'une recette Mealie
│   │   └── upload/route.ts    # POST - Cook log + upload photo vers Mealie
│   ├── firestore/
│   │   └── recipes/
│   │       ├── route.ts       # GET (lister) + POST (sauvegarder) recettes Firestore
│   │       └── [id]/route.ts  # GET (détail) + DELETE (supprimer)
│   └── substitute/            # POST - Suggestion de substitution d'ingrédient via Gemini
├── components/ui/             # Composants UI réutilisables (Button, ThemeDropdown)
├── hooks/
│   └── useCookingState.ts     # Hook principal : état global de l'app
├── lib/
│   ├── types.ts               # Interfaces (Recipe, Ingredient, StepParams, Mealie types, SavedRecipeSummary, ThemePlugin)
│   ├── utils.ts               # Parsing recettes (JSON/texte), extraction params Thermomix, Levenshtein
│   ├── firebase.ts            # Singleton Firebase Admin SDK (getDb())
│   └── themes.ts              # Thèmes visuels (couleurs, fonts, radius)
├── views/
│   ├── InputView.tsx           # Page d'accueil : liste Mealie, recettes sauvegardées, mode manuel, mode Gemini
│   ├── ProcessingView.tsx      # Écran de chargement
│   └── CookingView.tsx         # Vue cuisine : overview (KPIs, description, ingrédients, étapes) + step-by-step
└── page.tsx                    # Point d'entrée, orchestre les vues
```

## Flux de données des recettes

Les recettes arrivent par 4 chemins, tous convergent vers le type `Recipe` :

1. **Gemini** : prompt utilisateur → API Gemini → JSON brut → `parseRecipe()` → `Recipe` → auto-save Firestore
2. **Mealie** : slug → API detail → `formatMealieToText()` → `parseRecipe(text, slug, orgURL, metadata)` → `Recipe`
3. **Manuel** : texte libre collé → `parseRecipe()` → `Recipe`
4. **Firestore** : id → API detail → `Recipe` (déjà structuré, pas de parsing)

`parseRecipe()` gère deux modes : JSON (prioritaire) et texte (fallback avec détection de sections).

## Parsing Thermomix

`extractStepParams()` extrait de chaque étape : temps, température, vitesse, sens inverse.
`corrigerInstructionsThermomix()` normalise la notation `//` (sens inverse) en emojis lisibles.

## Variables d'environnement (.env.local)

- `MEALIE_BASE_URL` / `NEXT_PUBLIC_MEALIE_BASE_URL` : URL de l'instance Mealie
- `MEALIE_API_TOKEN` : Token API Mealie (long-lived)
- `MEALIE_CF_COOKIE` : Cookie Cloudflare Access (`CF_AppSession` + `CF_Authorization`) — expire régulièrement
- `GEMINI_API_KEY` : Clé API Google Generative AI
- `FIREBASE_SERVICE_ACCOUNT_PATH` : Chemin vers le fichier service account JSON (ex: `./private/firebase-service-account.json`)
- `FIREBASE_SERVICE_ACCOUNT_JSON` : Alternative au path — JSON stringifié du service account (pour déploiement)

## Conventions

- Langue de l'UI : **français**
- Les recettes sont orientées Thermomix (temps, température, vitesse, sens inverse)
- Le système de thèmes est pluggable (interface `ThemePlugin`)
- Dark/light mode supporté via la fonction helper `t(darkClass, lightClass)`
