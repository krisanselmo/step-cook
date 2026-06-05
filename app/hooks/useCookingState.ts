'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
import { parseIngredientLine } from '@/app/lib/utils';
import { defaultTheme, THEMES } from '@/app/lib/themes';
import {
  parseRecipe,
  extractStepParams,
  formatMealieToText,
  isKeywordInText,
} from '@/app/lib/utils';

export type ViewState = 'input' | 'processing' | 'cooking';
export type SortOption = 'date-desc' | 'date-asc' | 'alpha-asc' | 'alpha-desc';

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
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  sortOption: SortOption;
  setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;
  chatOpen: boolean;
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  sendChatMessage: (message: string) => Promise<void>;
  saveChatRecipe: () => Promise<void>;
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

  // Plugin / Theme State
  const [activeThemeId, setActiveThemeId] = useState<string>('default');
  const theme = useMemo(
    () => THEMES.find(t => t.id === activeThemeId) || defaultTheme,
    [activeThemeId],
  );

  // Restaure le thème choisi depuis le localStorage après le montage.
  // (Lecture après montage plutôt qu'à l'init du state pour éviter un décalage
  // d'hydratation SSR : serveur et client rendent 'default' en premier.)
  useEffect(() => {
    const stored = localStorage.getItem('activeThemeId');

    if (stored && THEMES.some(plugin => plugin.id === stored)) {
      setActiveThemeId(stored);
    }
  }, []);

  // Persiste le thème à chaque changement, en sautant le tout premier rendu pour
  // ne pas écraser la valeur stockée avant de l'avoir restaurée ci-dessus.
  const themeHydrated = useRef(false);
  useEffect(() => {
    if (!themeHydrated.current) {
      themeHydrated.current = true;

      return;
    }
    localStorage.setItem('activeThemeId', activeThemeId);
  }, [activeThemeId]);

  // Restaure le mode sombre/clair depuis le localStorage après le montage
  // (même logique que le thème : lecture post-montage pour éviter le mismatch SSR).
  useEffect(() => {
    const stored = localStorage.getItem('isDarkMode');

    if (stored !== null) {
      setIsDarkMode(stored === 'true');
    }
  }, []);

  // Persiste le mode sombre/clair à chaque changement (en sautant le premier rendu).
  const darkModeHydrated = useRef(false);
  useEffect(() => {
    if (!darkModeHydrated.current) {
      darkModeHydrated.current = true;

      return;
    }
    localStorage.setItem('isDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  const [mealieRecipes, setMealieRecipes] = useState<MealieRecipeSummary[]>([]);
  const [isMealieLoading, setIsMealieLoading] = useState<boolean>(false);
  const [mealieError, setMealieError] = useState<string | null>(null);

  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeSummary[]>([]);
  const [isSavedLoading, setIsSavedLoading] = useState<boolean>(false);
  const [savedError, setSavedError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');

  // Chat IA
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Cooked Modal State
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

  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
    new Set(),
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (darkClass: string, lightClass: string) =>
    isDarkMode ? darkClass : lightClass;

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

    return () => clearInterval(interval);
  }, []);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchMealieRecipes = async () => {
    setIsMealieLoading(true);
    setMealieError(null);

    try {
      const res = await fetch('/api/mealie/recipes');

      if (!res.ok) {
        throw new Error('Erreur chargement');
      }
      const data = await res.json();
      setMealieRecipes(data);
    } catch (err) {
      setMealieError('Impossible de charger les recettes Mealie.');
      console.error(err);
    } finally {
      setIsMealieLoading(false);
    }
  };

  const fetchSavedRecipes = async () => {
    setIsSavedLoading(true);
    setSavedError(null);

    try {
      const res = await fetch('/api/firestore/recipes');

      if (!res.ok) {
        throw new Error('Erreur chargement');
      }
      const data = await res.json();
      setSavedRecipes(data);
    } catch (err) {
      setSavedError('Impossible de charger les recettes sauvegardées.');
      console.error(err);
    } finally {
      setIsSavedLoading(false);
    }
  };

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
        steps: data.steps || [],
        firestoreId: data.id,
      };

      setRecipe(loadedRecipe);
      setCheckedIngredients(new Set());
      setChatMessages([]);
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
      const stepText = recipe.steps[currentStep];
      const params = extractStepParams(stepText);

      setStepParams(params);

      if (params.seconds > 0) {
        setTimer(params.seconds);
        setIsTimerRunning(false);
      } else {
        setTimer(0);
        setIsTimerRunning(false);
      }

      const matchedIngredients = recipe.ingredients.filter(
        ing =>
          ing.keywords.length > 0 &&
          ing.keywords.some(keyword => isKeywordInText(keyword, stepText)),
      );

      setStepIngredients(matchedIngredients);
    } else {
      setStepParams({
        time: '--:--',
        temp: '---',
        speed: '---',
        seconds: 0,
        reverse: false,
      });
      setStepIngredients([]);
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
      setCurrentStep(-1);
      setView('cooking');
    }, 800);
  };

  // --- Chat IA ---
  const sendChatMessage = async (message: string) => {
    if (!recipe || isChatLoading) return;

    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/gemini/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe, message }),
      });

      if (!res.ok) {
        throw new Error('Erreur modification');
      }

      const data = await res.json();
      const editedRecipe = data.recipe;

      // Rebuild ingredients with keywords
      const updatedRecipe: Recipe = {
        ...recipe,
        title: editedRecipe.title,
        description: editedRecipe.description,
        prepTime: editedRecipe.prepTime,
        cookTime: editedRecipe.cookTime,
        totalTime: editedRecipe.totalTime,
        ingredients: Array.isArray(editedRecipe.ingredients)
          ? editedRecipe.ingredients.map((ing: string) => parseIngredientLine(ing))
          : recipe.ingredients,
        steps: editedRecipe.steps || recipe.steps,
      };

      setRecipe(updatedRecipe);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Recette modifiée.',
          changes: data.changes,
        },
      ]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Erreur lors de la modification.' },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const saveChatRecipe = async () => {
    if (!recipe?.firestoreId) return;

    try {
      const res = await fetch(`/api/firestore/recipes/${recipe.firestoreId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe }),
      });

      if (!res.ok) {
        throw new Error('Erreur sauvegarde');
      }

      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Recette sauvegardée.' },
      ]);
    } catch (err) {
      console.error(err);
      alert(
        'Erreur lors de la sauvegarde : ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const generateGeminiRecipe = async (userPrompt: string) => {
    setView('processing');

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur génération Gemini.');
      }

      const data = await res.json();
      const generatedText = data.generatedRecipeText;
      setRawText(generatedText);
      const parsedRecipe = parseRecipe(generatedText);
      setRecipe(parsedRecipe);
      setCheckedIngredients(new Set());
      setChatMessages([]);
      setCurrentStep(-1);
      setView('cooking');

      // Fire-and-forget save to Firestore
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
  };

  const handleIngredientAction = (ingredientFullText: string) => {
    const newChecked = new Set(checkedIngredients);

    if (newChecked.has(ingredientFullText)) {
      newChecked.delete(ingredientFullText);
    } else {
      newChecked.add(ingredientFullText);
    }
    setCheckedIngredients(newChecked);
  };

  // --- Handlers Upload Photo ---
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
      // On appelle toujours l'API, c'est elle qui gérera si l'image est absente (retour succès immédiat)
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
    searchTerm,
    setSearchTerm,
    sortOption,
    setSortOption,
    chatOpen,
    setChatOpen,
    chatMessages,
    isChatLoading,
    sendChatMessage,
    saveChatRecipe,
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
    fetchSavedRecipes,
    loadSavedRecipe,
    deleteSavedRecipe,
  };
};
