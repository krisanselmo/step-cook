import { renderHook, act } from '@testing-library/react';
import { useCookingState } from '../useCookingState';
import { Recipe } from '@/app/lib/types';

describe('useCookingState', () => {
  const MOCK_MEALIE_BASE_URL = 'http://test-mealie.com';
  const MOCK_RECIPE_SLUG = 'test-recipe-slug';
  const MOCK_RECIPE: Recipe = {
    title: 'Test Recipe',
    ingredients: [],
    steps: [{ text: 'Step 1' }],
    slug: MOCK_RECIPE_SLUG,
  };

  let originalWindowOpen: typeof window.open;

  beforeAll(() => {
    originalWindowOpen = window.open;
    window.open = jest.fn();
  });

  afterAll(() => {
    window.open = originalWindowOpen;
  });

  beforeEach(() => {
    process.env.NEXT_PUBLIC_MEALIE_BASE_URL = MOCK_MEALIE_BASE_URL;
    // jsdom has no fetch; the hook fetches Mealie + saved recipes on mount
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as unknown as Response);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MEALIE_BASE_URL;
    (window.open as jest.Mock).mockClear();
    localStorage.clear();
  });

  // Renders the hook and flushes the mount-effect fetches so their state
  // updates land inside act()
  const renderCookingHook = async () => {
    const utils = renderHook(() => useCookingState());

    await act(async () => {});

    return utils;
  };

  it('should open the correct Mealie page URL when openMealiePage is called', async () => {
    const { result } = await renderCookingHook();

    act(() => {
      result.current.setRecipe(MOCK_RECIPE);
    });

    act(() => {
      result.current.openMealiePage();
    });

    expect(window.open).toHaveBeenCalledWith(
      `${MOCK_MEALIE_BASE_URL}/g/home/r/${MOCK_RECIPE_SLUG}`,
      '_blank',
    );
  });

  describe('intégrations optionnelles', () => {
    it('marque Firestore comme non configuré sans lever d\'erreur', async () => {
      (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
        url === '/api/firestore/recipes'
          ? { ok: true, json: async () => ({ configured: false }) }
          : { ok: true, json: async () => [] },
      );

      const { result } = await renderCookingHook();

      expect(result.current.isFirestoreConfigured).toBe(false);
      expect(result.current.savedError).toBeNull();
      expect(result.current.savedRecipes).toEqual([]);
    });

    it('signale une vraie panne Firestore comme une erreur', async () => {
      (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
        url === '/api/firestore/recipes'
          ? { ok: false, json: async () => ({ error: 'boom' }) }
          : { ok: true, json: async () => [] },
      );

      const { result } = await renderCookingHook();

      expect(result.current.isFirestoreConfigured).toBe(true);
      expect(result.current.savedError).toBe(
        'Impossible de charger les recettes sauvegardées.',
      );
    });

    it('marque Gemini comme non configuré quand la clé est absente', async () => {
      (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
        url === '/api/gemini/config'
          ? { ok: true, json: async () => ({ configured: false }) }
          : { ok: true, json: async () => [] },
      );

      const { result } = await renderCookingHook();

      expect(result.current.isGeminiConfigured).toBe(false);
    });

    it('laisse l\'IA visible si la config Gemini est injoignable', async () => {
      // Masquer l'IA sur une erreur réseau serait pire que la laisser échouer
      (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
        url === '/api/gemini/config'
          ? { ok: false, json: async () => ({}) }
          : { ok: true, json: async () => [] },
      );

      const { result } = await renderCookingHook();

      expect(result.current.isGeminiConfigured).toBe(true);
    });
  });

  describe('intégration Mealie optionnelle', () => {
    it('marque Mealie comme non configuré sans lever d\'erreur', async () => {
      // Le proxy répond ainsi quand MEALIE_BASE_URL est absente du .env
      (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
        url === '/api/mealie/recipes'
          ? { ok: true, json: async () => ({ configured: false }) }
          : { ok: true, json: async () => [] },
      );

      const { result } = await renderCookingHook();

      expect(result.current.isMealieConfigured).toBe(false);
      expect(result.current.mealieError).toBeNull();
      expect(result.current.mealieRecipes).toEqual([]);
    });

    it('signale une vraie panne Mealie comme une erreur', async () => {
      (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
        url === '/api/mealie/recipes'
          ? { ok: false, json: async () => ({ error: 'boom' }) }
          : { ok: true, json: async () => [] },
      );

      const { result } = await renderCookingHook();

      expect(result.current.isMealieConfigured).toBe(true);
      expect(result.current.mealieError).toBe(
        'Impossible de charger les recettes Mealie.',
      );
    });
  });

  describe('agent conversationnel (chat)', () => {
    const CHAT_RECIPE: Recipe = {
      title: 'Soupe',
      ingredients: [{ fullText: '50 g de beurre', keywords: ['beurre'] }],
      steps: [{ text: 'Faire fondre le beurre 2 min / 100°C / vitesse 1.' }],
    };

    // Le hook fetch Mealie + recettes sauvegardées au montage : on ne pilote que
    // l'appel suivant, celui de l'agent.
    const mockAgentResponse = (payload: unknown, ok = true) => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok,
        json: async () => payload,
      } as unknown as Response);
    };

    const renderWithRecipe = async () => {
      const utils = await renderCookingHook();

      act(() => {
        utils.result.current.setRecipe(CHAT_RECIPE);
      });

      return utils;
    };

    it('affiche une réponse simple sans toucher à la recette', async () => {
      const { result } = await renderWithRecipe();

      mockAgentResponse({
        action: 'answer',
        reply: 'Le sens inverse évite de hacher les morceaux.',
      });

      await act(async () => {
        await result.current.sendChatMessage('Pourquoi le sens inverse ?');
      });

      expect(result.current.chatMessages).toHaveLength(2);
      expect(result.current.chatMessages[1].content).toBe(
        'Le sens inverse évite de hacher les morceaux.',
      );
      expect(result.current.chatMessages[1].proposal).toBeUndefined();
      expect(result.current.recipe).toEqual(CHAT_RECIPE);
    });

    it('envoie la recette et l\'historique à l\'agent', async () => {
      const { result } = await renderWithRecipe();

      mockAgentResponse({ action: 'answer', reply: 'Oui.' });
      await act(async () => {
        await result.current.sendChatMessage('Premier message');
      });

      mockAgentResponse({ action: 'answer', reply: 'Toujours oui.' });
      await act(async () => {
        await result.current.sendChatMessage('Second message');
      });

      const [url, options] = (global.fetch as jest.Mock).mock.calls.at(-1) as [
        string,
        RequestInit,
      ];

      expect(url).toBe('/api/gemini/chat');

      const body = JSON.parse(options.body as string);
      expect(body.message).toBe('Second message');
      expect(body.recipe.title).toBe('Soupe');
      expect(body.history).toEqual([
        { role: 'user', content: 'Premier message' },
        { role: 'assistant', content: 'Oui.' },
      ]);
    });

    it('met une proposition en attente sans modifier la recette', async () => {
      const { result } = await renderWithRecipe();

      mockAgentResponse({
        action: 'propose',
        reply: 'Je te propose de remplacer le beurre.',
        recipe: {
          title: 'Soupe',
          ingredients: ["50 g d'huile d'olive"],
          steps: ["Faire chauffer l'huile 2 min / 100°C / vitesse 1."],
        },
        changes: ['Beurre remplacé par de l\'huile d\'olive'],
      });

      await act(async () => {
        await result.current.sendChatMessage('Remplace le beurre');
      });

      const proposal = result.current.chatMessages[1].proposal;
      expect(proposal?.status).toBe('pending');
      expect(proposal?.changes).toHaveLength(1);
      expect(proposal?.recipe.ingredients[0].fullText).toBe("50 g d'huile d'olive");
      // Tant que l'utilisateur n'a pas validé, la recette courante est intacte
      expect(result.current.recipe).toEqual(CHAT_RECIPE);
    });

    it('applique une proposition validée par l\'utilisateur', async () => {
      const { result } = await renderWithRecipe();

      mockAgentResponse({
        action: 'propose',
        reply: 'Proposition',
        recipe: {
          title: 'Soupe à l\'huile',
          ingredients: ["50 g d'huile d'olive"],
          steps: ["Faire chauffer l'huile 2 min / 100°C / vitesse 1."],
        },
        changes: ['Beurre remplacé'],
      });

      await act(async () => {
        await result.current.sendChatMessage('Remplace le beurre');
      });

      const messageId = result.current.chatMessages[1].id;

      act(() => {
        result.current.applyProposal(messageId);
      });

      expect(result.current.recipe?.title).toBe('Soupe à l\'huile');
      expect(result.current.recipe?.ingredients[0].fullText).toBe(
        "50 g d'huile d'olive",
      );
      expect(result.current.chatMessages[1].proposal?.status).toBe('applied');
    });

    it('laisse la recette inchangée quand la proposition est refusée', async () => {
      const { result } = await renderWithRecipe();

      mockAgentResponse({
        action: 'propose',
        reply: 'Proposition',
        recipe: { title: 'Autre', ingredients: ['x'], steps: ['y'] },
        changes: [],
      });

      await act(async () => {
        await result.current.sendChatMessage('Change tout');
      });

      const messageId = result.current.chatMessages[1].id;

      act(() => {
        result.current.rejectProposal(messageId);
      });

      expect(result.current.recipe).toEqual(CHAT_RECIPE);
      expect(result.current.chatMessages[1].proposal?.status).toBe('rejected');
    });

    it('marque les autres propositions en attente comme obsolètes après application', async () => {
      const { result } = await renderWithRecipe();

      mockAgentResponse({
        action: 'propose',
        reply: 'Proposition 1',
        recipe: { title: 'V1', ingredients: ['a'], steps: ['b'] },
        changes: [],
      });
      await act(async () => {
        await result.current.sendChatMessage('Change A');
      });

      mockAgentResponse({
        action: 'propose',
        reply: 'Proposition 2',
        recipe: { title: 'V2', ingredients: ['c'], steps: ['d'] },
        changes: [],
      });
      await act(async () => {
        await result.current.sendChatMessage('Change B');
      });

      const firstId = result.current.chatMessages[1].id;

      act(() => {
        result.current.applyProposal(firstId);
      });

      expect(result.current.recipe?.title).toBe('V1');
      expect(result.current.chatMessages[1].proposal?.status).toBe('applied');
      expect(result.current.chatMessages[3].proposal?.status).toBe('stale');

      // Une proposition obsolète ne peut plus écraser la recette
      act(() => {
        result.current.applyProposal(result.current.chatMessages[3].id);
      });
      expect(result.current.recipe?.title).toBe('V1');
    });

    it('ne sauvegarde que s\'il y a des modifications appliquées', async () => {
      const { result } = await renderWithRecipe();

      act(() => {
        result.current.setRecipe({ ...CHAT_RECIPE, firestoreId: 'rec-1' });
      });

      // Rien n'a été appliqué : le bouton est masqué et l'appel est sans effet
      expect(result.current.hasUnsavedChanges).toBe(false);
      await act(async () => {
        await result.current.saveChatRecipe();
      });
      expect(global.fetch).not.toHaveBeenCalledWith(
        '/api/firestore/recipes/rec-1',
        expect.anything(),
      );

      mockAgentResponse({
        action: 'propose',
        reply: 'Proposition',
        recipe: { title: 'V2', ingredients: ['x'], steps: ['y'] },
        changes: [],
      });
      await act(async () => {
        await result.current.sendChatMessage('Change');
      });

      act(() => {
        result.current.applyProposal(result.current.chatMessages[1].id);
      });
      expect(result.current.hasUnsavedChanges).toBe(true);

      mockAgentResponse({ ok: true });
      await act(async () => {
        await result.current.saveChatRecipe();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/firestore/recipes/rec-1',
        expect.objectContaining({ method: 'PUT' }),
      );
      // Une fois persistée, la recette n'est plus « sale » : plus de re-sauvegarde
      expect(result.current.hasUnsavedChanges).toBe(false);

      const callsAfterSave = (global.fetch as jest.Mock).mock.calls.length;
      await act(async () => {
        await result.current.saveChatRecipe();
      });
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(callsAfterSave);
    });

    it('met à jour le titre dans la liste d\'accueil après sauvegarde', async () => {
      // La liste d'accueil est chargée au montage, puis on modifie la recette
      (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
        url === '/api/firestore/recipes'
          ? {
            ok: true,
            json: async () => [
              {
                id: 'rec-1',
                title: 'Soupe',
                description: 'Ancienne description',
                createdAt: '2026-08-31T15:07:43.853Z',
              },
            ],
          }
          : { ok: true, json: async () => [] },
      );

      const { result } = await renderCookingHook();

      expect(result.current.savedRecipes[0].title).toBe('Soupe');

      act(() => {
        result.current.setRecipe({ ...CHAT_RECIPE, firestoreId: 'rec-1' });
      });

      mockAgentResponse({
        action: 'propose',
        reply: 'Proposition',
        recipe: {
          title: 'Soupe à l\'huile',
          description: 'Nouvelle description',
          ingredients: ["50 g d'huile d'olive"],
          steps: ['Faire chauffer 2 min / 100°C / vitesse 1.'],
        },
        changes: ['Beurre remplacé'],
      });
      await act(async () => {
        await result.current.sendChatMessage('Remplace le beurre');
      });

      act(() => {
        result.current.applyProposal(result.current.chatMessages[1].id);
      });

      mockAgentResponse({ ok: true });
      await act(async () => {
        await result.current.saveChatRecipe();
      });

      // Retour à l'accueil : la liste doit refléter la recette modifiée
      const summary = result.current.savedRecipes.find(r => r.id === 'rec-1');
      expect(summary?.title).toBe('Soupe à l\'huile');
      expect(summary?.description).toBe('Nouvelle description');
      // Les autres champs du résumé ne sont pas écrasés
      expect(summary?.createdAt).toBe('2026-08-31T15:07:43.853Z');
    });

    it('affiche un message d\'erreur quand l\'agent échoue', async () => {
      const { result } = await renderWithRecipe();

      mockAgentResponse({ error: 'boom' }, false);

      await act(async () => {
        await result.current.sendChatMessage('Salut');
      });

      expect(result.current.chatMessages[1].isError).toBe(true);
      expect(result.current.recipe).toEqual(CHAT_RECIPE);
    });
  });

  describe('theme persistence (localStorage)', () => {
    it('persists the selected theme to localStorage', async () => {
      const { result } = await renderCookingHook();

      act(() => {
        result.current.setActiveThemeId('mario');
      });

      expect(localStorage.getItem('activeThemeId')).toBe('mario');
      expect(result.current.theme.id).toBe('mario');
    });

    it('restores the theme from localStorage on mount', async () => {
      localStorage.setItem('activeThemeId', 'mario');

      const { result } = await renderCookingHook();

      expect(result.current.activeThemeId).toBe('mario');
      expect(result.current.theme.id).toBe('mario');
    });

    it('ignores an unknown stored theme and falls back to default', async () => {
      localStorage.setItem('activeThemeId', 'does-not-exist');

      const { result } = await renderCookingHook();

      expect(result.current.activeThemeId).toBe('default');
    });
  });

  describe('dark mode persistence (localStorage)', () => {
    it('persists the dark mode preference', async () => {
      const { result } = await renderCookingHook();

      act(() => {
        result.current.setIsDarkMode(false);
      });

      expect(localStorage.getItem('isDarkMode')).toBe('false');
      expect(result.current.isDarkMode).toBe(false);
    });

    it('restores the dark mode preference on mount', async () => {
      localStorage.setItem('isDarkMode', 'false');

      const { result } = await renderCookingHook();

      expect(result.current.isDarkMode).toBe(false);
    });
  });
});
