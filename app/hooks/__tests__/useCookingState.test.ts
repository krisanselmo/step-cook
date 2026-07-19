import { renderHook, act } from '@testing-library/react';
import { useCookingState } from '../useCookingState';
import { Recipe } from '@/app/lib/types';

describe('useCookingState', () => {
  const MOCK_MEALIE_BASE_URL = 'http://test-mealie.com';
  const MOCK_RECIPE_SLUG = 'test-recipe-slug';
  const MOCK_RECIPE: Recipe = {
    title: 'Test Recipe',
    ingredients: [],
    steps: ['Step 1'],
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
