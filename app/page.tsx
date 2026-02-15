"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, RotateCw, ChefHat,
  Home as HomeIcon, ChevronRight, ChevronLeft, Scale,
  Wheat, Zap, Sun, Moon, Sparkles, X, Search, Loader2,
  ArrowDownAZ, Calendar, ExternalLink, Check
} from 'lucide-react';

// --- TYPES & INTERFACES ---

interface Ingredient {
  fullText: string;
  keywords: string[];
}

interface StepParams {
  time: string;
  temp: string;
  speed: string;
  seconds: number;
  reverse: boolean;
}

interface Recipe {
  title: string;
  ingredients: Ingredient[];
  steps: string[];
  slug?: string; // Ajout du slug pour le lien externe
}

interface ModalData {
  ingredient: string;
  suggestion: string;
  loading: boolean;
}

// Types pour Mealie
interface MealieRecipeSummary {
  id: string;
  slug: string;
  name: string;
  image?: string;
  description?: string;
  dateAdded?: string; // Pour le tri par date
}

interface MealieIngredient {
  note?: string;
  food?: { name: string };
  unit?: { name: string };
  quantity?: number;
  display?: string;
}

interface MealieInstruction {
  text: string;
}

interface MealieRecipeDetail {
  slug?: string;
  name: string;
  recipeIngredient: MealieIngredient[];
  recipeInstructions: MealieInstruction[];
}

type ViewState = 'input' | 'processing' | 'cooking';
type SortOption = 'date' | 'alpha';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  disabled?: boolean;
  title?: string;
}

// --- LOGIQUE DE PARSING ---

const parseIngredientLine = (line: string): Ingredient => {
  const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
  const stopWords = ['de', 'd\'', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'en', 'à', 'au', 'aux', 'et', 'ou', 'g', 'kg', 'mg', 'l', 'cl', 'ml'];

  const tokens = cleanLine.toLowerCase()
  .replace(/[0-9,.\(\)]+/g, ' ')
  .split(/[\s']+/)
  .filter(w => w.length > 2)
  .filter(w => !stopWords.includes(w));

  return { fullText: cleanLine, keywords: tokens };
};

const extractStepParams = (text: string): StepParams => {
  let time = "--:--";
  let temp = "---";
  let speed = "---";
  let seconds = 0;
  let reverse = false;

  if (!text) return { time, temp, speed, seconds, reverse };

  // 1. Temps
  const timeMatch = text.match(/(\d+)\s*(sec|min|mn|h)/i);
  if (timeMatch) {
    const val = parseInt(timeMatch[1], 10);
    const unit = timeMatch[2].toLowerCase();
    if (unit.startsWith('s')) { time = `00:${val.toString().padStart(2, '0')}`; seconds = val; }
    else if (unit.startsWith('m')) { time = `${val.toString().padStart(2, '0')}:00`; seconds = val * 60; }
    else if (unit.startsWith('h')) { time = `${val}:00:00`; seconds = val * 3600; }
  }

  // 2. Température
  const tempMatch = text.match(/(\d+)\s*°|varoma/i);
  if (tempMatch) {
    temp = tempMatch[0].toUpperCase().replace(/\s/g, '');
    if (!temp.includes('C') && !temp.includes('VAROMA')) temp += 'C';
  }

  // 3. Vitesse & Modes Spéciaux
  const lowerText = text.toLowerCase();
  if (lowerText.match(/pétrin|pétrir|épi/)) {
    speed = "EPI";
  } else if (lowerText.match(/turbo/)) {
    speed = "TURBO";
  } else {
    const speedMatch = text.match(/(vit|vitesse)\.?\s*(\d+(\.\d+)?(\-\d+)?)|mijotage/i);
    if (speedMatch) {
      speed = speedMatch[0].toLowerCase().includes('mijotage') ? "MIJOT" : speedMatch[2];
    }
  }

  if (lowerText.match(/sens inverse|inversé|inverse/) && speed !== "EPI") {
    reverse = true;
  }

  return { time, temp, speed, seconds, reverse };
};

const parseRecipe = (text: string, slug?: string): Recipe => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const title = lines[0] || "Recette";
  const ingredients: Ingredient[] = [];
  let steps: string[] = [];
  let currentSection = 'unknown';

  const ingredientKeywords = ['ingrédient', 'ingredients', 'il vous faut', 'liste'];
  const stepKeywords = ['préparation', 'étape', 'instruction', 'recette', 'instructions'];

  const addIngredient = (line: string) => ingredients.push(parseIngredientLine(line));

  if (lines.length < 5) {
    steps = lines;
  } else {
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      if (ingredientKeywords.some(k => lowerLine.includes(k)) && line.length < 30) { currentSection = 'ingredients'; continue; }
      if (stepKeywords.some(k => lowerLine.includes(k)) && line.length < 30) { currentSection = 'steps'; continue; }

      if (currentSection === 'ingredients') addIngredient(line);
      else if (currentSection === 'steps') {
        if (line.match(/^\d+\./) || steps.length === 0) steps.push(line);
        else steps[steps.length - 1] += " " + line;
      } else {
        if (line.startsWith('-') || line.startsWith('•')) addIngredient(line);
        else steps.push(line);
      }
    }
  }

  if (steps.length === 0) steps = ["Ajoutez vos instructions ici."];
  return { title, ingredients, steps, slug };
};

// --- UTILS MEALIE ---

const formatMealieToText = (mealieRecipe: MealieRecipeDetail): string => {
  let text = `${mealieRecipe.name}\n\n`;

  text += `Ingrédients:\n`;
  mealieRecipe.recipeIngredient.forEach(ing => {
    const line = ing.display || ing.note || `${ing.quantity || ''} ${ing.unit?.name || ''} ${ing.food?.name || ''}`;
    text += `- ${line}\n`;
  });

  text += `\nPréparation:\n`;
  mealieRecipe.recipeInstructions.forEach((inst, index) => {
    text += `${index + 1}. ${inst.text}\n`;
  });

  return text;
};

// --- COMPOSANT UI ---

const Button: React.FC<ButtonProps> = ({ children, onClick, className = "", variant = "primary", disabled, title }) => {
  const baseStyle = "px-4 py-3 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-green-600 text-white shadow-lg shadow-green-900/50 hover:bg-green-500",
    secondary: "bg-gray-800 text-gray-200 hover:bg-gray-700",
    outline: "border border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white",
    ghost: "bg-transparent text-gray-400 hover:text-gray-900"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`} title={title}>
      {children}
    </button>
  );
};

// --- COMPOSANT PRINCIPAL ---

export default function Home() {
  const [view, setView] = useState<ViewState>('input');
  const [rawText, setRawText] = useState<string>('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('12:00');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Mealie State
  const [mealieRecipes, setMealieRecipes] = useState<MealieRecipeSummary[]>([]);
  const [isMealieLoading, setIsMealieLoading] = useState<boolean>(false);
  const [mealieError, setMealieError] = useState<string | null>(null);

  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('date'); // 'date' ou 'alpha'

  // AI, Params & Ingredients State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState<ModalData>({ ingredient: '', suggestion: '', loading: false });
  const [stepParams, setStepParams] = useState<StepParams>({ time: '--:--', temp: '---', speed: '---', seconds: 0, reverse: false });
  const [stepIngredients, setStepIngredients] = useState<Ingredient[]>([]);

  // Nouveaux états pour l'interaction des ingrédients
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [isGeminiMode, setIsGeminiMode] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const t = (darkClass: string, lightClass: string) => isDarkMode ? darkClass : lightClass;

  // Calcul des recettes filtrées et triées
  const filteredRecipes = useMemo(() => {
    let result = [...mealieRecipes];

    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(lowerTerm) ||
        (r.description && r.description.toLowerCase().includes(lowerTerm))
      );
    }

    result.sort((a, b) => {
      if (sortOption === 'alpha') {
        return a.name.localeCompare(b.name);
      } else {
        return 0;
      }
    });

    return result;
  }, [mealieRecipes, searchTerm, sortOption]);

  useEffect(() => {
    const updateClock = () => setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    updateClock();
    const interval = setInterval(updateClock, 60000);

    fetchMealieRecipes();

    return () => clearInterval(interval);
  }, []);

  const fetchMealieRecipes = async () => {
    setIsMealieLoading(true);
    setMealieError(null);
    try {
      const res = await fetch('/api/mealie/recipes');
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setMealieRecipes(data);
    } catch (err) {
      setMealieError("Impossible de charger les recettes Mealie.");
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
        setCheckedIngredients(new Set()); // Réinitialiser les checkboxes
        setCurrentStep(-1);
        setView('cooking');
      }, 500);

    } catch (err) {
      console.error(err);
      setView('input');
      alert("Erreur lors du chargement : " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const openMealiePage = () => {
    if (recipe && recipe.slug) {
      const baseUrl = "https://mealie.christopheanselmo.org/g/home";
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

      const matchedIngredients = recipe.ingredients.filter(ing =>
        ing.keywords.length > 0 && ing.keywords.some(keyword => stepText.toLowerCase().includes(keyword))
      );
      setStepIngredients(matchedIngredients);
    } else {
      setStepParams({ time: '--:--', temp: '---', speed: '---', seconds: 0, reverse: false });
      setStepIngredients([]);
    }
  }, [currentStep, recipe]);

  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      timerRef.current = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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
      setCheckedIngredients(new Set()); // Réinitialiser les checkboxes
      setCurrentStep(-1);
      setView('cooking');
    }, 800);
  };

  const openGeminiModal = async (ingredientFullText: string) => {
    setModalOpen(true);
    setModalData({ ingredient: ingredientFullText, suggestion: '', loading: true });

    try {
      const response = await fetch('/api/substitute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient: ingredientFullText }),
      });
      const data = await response.json();
      setModalData({ ingredient: ingredientFullText, suggestion: data.suggestion, loading: false });
    } catch (error) {
      console.error(error);
      setModalData({ ingredient: ingredientFullText, suggestion: "Erreur IA.", loading: false });
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

  // --- Vues ---

  if (view === 'input') {
    return (
      <div className={`min-h-screen font-sans flex flex-col items-center justify-center p-4 transition-colors duration-300 ${t('bg-gray-950 text-gray-100', 'bg-gray-100 text-gray-900')}`}>
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition-colors ${t('bg-gray-800 text-gray-400 hover:text-white', 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm')}`}
          >
            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <div className="max-w-5xl w-full flex flex-col h-[90vh] gap-6">
          <div className="text-center shrink-0">
            <ChefHat className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <h1 className="text-3xl font-bold">Step Cook</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-6 flex-1 overflow-hidden">
            {/* Colonne Gauche: Liste Mealie */}
            <div className={`flex flex-col rounded-3xl border shadow-xl overflow-hidden ${t('bg-gray-900 border-gray-800', 'bg-white border-gray-200')}`}>

              <div className={`p-4 border-b flex flex-col gap-3 ${t('border-gray-800', 'border-gray-100')}`}>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2"><Search size={16}/> Recettes ({filteredRecipes.length})</h2>
                  <button onClick={fetchMealieRecipes} className="text-xs text-green-500 hover:underline">Actualiser</button>
                </div>

                <div className="flex gap-2">
                  <div className={`flex-1 flex items-center px-3 py-2 rounded-lg border ${t('bg-black border-gray-700', 'bg-gray-50 border-gray-300')}`}>
                    <Search size={14} className="opacity-50 mr-2" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      className="bg-transparent outline-none w-full text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')}><X size={14} className="opacity-50" /></button>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => setSortOption('date')}
                      className={`p-2 rounded-lg border transition-colors ${sortOption === 'date' ? 'bg-green-600 border-green-600 text-white' : t('border-gray-700 hover:bg-gray-800', 'border-gray-300 hover:bg-gray-100')}`}
                      title="Trier par date"
                    >
                      <Calendar size={16} />
                    </button>
                    <button
                      onClick={() => setSortOption('alpha')}
                      className={`p-2 rounded-lg border transition-colors ${sortOption === 'alpha' ? 'bg-green-600 border-green-600 text-white' : t('border-gray-700 hover:bg-gray-800', 'border-gray-300 hover:bg-gray-100')}`}
                      title="Trier par nom"
                    >
                      <ArrowDownAZ size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                {isMealieLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                    <Loader2 className="animate-spin" />
                    <span className="text-xs">Chargement...</span>
                  </div>
                ) : mealieError ? (
                  <div className="text-red-400 text-sm text-center p-4">{mealieError}</div>
                ) : filteredRecipes.length === 0 ? (
                  <div className="text-center p-8 text-gray-500 text-sm">Aucune recette trouvée.</div>
                ) : (
                  <div className="space-y-2">
                    {filteredRecipes.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => loadMealieRecipe(r.slug)}
                        className={`w-full text-left p-3 rounded-xl transition-all border flex items-center gap-3 ${t('bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-green-500', 'bg-gray-50 border-gray-200 hover:bg-white hover:border-green-500')}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t('bg-gray-700', 'bg-gray-200')}`}>
                          <span className="text-xs font-bold">{r.name.charAt(0)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{r.name}</p>
                          <p className={`text-xs truncate ${t('text-gray-400', 'text-gray-500')}`}>{r.description || "Pas de description"}</p>
                        </div>
                        <ChevronRight size={16} className="ml-auto opacity-50 shrink-0"/>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Droite: Zone de texte manuelle */}
            <div className={`flex flex-col p-4 rounded-3xl border shadow-xl ${t('bg-gray-900 border-gray-800', 'bg-white border-gray-200')}`}>
              <h2 className="font-bold mb-2 text-sm uppercase tracking-wider text-gray-500">Mode Manuel</h2>
              <textarea
                className={`flex-1 w-full p-4 rounded-xl border focus:border-green-600 outline-none resize-none font-mono text-xs leading-relaxed transition-colors mb-4 ${t('bg-black text-white border-gray-800', 'bg-gray-50 text-gray-900 border-gray-200')}`}
                placeholder="Ou collez une recette ici..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <Button onClick={handleProcess} className="w-full" disabled={!rawText.trim()}>
                Cuisiner <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // COOKING MODE
  if (view === 'processing') {
    return (
      <div className={`h-screen flex flex-col items-center justify-center text-green-500 transition-colors duration-300 ${t('bg-black', 'bg-gray-100')}`}>
        <RotateCcw className="animate-spin mb-4" size={32} />
        <p className={`text-sm tracking-widest uppercase ${t('text-gray-400', 'text-gray-500')}`}>Chargement Recette...</p>
      </div>
    );
  }

  const isOverview = currentStep === -1;
  const isFinished = recipe ? currentStep >= recipe.steps.length : false;
  const isTempActive = stepParams.temp !== '---';
  const isSpeedActive = stepParams.speed !== '---';
  const isEpi = stepParams.speed === 'EPI';
  const isTurbo = stepParams.speed === 'TURBO';

  if (!recipe) return null;

  return (
    <div className={`h-screen w-full font-sans flex flex-col overflow-hidden transition-colors duration-300 ${t('bg-black text-white', 'bg-gray-50 text-gray-900')}`}>
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 z-20 shrink-0">
        <button onClick={() => setView('input')} className={`transition-colors ${t('text-gray-500 hover:text-white', 'text-gray-400 hover:text-gray-900')}`}><HomeIcon size={20} /></button>
        <span className={`text-xs font-bold uppercase tracking-wider truncate px-4 ${t('text-gray-500', 'text-gray-500')}`}>{recipe.title}</span>
        <div className="flex items-center gap-3">
          {recipe.slug && (
            <button
              onClick={openMealiePage}
              className={`transition-colors ${t('text-gray-500 hover:text-white', 'text-gray-400 hover:text-gray-900')}`}
              title="Voir sur Mealie"
            >
              <ExternalLink size={16} />
            </button>
          )}
          {/* Toggles */}
          <button
            onClick={() => setIsGeminiMode(!isGeminiMode)}
            className={`transition-colors ${isGeminiMode ? 'text-purple-500' : t('text-gray-500 hover:text-white', 'text-gray-400 hover:text-gray-900')}`}
            title="Assistant IA Gemini"
          >
            <Sparkles size={16} />
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`transition-colors ${t('text-gray-500 hover:text-white', 'text-gray-400 hover:text-gray-900')}`}>
            {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <span className={`text-xs font-mono ${t('text-gray-500', 'text-gray-500')}`}>{currentTime}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {isOverview ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <h2 className="text-2xl font-bold text-green-500">Ingrédients</h2>
            <div className="space-y-3">
              {recipe.ingredients.map((ing, i) => {
                const isChecked = checkedIngredients.has(ing.fullText);
                return (
                  <button
                    key={i}
                    onClick={() => handleIngredientAction(ing.fullText)}
                    className={`flex w-full items-center gap-4 text-left p-3 rounded-xl transition-all ${
                      isChecked && !isGeminiMode
                        ? t('bg-gray-900/40 text-gray-500', 'bg-gray-100 text-gray-400 line-through')
                        : t('text-gray-300 hover:bg-gray-900', 'text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm')
                    }`}
                  >
                    {isGeminiMode ? (
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Sparkles size={16} className="text-purple-500" />
                      </div>
                    ) : (
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isChecked ? 'bg-green-500 border-green-500 text-white' : t('border-gray-600', 'border-gray-300')
                      }`}>
                        {isChecked && <Check size={14} strokeWidth={3} />}
                      </div>
                    )}
                    <span className={`text-lg leading-snug transition-all ${isChecked && !isGeminiMode ? 'line-through opacity-60' : ''}`}>
                      {ing.fullText}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="h-20"/>
          </div>
        ) : isFinished ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in zoom-in">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-green-500 ${t('bg-green-900/20', 'bg-green-100')}`}>
              <ChefHat size={48} />
            </div>
            <h2 className="text-4xl font-bold text-center">Recette<br/>Terminée !</h2>
            <Button onClick={() => setView('input')} variant="secondary" className="px-8">Autre Recette</Button>
          </div>
        ) : (
          <>
            {/* Dashboard (Top) */}
            <div className="shrink-0 flex justify-center items-center gap-4 py-6 px-4">
              {/* TIME */}
              <button onClick={() => timer > 0 && setIsTimerRunning(!isTimerRunning)} className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full border-[6px] flex flex-col items-center justify-center transition-all transform active:scale-95 ${stepParams.time !== '--:--' ? 'border-green-500 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : t('border-gray-800 text-gray-600', 'border-gray-200 text-gray-300')}`}>
                <span className={`text-2xl md:text-3xl font-mono font-bold ${isTimerRunning ? 'animate-pulse' : ''} ${stepParams.time !== '--:--' ? (t('text-white', 'text-gray-800')) : ''}`}>{stepParams.time !== '--:--' ? formatTime(timer) : '--:--'}</span>
                <span className="text-[10px] font-bold uppercase mt-1 flex items-center gap-1 opacity-70">{isTimerRunning ? <Pause size={10} fill="currentColor"/> : <Play size={10} fill="currentColor"/>} Temps</span>
              </button>
              {/* TEMP */}
              <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full border-[6px] flex flex-col items-center justify-center transition-colors duration-500 ${isTempActive ? 'border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : t('border-gray-800 text-gray-700', 'border-gray-200 text-gray-300')}`}>
                <span className={`text-xl md:text-2xl font-bold ${isTempActive ? (t('text-white', 'text-gray-800')) : ''}`}>{stepParams.temp}</span>
                <span className="text-[10px] font-bold uppercase mt-1 opacity-70">Temp</span>
              </div>
              {/* SPEED */}
              <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full border-[6px] flex flex-col items-center justify-center transition-colors duration-500 ${isSpeedActive ? 'border-blue-500 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : t('border-gray-800 text-gray-700', 'border-gray-200 text-gray-300')}`}>
                {isEpi ? <Wheat size={40} className={`${t('text-white', 'text-gray-800')} ${isTimerRunning ? 'animate-wiggle' : ''}`} /> : isTurbo ? <Zap size={40} className={`${t('text-white', 'text-gray-800')} ${isTimerRunning ? 'animate-ping' : ''}`} /> : <span className={`text-xl md:text-2xl font-bold ${isSpeedActive ? (t('text-white', 'text-gray-800')) : ''}`}>{stepParams.speed}</span>}
                <div className="flex items-center gap-1 mt-1">
                  {isSpeedActive && !isEpi && !isTurbo && (stepParams.reverse ? <RotateCcw size={12} className="animate-spin-slow-reverse text-orange-500" /> : <RotateCw size={12} className="animate-spin-slow text-blue-400" />)}
                  <span className="text-[10px] font-bold uppercase opacity-70">{isEpi ? 'Pétrin' : isTurbo ? 'Turbo' : 'Vit'}</span>
                </div>
              </div>
            </div>

            {/* Instruction Text */}
            <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col items-center text-center">
              <div className={`rounded-full px-4 py-1.5 mb-6 inline-flex items-center gap-2 border ${t('bg-gray-900/50 border-gray-800', 'bg-gray-100 border-gray-200')}`}>
                <span className="text-green-600 font-bold text-xs uppercase tracking-widest">Étape {currentStep + 1}</span>
              </div>
              <p className="text-2xl md:text-4xl font-medium leading-normal max-w-lg mx-auto transition-colors">{recipe.steps[currentStep]}</p>

              {/* Step Ingredients List */}
              {stepIngredients.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-8 opacity-90">
                  {stepIngredients.map((ing, i) => {
                    const isChecked = checkedIngredients.has(ing.fullText);
                    return (
                      <button
                        key={i}
                        onClick={() => handleIngredientAction(ing.fullText)}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 border transition-all hover:scale-105 active:scale-95 ${
                          isGeminiMode
                            ? t('bg-purple-900/20 border-purple-500/30 text-purple-300', 'bg-purple-50 border-purple-200 text-purple-700')
                            : isChecked
                              ? t('bg-green-900/20 border-green-500/30 text-green-400 opacity-60', 'bg-green-50 border-green-200 text-green-700 opacity-60 line-through')
                              : t('bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700', 'bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50')
                        }`}
                      >
                        {isGeminiMode ? (
                          <Sparkles size={14} className="text-purple-500"/>
                        ) : isChecked ? (
                          <Check size={14} className="text-green-500" strokeWidth={3}/>
                        ) : (
                          <Scale size={14} className="text-gray-400"/>
                        )}
                        <span className="text-sm font-medium">{ing.fullText}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="h-24"/>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="absolute bottom-16 left-0 right-0 px-6 flex items-center justify-between pointer-events-none">
          <button onClick={() => setCurrentStep(p => Math.max(-1, p - 1))} disabled={currentStep === -1} className={`w-16 h-16 rounded-full backdrop-blur-md border flex items-center justify-center shadow-xl transition-all active:scale-90 pointer-events-auto ${currentStep === -1 ? 'opacity-0' : 'opacity-100'} ${t('bg-gray-900/90 border-gray-700 text-white hover:bg-gray-800', 'bg-white/90 border-gray-200 text-gray-800 hover:bg-gray-50')}`}>
            <ChevronLeft size={32} />
          </button>
          <button onClick={() => setCurrentStep(p => Math.min(recipe.steps.length, p + 1))} disabled={isFinished} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 pointer-events-auto ${isOverview ? 'bg-green-600 text-white w-auto px-8 rounded-2xl' : 'bg-green-600 text-white'}`}>
            {isOverview ? <span className="font-bold text-lg">Démarrer</span> : <ChevronRight size={32} />}
          </button>
        </div>

        {/* Modal IA */}
        {modalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl relative ${t('bg-gray-900 border border-gray-700 text-white', 'bg-white border border-gray-200 text-gray-900')}`}>
              <button onClick={() => setModalOpen(false)} className={`absolute top-4 right-4 p-2 rounded-full ${t('hover:bg-gray-800', 'hover:bg-gray-100')}`}><X size={20} /></button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white"><Sparkles size={20} /></div>
                <div><h3 className="font-bold text-lg">Gemini</h3><p className={`text-xs ${t('text-gray-400', 'text-gray-500')}`}>Assistant Culinaire</p></div>
              </div>
              <div className="min-h-[120px] flex flex-col justify-center">
                {modalData.loading ? (
                  <div className="flex flex-col items-center gap-3 text-gray-400"><Sparkles className="animate-spin text-purple-500" size={24} /><span className="text-sm">Analyse de {modalData.ingredient}...</span></div>
                ) : (
                  <div className="space-y-4">
                    <div><p className={`text-xs uppercase font-bold tracking-wider mb-1 ${t('text-gray-500', 'text-gray-400')}`}>Ingrédient</p><p className="text-xl font-medium">{modalData.ingredient}</p></div>
                    <div className={`p-4 rounded-xl ${t('bg-gray-800/50', 'bg-gray-50')}`}><p className={`text-xs uppercase font-bold tracking-wider mb-2 ${t('text-purple-400', 'text-purple-600')}`}>Suggestion de remplacement</p><p className="text-sm leading-relaxed">{modalData.suggestion}</p></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
