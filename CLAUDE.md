# Step Cook

Application de cuisine interactive pour Thermomix (Next.js) : suivre une recette pas à pas
avec timer, température et vitesse.

## Stack technique

- **Framework** : Next.js 16 (App Router), React 19, TypeScript
- **Style** : Tailwind CSS 4, icônes lucide-react
- **Tests** : Jest + Testing Library
- **Dev server** : port 4000
- **Intégrations, toutes optionnelles** : Gemini (génération de recettes + agent
  conversationnel), Mealie (instance auto-hébergée derrière Cloudflare Access),
  Firestore (recettes sauvegardées). Sans configuration, seul le mode manuel fonctionne.

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
│   │   ├── prompt.ts          # buildPrompt() : format JSON attendu + matériel possédé
│   │   ├── generate/route.ts  # POST - Génère une recette
│   │   ├── config/route.ts    # GET  - Gemini est-il configuré ?
│   │   └── chat/              # POST - Agent sur la recette courante : répond, ou
│   │                          #        propose une version modifiée soumise à
│   │                          #        validation humaine (jamais auto-appliquée)
│   ├── mealie/
│   │   ├── recipes/route.ts   # GET  - Liste
│   │   ├── detail/route.ts    # GET  - Détail
│   │   └── upload/route.ts    # POST - Cook log + photo
│   ├── firestore/recipes/
│   │   ├── route.ts           # GET (lister) + POST (sauvegarder)
│   │   └── [id]/route.ts      # GET (détail) + PUT (modifier) + DELETE
│   └── substitute/            # POST - Substitution d'ingrédient
├── components/ui/             # Button, ThemeDropdown, EquipmentModal (config matériel),
│                              # StepAccessories (panneau Varoma / Découpe-minute),
│                              # VaromaStack & CutterDisc (visuels SVG)
├── hooks/
│   └── useCookingState.ts     # Hook principal : état global de l'app
├── lib/
│   ├── types.ts               # Recipe, Ingredient, StepParams, ChatMessage, ThemePlugin…
│   ├── utils.ts               # parseRecipe(), extractStepParams() (temps, température,
│   │                          # vitesse, sens inverse), detectStepAccessories(), Levenshtein
│   ├── equipment.ts           # Catalogue du matériel + 4 modes du Découpe-minute,
│   │                          # buildEquipmentPromptBlock() pour les pré-prompts IA
│   ├── firebase.ts            # Firebase Admin SDK (getDb(), isFirebaseConfigured())
│   └── themes.ts              # Thèmes visuels
├── views/
│   ├── InputView.tsx          # Accueil : recettes Mealie + sauvegardées, manuel, Gemini
│   ├── ProcessingView.tsx     # Écran de chargement
│   └── CookingView.tsx        # Overview + pas-à-pas + chat
└── page.tsx                   # Point d'entrée, orchestre les vues
```

## Variables d'environnement (.env.local)

- `MEALIE_BASE_URL` / `NEXT_PUBLIC_MEALIE_BASE_URL` : URL de l'instance Mealie
- `MEALIE_API_TOKEN` : Token API Mealie (long-lived)
- `MEALIE_CF_COOKIE` : Cookie Cloudflare Access (`CF_AppSession` + `CF_Authorization`) — expire régulièrement
- `GEMINI_API_KEY` : Clé API Google Generative AI
- `FIREBASE_SERVICE_ACCOUNT_PATH` : Chemin vers le service account JSON
- `FIREBASE_SERVICE_ACCOUNT_JSON` : Alternative au path, pour le déploiement

## Conventions

- Langue de l'UI : **français**
- Recettes orientées Thermomix (temps, température, vitesse, sens inverse)
- Toutes les sources convergent vers le type `Recipe` via `parseRecipe()` (JSON prioritaire,
  texte en fallback) ; les recettes Firestore sont déjà structurées
- Thèmes pluggables (`ThemePlugin`), dark/light via le helper `t(darkClass, lightClass)`
- Une intégration non configurée est masquée de l'UI ; en panne, elle affiche un bandeau
- Le matériel possédé est une config locale (`localStorage`, clé `ownedEquipment`), envoyée
  à Gemini dans le pré-prompt : l'IA ne propose que des étapes réalisables avec
