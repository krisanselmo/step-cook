'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Ingredient,
  StepParams,
  Recipe,
  ModalData,
  MealieRecipeSummary,
  MealieRecipeDetail,
  ThemePlugin,
} from '@/app/lib/types';
import { defaultTheme, THEMES } from '@/app/lib/themes';
import {
  parseRecipe,
  extractStepParams,
  formatMealieToText, isKeywordInText,
} from '@/app/lib/utils';

export type ViewState = 'input' | 'processing' | 'cooking';
export type SortOption = 'date' | 'alpha';

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
  modalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modalData: ModalData;
  setModalData: React.Dispatch<React.SetStateAction<ModalData>>;
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
  isGeminiMode: boolean;
  setIsGeminiMode: React.Dispatch<React.SetStateAction<boolean>>;
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  t: (darkClass: string, lightClass: string) => string;
  filteredRecipes: MealieRecipeSummary[];
  fetchMealieRecipes: () => Promise<void>;
  loadMealieRecipe: (slug: string) => Promise<void>;
  openMealiePage: () => void;
  formatTime: (seconds: number) => string;
  handleProcess: () => void;
  openGeminiModal: (ingredientFullText: string) => Promise<void>;
  handleIngredientAction: (ingredientFullText: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => Promise<void>;
  generateGeminiRecipe: (userPrompt: string) => Promise<void>;
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

  const [mealieRecipes, setMealieRecipes] = useState<MealieRecipeSummary[]>([]);
  const [isMealieLoading, setIsMealieLoading] = useState<boolean>(false);
  const [mealieError, setMealieError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('date');

  // Modals
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState<ModalData>({
    ingredient: '',
    suggestion: '',
    loading: false,
  });

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
  const [isGeminiMode, setIsGeminiMode] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (darkClass: string, lightClass: string) =>
    isDarkMode ? darkClass : lightClass;

  const filteredRecipes = useMemo(() => {
    let result = [...mealieRecipes];

    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        r =>
          r.name.toLowerCase().includes(lowerTerm) ||
          (r.description && r.description.toLowerCase().includes(lowerTerm)),
      );
    }
    result.sort((a, b) =>
      sortOption === 'alpha' ? a.name.localeCompare(b.name) : 0,
    );

    return result;
  }, [mealieRecipes, searchTerm, sortOption]);

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

      setTimeout(() => {
        setRecipe(parseRecipe(formattedText, slug));
        setCheckedIngredients(new Set());
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
      const baseUrl = 'https://mealie.christopheanselmo.org/g/home';
      window.open(`${baseUrl}/r/${recipe.slug}`, '_blank');
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

      console.log('recipe.ingredients', recipe.ingredients);

      const matchedIngredients = recipe.ingredients.filter(
        ing =>
          ing.keywords.length > 0 &&
          ing.keywords.some(keyword =>
            isKeywordInText(keyword, stepText),
          ),
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
      setCurrentStep(-1);
      setView('cooking');
    }, 800);
  };

  // --- Handlers IA ---
  const openGeminiModal = async (ingredientFullText: string) => {
    setModalOpen(true);
    setModalData({
      ingredient: ingredientFullText,
      suggestion: '',
      loading: true,
    });

    try {
      const response = await fetch('/api/substitute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient: ingredientFullText }),
      });
      const data = await response.json();
      setModalData({
        ingredient: ingredientFullText,
        suggestion: data.suggestion,
        loading: false,
      });
    } catch (error) {
      console.error(error);
      setModalData({
        ingredient: ingredientFullText,
        suggestion: 'Erreur IA.',
        loading: false,
      });
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
      setRawText(generatedText); // Set rawText for parsing
      setRecipe(parseRecipe(generatedText));
      setCheckedIngredients(new Set());
      setCurrentStep(-1);
      setView('cooking');
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
    if (isGeminiMode) {
      openGeminiModal(ingredientFullText);
    } else {
      const newChecked = new Set(checkedIngredients);

      if (newChecked.has(ingredientFullText)) {
        newChecked.delete(ingredientFullText);
      } else {
        newChecked.add(ingredientFullText);
      }
      setCheckedIngredients(newChecked);
    }
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
    modalOpen,
    setModalOpen,
    modalData,
    setModalData,
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
    isGeminiMode,
    setIsGeminiMode,
    timerRef,
    fileInputRef,
    t,
    filteredRecipes,
    fetchMealieRecipes,
    loadMealieRecipe,
    openMealiePage,
    formatTime,
    handleProcess,
    openGeminiModal,
    handleIngredientAction,
    handleFileChange,
    handleUpload,
    generateGeminiRecipe,
  };
};
