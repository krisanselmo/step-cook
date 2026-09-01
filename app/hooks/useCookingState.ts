'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Ingredient,
  StepParams,
  Recipe,
  ChatMessage,
  MealieRecipeSummary,
  MealieRecipeDetail,
  SavedRecipeSummary,
  ThemePlugin,
} from '@/app/lib/types';
import { defaultTheme, THEMES } from '@/app/lib/themes';
import {
  parseRecipe,
  parseIngredientLine,
  EMPTY_STEP_PARAMS,
  normalizeSteps,
  isStructuredSchema,
  formatMealieToText,
  StepAccessory,
} from '@/app/lib/utils';
import {
  DEFAULT_EQUIPMENT_IDS,
  sanitizeEquipmentIds,
} from '@/app/lib/equipment';

export type ViewState = 'input' | 'processing' | 'cooking';
export type SortOption = 'date-desc' | 'date-asc' | 'alpha-asc' | 'alpha-desc';

// Anchors accept/reject to a message: an index would shift as the chat grows.
let messageIdCounter = 0;
const createMessageId = (): string => `msg-${++messageIdCounter}`;

interface UseCookingState {
  view: ViewState;
  setView: React.Dispatch<React.SetStateAction<ViewState>>;
  rawText: string;
  setRawText: React.Dispatch<React.SetStateAction<string>>;
  recipe: Recipe | null;
  setRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  timer: number;
  setTimer: React.Dispatch<React.SetStateAction<number>>;
  isTimerRunning: boolean;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  currentTime: string;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  activeThemeId: string;
  setActiveThemeId: React.Dispatch<React.SetStateAction<string>>;
  theme: ThemePlugin;
  mealieRecipes: MealieRecipeSummary[];
  isMealieLoading: boolean;
  mealieError: string | null;
  isMealieConfigured: boolean;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  sortOption: SortOption;
  setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;
  chatOpen: boolean;
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  sendChatMessage: (message: string) => Promise<void>;
  applyProposal: (messageId: string) => void;
  rejectProposal: (messageId: string) => void;
  saveChatRecipe: () => Promise<void>;
  hasUnsavedChanges: boolean;
  isSavingChatRecipe: boolean;
  cookedModalOpen: boolean;
  setCookedModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedImage: File | null;
  setSelectedImage: React.Dispatch<React.SetStateAction<File | null>>;
  previewUrl: string | null;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
  isUploading: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  uploadSuccess: boolean;
  setUploadSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  stepParams: StepParams;
  stepIngredients: Ingredient[];
  stepAccessories: StepAccessory[];
  ownedEquipment: string[];
  toggleEquipment: (id: string) => void;
  equipmentModalOpen: boolean;
  setEquipmentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  checkedIngredients: Set<string>;
  setCheckedIngredients: React.Dispatch<React.SetStateAction<Set<string>>>;
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  t: (darkClass: string, lightClass: string) => string;
  fetchMealieRecipes: () => Promise<void>;
  loadMealieRecipe: (slug: string) => Promise<void>;
  openMealiePage: () => void;
  formatTime: (seconds: number) => string;
  handleProcess: () => void;
  handleIngredientAction: (ingredientFullText: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => Promise<void>;
  generateGeminiRecipe: (userPrompt: string) => Promise<void>;
  savedRecipes: SavedRecipeSummary[];
  isSavedLoading: boolean;
  savedError: string | null;
  isFirestoreConfigured: boolean;
  isGeminiConfigured: boolean;
  fetchSavedRecipes: () => Promise<void>;
  loadSavedRecipe: (id: string) => Promise<void>;
  deleteSavedRecipe: (id: string) => Promise<void>;
}

export const useCookingState = (): UseCookingState => {
  const [view, setView] = useState<ViewState>('input');
  const [rawText, setRawText] = useState<string>('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('12:00');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [activeThemeId, setActiveThemeId] = useState<string>('default');
  const theme = useMemo(
    () => THEMES.find(t => t.id === activeThemeId) || defaultTheme,
    [activeThemeId],
  );

  // Read after mount, not at state init: server and client must both render
  // 'default' first or hydration mismatches.
  useEffect(() => {
    const stored = localStorage.getItem('activeThemeId');

    if (stored && THEMES.some(plugin => plugin.id === stored)) {
      setActiveThemeId(stored);
    }
  }, []);

  const themeHydrated = useRef(false);
  useEffect(() => {
    if (!themeHydrated.current) {
      themeHydrated.current = true;

      return;
    }
    localStorage.setItem('activeThemeId', activeThemeId);
  }, [activeThemeId]);

  useEffect(() => {
    const stored = localStorage.getItem('isDarkMode');

    if (stored !== null) {
      setIsDarkMode(stored === 'true');
    }
  }, []);

  const darkModeHydrated = useRef(false);
  useEffect(() => {
    if (!darkModeHydrated.current) {
      darkModeHydrated.current = true;

      return;
    }
    localStorage.setItem('isDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  // Device-local config, sent to the AI so it only proposes feasible steps.
  const [ownedEquipment, setOwnedEquipment] = useState<string[]>(
    DEFAULT_EQUIPMENT_IDS,
  );
  const [equipmentModalOpen, setEquipmentModalOpen] = useState<boolean>(false);
  // The `?prompt=` deep link waits for this, or it would generate with the
  // default equipment rather than the user's.
  const [isEquipmentReady, setIsEquipmentReady] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem('ownedEquipment');

    if (stored !== null) {
      try {
        setOwnedEquipment(sanitizeEquipmentIds(JSON.parse(stored)));
      } catch {
        // Corrupted value: keep the defaults.
        console.warn('[Équipement] configuration illisible, valeurs par défaut');
      }
    }

    setIsEquipmentReady(true);
  }, []);

  const equipmentHydrated = useRef(false);
  useEffect(() => {
    if (!equipmentHydrated.current) {
      equipmentHydrated.current = true;

      return;
    }
    localStorage.setItem('ownedEquipment', JSON.stringify(ownedEquipment));
  }, [ownedEquipment]);

  const toggleEquipment = useCallback((id: string) => {
    setOwnedEquipment(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  }, []);

  const [mealieRecipes, setMealieRecipes] = useState<MealieRecipeSummary[]>([]);
  const [isMealieLoading, setIsMealieLoading] = useState<boolean>(false);
  const [mealieError, setMealieError] = useState<string | null>(null);
  // Unconfigured Mealie is hidden rather than reported as broken.
  const [isMealieConfigured, setIsMealieConfigured] = useState<boolean>(true);
  const [isFirestoreConfigured, setIsFirestoreConfigured] = useState<boolean>(true);
  const [isGeminiConfigured, setIsGeminiConfigured] = useState<boolean>(true);

  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeSummary[]>([]);
  const [isSavedLoading, setIsSavedLoading] = useState<boolean>(false);
  const [savedError, setSavedError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');

  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  // Applied proposals not yet persisted to Firestore.
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSavingChatRecipe, setIsSavingChatRecipe] = useState<boolean>(false);

  const [cookedModalOpen, setCookedModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const [stepParams, setStepParams] = useState<StepParams>({
    time: '--:--',
    temp: '---',
    speed: '---',
    seconds: 0,
    reverse: false,
  });
  const [stepIngredients, setStepIngredients] = useState<Ingredient[]>([]);
  const [stepAccessories, setStepAccessories] = useState<StepAccessory[]>([]);

  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
    new Set(),
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (darkClass: string, lightClass: string) =>
    isDarkMode ? darkClass : lightClass;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchMealieRecipes = useCallback(async () => {
    setIsMealieLoading(true);
    setMealieError(null);

    try {
      const res = await fetch('/api/mealie/recipes');

      if (!res.ok) {
        const details = await res.json().catch(() => null);

        throw new Error(details?.details || details?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();

      // The proxy answers { configured: false } when unset; a list otherwise.
      if (!Array.isArray(data) && data?.configured === false) {
        setIsMealieConfigured(false);
        setMealieRecipes([]);

        return;
      }

      setIsMealieConfigured(true);
      setMealieRecipes(data);
    } catch (err) {
      // External outage, already surfaced on screen: not an app bug, so no
      // console.error (the dev overlay would raise it as an Issue).
      setMealieError('Impossible de charger les recettes Mealie.');
      console.warn('[Mealie] liste indisponible :', err);
    } finally {
      setIsMealieLoading(false);
    }
  }, []);

  // Gemini has no list to load; only its configuration is probed.
  const fetchGeminiConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/gemini/config');

      if (!res.ok) {
        throw new Error('Erreur configuration');
      }
      const data = await res.json();
      setIsGeminiConfigured(data?.configured !== false);
    } catch (err) {
      // Unreachable: keep the AI visible rather than hide it wrongly.
      console.warn('[Gemini] configuration injoignable :', err);
    }
  }, []);

  const fetchSavedRecipes = useCallback(async () => {
    setIsSavedLoading(true);
    setSavedError(null);

    try {
      const res = await fetch('/api/firestore/recipes');

      if (!res.ok) {
        const details = await res.json().catch(() => null);

        throw new Error(details?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();

      if (!Array.isArray(data) && data?.configured === false) {
        setIsFirestoreConfigured(false);
        setSavedRecipes([]);

        return;
      }

      setIsFirestoreConfigured(true);
      setSavedRecipes(data);
    } catch (err) {
      setSavedError('Impossible de charger les recettes sauvegardées.');
      console.warn('[Firestore] liste indisponible :', err);
    } finally {
      setIsSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    const updateClock = () =>
      setCurrentTime(
        new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    updateClock();
    const interval = setInterval(updateClock, 60000);
    fetchMealieRecipes();
    fetchSavedRecipes();
    fetchGeminiConfig();

    return () => clearInterval(interval);
  }, [fetchMealieRecipes, fetchSavedRecipes, fetchGeminiConfig]);

  const loadSavedRecipe = async (id: string) => {
    setView('processing');

    try {
      const res = await fetch(`/api/firestore/recipes/${id}`);

      if (!res.ok) {
        throw new Error('Erreur chargement recette');
      }

      const data = await res.json();
      const loadedRecipe: Recipe = {
        title: data.title,
        description: data.description,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        totalTime: data.totalTime,
        ingredients: data.ingredients || [],
        steps: normalizeSteps(data.steps, {
          structured: isStructuredSchema(data.schemaVersion),
          ingredients: data.ingredients || [],
        }),
        firestoreId: data.id,
        schemaVersion: data.schemaVersion,
      };

      setRecipe(loadedRecipe);
      setCheckedIngredients(new Set());
      setChatMessages([]);
      setHasUnsavedChanges(false);
      setCurrentStep(-1);
      setView('cooking');
    } catch (err) {
      console.error(err);
      setView('input');
      alert(
        'Erreur lors du chargement : ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const deleteSavedRecipe = async (id: string) => {
    try {
      const res = await fetch(`/api/firestore/recipes/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erreur suppression');
      }

      setSavedRecipes(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert(
        'Erreur lors de la suppression : ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const loadMealieRecipe = async (slug: string) => {
    setView('processing');

    try {
      const res = await fetch(`/api/mealie/detail?slug=${slug}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur chargement détail');
      }
      const detail: MealieRecipeDetail = await res.json();
      const formattedText = formatMealieToText(detail);
      setRawText(formattedText);

      const metadata = {
        description: detail.description,
        prepTime: detail.prepTime,
        cookTime: detail.cookTime,
        totalTime: detail.totalTime || detail.performTime,
      };

      setTimeout(() => {
        setRecipe(parseRecipe(formattedText, slug, detail.orgURL, metadata));
        setCheckedIngredients(new Set());
        setChatMessages([]);
        setHasUnsavedChanges(false);
        setCurrentStep(-1);
        setView('cooking');
      }, 500);
    } catch (err) {
      console.error(err);
      setView('input');
      alert(
        'Erreur lors du chargement : ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const openMealiePage = () => {
    if (recipe && recipe.slug) {
      const baseUrl = process.env.NEXT_PUBLIC_MEALIE_BASE_URL;

      window.open(`${baseUrl}/g/home/r/${recipe.slug}`, '_blank');
    }
  };

  useEffect(() => {
    if (recipe && currentStep >= 0 && currentStep < recipe.steps.length) {
      const step = recipe.steps[currentStep];
      // Resolved at parse time; nothing is re-read from the text here.
      const params = step.params ?? EMPTY_STEP_PARAMS;

      setStepParams(params);

      if (params.seconds > 0) {
        setTimer(params.seconds);
        setIsTimerRunning(false);
      } else {
        setTimer(0);
        setIsTimerRunning(false);
      }

      // Already resolved upstream; this only maps labels back to objects.
      const stepIngredientTexts = new Set(step.ingredients ?? []);

      setStepIngredients(
        recipe.ingredients.filter(ing => stepIngredientTexts.has(ing.fullText)),
      );
      setStepAccessories(step.accessories ?? []);
    } else {
      setStepParams(EMPTY_STEP_PARAMS);
      setStepIngredients([]);
      setStepAccessories([]);
    }
  }, [currentStep, recipe]);

  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      timerRef.current = setInterval(
        () => setTimer(t => (t > 0 ? t - 1 : 0)),
        1000,
      );
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, timer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleProcess = () => {
    setView('processing');
    setTimeout(() => {
      setRecipe(parseRecipe(rawText));
      setCheckedIngredients(new Set());
      setChatMessages([]);
      setHasUnsavedChanges(false);
      setCurrentStep(-1);
      setView('cooking');
    }, 800);
  };

  // A proposal is never applied on its own: it waits for applyProposal /
  // rejectProposal.
  const sendChatMessage = async (message: string) => {
    if (!recipe || isChatLoading) {return;}

    const history = chatMessages.map(({ role, content }) => ({ role, content }));

    setChatMessages(prev => [
      ...prev,
      { id: createMessageId(), role: 'user', content: message },
    ]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe, message, history, equipment: ownedEquipment }),
      });

      if (!res.ok) {
        throw new Error('Erreur assistant');
      }

      const data = await res.json();

      // Prepared up front so that "Appliquer" is a plain state swap.
      const proposedIngredients =
        data.action === 'propose' && Array.isArray(data.recipe?.ingredients)
          ? data.recipe.ingredients.map((ing: string) => parseIngredientLine(ing))
          : recipe.ingredients;

      const proposedRecipe =
        data.action === 'propose' && data.recipe
          ? {
            ...recipe,
            title: data.recipe.title ?? recipe.title,
            description: data.recipe.description,
            prepTime: data.recipe.prepTime,
            cookTime: data.recipe.cookTime,
            totalTime: data.recipe.totalTime,
            ingredients: proposedIngredients,
            steps: Array.isArray(data.recipe.steps)
              ? normalizeSteps(data.recipe.steps, {
                structured: true,
                ingredients: proposedIngredients,
              })
              : recipe.steps,
            schemaVersion: data.recipe.schemaVersion ?? recipe.schemaVersion,
          }
          : null;

      setChatMessages(prev => [
        ...prev,
        {
          id: createMessageId(),
          role: 'assistant',
          content: data.reply,
          ...(proposedRecipe
            ? {
              proposal: {
                recipe: proposedRecipe,
                changes: Array.isArray(data.changes) ? data.changes : [],
                status: 'pending' as const,
              },
            }
            : {}),
        },
      ]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: createMessageId(),
          role: 'assistant',
          content: "Erreur lors de l'échange avec l'assistant.",
          isError: true,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  /** Accepts a proposal: it becomes the current recipe. */
  const applyProposal = (messageId: string) => {
    const target = chatMessages.find(msg => msg.id === messageId);

    if (target?.proposal?.status !== 'pending') {return;}

    setRecipe(target.proposal.recipe);
    setCheckedIngredients(new Set());
    setHasUnsavedChanges(true);
    setChatMessages(prev =>
      prev.map(msg => {
        if (!msg.proposal || msg.proposal.status !== 'pending') {return msg;}

        // Pending proposals were computed against the recipe just replaced;
        // applying one afterwards would undo this acceptance.
        return {
          ...msg,
          proposal: {
            ...msg.proposal,
            status: msg.id === messageId ? 'applied' : 'stale',
          },
        };
      }),
    );
  };

  /** Rejects a proposal: the current recipe is untouched. */
  const rejectProposal = (messageId: string) => {
    setChatMessages(prev =>
      prev.map(msg =>
        msg.id === messageId && msg.proposal?.status === 'pending'
          ? { ...msg, proposal: { ...msg.proposal, status: 'rejected' } }
          : msg,
      ),
    );
  };

  const saveChatRecipe = async () => {
    if (!recipe?.firestoreId || !hasUnsavedChanges || isSavingChatRecipe) {return;}

    setIsSavingChatRecipe(true);

    try {
      const res = await fetch(`/api/firestore/recipes/${recipe.firestoreId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe }),
      });

      if (!res.ok) {
        throw new Error('Erreur sauvegarde');
      }

      setHasUnsavedChanges(false);

      // The home list lives in state and would keep the stale title otherwise.
      setSavedRecipes(prev =>
        prev.map(saved =>
          saved.id === recipe.firestoreId
            ? { ...saved, title: recipe.title, description: recipe.description }
            : saved,
        ),
      );
      setChatMessages(prev => [
        ...prev,
        { id: createMessageId(), role: 'assistant', content: 'Recette sauvegardée.' },
      ]);
    } catch (err) {
      console.error(err);
      alert(
        'Erreur lors de la sauvegarde : ' +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setIsSavingChatRecipe(false);
    }
  };

  const generateGeminiRecipe = useCallback(async (userPrompt: string) => {
    setView('processing');

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt, equipment: ownedEquipment }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur génération Gemini.');
      }

      // The route returns a validated structured recipe; nothing to parse.
      const { recipe: generated } = await res.json();
      const generatedIngredients = (generated.ingredients || []).map(
        (ing: string) => parseIngredientLine(ing),
      );
      const parsedRecipe: Recipe = {
        title: generated.title,
        description: generated.description,
        prepTime: generated.prepTime,
        cookTime: generated.cookTime,
        totalTime: generated.totalTime,
        ingredients: generatedIngredients,
        steps: normalizeSteps(generated.steps, {
          structured: true,
          ingredients: generatedIngredients,
        }),
        schemaVersion: generated.schemaVersion,
      };

      setRecipe(parsedRecipe);
      setCheckedIngredients(new Set());
      setChatMessages([]);
      setHasUnsavedChanges(false);
      setCurrentStep(-1);
      setView('cooking');

      fetch('/api/firestore/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe: parsedRecipe, userPrompt }),
      })
        .then(r => r.json())
        .then(saved => {
          setRecipe(prev => prev ? { ...prev, firestoreId: saved.id } : prev);
          fetchSavedRecipes();
        })
        .catch(err => console.error('Erreur sauvegarde Firestore:', err));
    } catch (err) {
      console.error(err);
      setView('input');
      alert(
        'Erreur lors de la génération de recette par Gemini : ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }, [fetchSavedRecipes, ownedEquipment]);

  // Deep link /?prompt=<text>. The URL is cleared at once so a refresh does not
  // re-trigger a token-consuming generation. Waits for the equipment config.
  useEffect(() => {
    if (!isEquipmentReady) {
      return;
    }

    const prompt = (
      new URLSearchParams(window.location.search).get('prompt') || ''
    ).trim();

    if (!prompt) {
      return;
    }
    window.history.replaceState(null, '', window.location.pathname);
    generateGeminiRecipe(prompt);
  }, [generateGeminiRecipe, isEquipmentReady]);

  const handleIngredientAction = (ingredientFullText: string) => {
    const newChecked = new Set(checkedIngredients);

    if (newChecked.has(ingredientFullText)) {
      newChecked.delete(ingredientFullText);
    } else {
      newChecked.add(ingredientFullText);
    }
    setCheckedIngredients(newChecked);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!recipe?.slug) {
      return;
    }

    setIsUploading(true);
    const formData = new FormData();

    if (selectedImage) {
      formData.append('image', selectedImage);
    }
    formData.append('slug', recipe.slug);

    try {
      // Always call the API; it handles a missing image on its own.
      const res = await fetch('/api/mealie/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || 'Erreur inconnue');
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setCookedModalOpen(false);
        setUploadSuccess(false);
        setSelectedImage(null);
        setPreviewUrl(null);
      }, 2000);
    } catch (error) {
      console.error('Erreur upload:', error);
      alert(
        "Erreur lors de l'envoi : " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setIsUploading(false);
    }
  };

  return {
    view,
    setView,
    rawText,
    setRawText,
    recipe,
    setRecipe,
    currentStep,
    setCurrentStep,
    timer,
    setTimer,
    isTimerRunning,
    setIsTimerRunning,
    currentTime,
    isDarkMode,
    setIsDarkMode,
    activeThemeId,
    setActiveThemeId,
    theme,
    mealieRecipes,
    isMealieLoading,
    mealieError,
    isMealieConfigured,
    searchTerm,
    setSearchTerm,
    sortOption,
    setSortOption,
    chatOpen,
    setChatOpen,
    chatMessages,
    isChatLoading,
    sendChatMessage,
    applyProposal,
    rejectProposal,
    saveChatRecipe,
    hasUnsavedChanges,
    isSavingChatRecipe,
    cookedModalOpen,
    setCookedModalOpen,
    selectedImage,
    setSelectedImage,
    previewUrl,
    setPreviewUrl,
    isUploading,
    setIsUploading,
    uploadSuccess,
    setUploadSuccess,
    stepParams,
    stepIngredients,
    stepAccessories,
    ownedEquipment,
    toggleEquipment,
    equipmentModalOpen,
    setEquipmentModalOpen,
    checkedIngredients,
    setCheckedIngredients,
    timerRef,
    fileInputRef,
    t,
    fetchMealieRecipes,
    loadMealieRecipe,
    openMealiePage,
    formatTime,
    handleProcess,
    handleIngredientAction,
    handleFileChange,
    handleUpload,
    generateGeminiRecipe,
    savedRecipes,
    isSavedLoading,
    savedError,
    isFirestoreConfigured,
    isGeminiConfigured,
    fetchSavedRecipes,
    loadSavedRecipe,
    deleteSavedRecipe,
  };
};
