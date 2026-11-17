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
│   │   ├── recipeSchema.ts    # RECIPE_SCHEMA : sortie structurée imposée aux 2 routes
│   │   ├── prompt.ts          # buildPrompt() : format JSON attendu + matériel possédé
│   │   ├── generate/route.ts  # POST - Génère une recette
│   │   ├── config/route.ts    # GET  - Gemini est-il configuré ?
│   │   └── chat/              # POST - Agent sur la recette courante : répond, ou
│   │                          #        propose une version modifiée soumise à
│   │                          #        validation humaine (jamais auto-appliquée)
│   ├── mealie/
│   │   ├── recipes/route.ts   # GET  - Liste
│   │   └── detail/route.ts    # GET  - Détail
│   ├── cooked/
│   │   ├── route.ts           # POST - « Je l'ai cuisiné » : enregistre (+ photo),
│   │   │                      #        timeline Mealie, webhook ; GET - historique
│   │   └── [id]/photo/route.ts # GET - Photo du plat
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
│   ├── types.ts               # Recipe, RecipeStep, Ingredient, StepParams, ChatMessage…
│   ├── utils.ts               # parseRecipe(), normalizeSteps(), extractStepParams() (temps,
│   │                          # température, vitesse, sens inverse), detectStepAccessories(),
│   │                          # RECIPE_SCHEMA_VERSION, Levenshtein
│   ├── equipment.ts           # Catalogue du matériel + 4 modes du Découpe-minute,
│   │                          # buildEquipmentPromptBlock() pour les pré-prompts IA
│   ├── firebase.ts            # Firebase Admin SDK (getDb(), isFirebaseConfigured())
│   ├── cooked.ts              # Recettes cuisinées : format, validation, stockage (DATA_DIR)
│   ├── webhook.ts             # Webhook sortant (enveloppe, signature HMAC, 1 nouvel essai)
│   ├── mealie.ts              # « Cuisinée » côté Mealie : timeline + date de dernière fois
│   ├── photo.ts               # Réduction de la photo dans le navigateur avant envoi
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
- `DATA_DIR` : dossier des recettes cuisinées et de leurs photos (`./data` par défaut, `/app/data`
  dans l'image : à monter en volume)
- `WEBHOOK_URL` : reçoit `recipe.cooked` à chaque validation ; `WEBHOOK_SECRET` le signe
- `APP_PUBLIC_URL` : adresse de l'app, pour l'URL absolue de la photo dans le webhook

## Conventions

- Langue de l'UI : **français**
- Recettes orientées Thermomix (temps, température, vitesse, sens inverse)
- Toutes les sources convergent vers le type `Recipe` via `parseRecipe()` (JSON prioritaire,
  texte en fallback) ; les recettes Firestore sont déjà structurées
- Thèmes pluggables (`ThemePlugin`), dark/light via le helper `t(darkClass, lightClass)`
- Une intégration non configurée est masquée de l'UI ; en panne, elle affiche un bandeau
- `schemaVersion` (Firestore) arbitre la lecture d'une recette : absent/1 = étapes en texte,
  réglages/accessoires/ingrédients déduits par heuristique ; 2 = l'étape déclare `settings`,
  `accessories` et `ingredients`, et **aucun regex ne tourne**. Gemini produit du 2 ; Mealie et
  le copier-coller manuel restent du texte
- Le webhook `recipe.cooked` (corps `{event, id, at, app_url, data}`, `data` = `CookedRecord`)
  est un contrat avec ce qui le reçoit : ajouter des champs, ne jamais en renommer
- Le gobelet doseur est en place par défaut : seul son retrait (`state: 'removed'`) est affiché
- Le matériel possédé est une config locale (`localStorage`, clé `ownedEquipment`), envoyée
  à Gemini dans le pré-prompt : l'IA ne propose que des étapes réalisables avec
