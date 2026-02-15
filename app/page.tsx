"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, RotateCcw, RotateCw, ChefHat,
  Home as HomeIcon, ChevronRight, ChevronLeft, Scale,
  Wheat, Zap, Sun, Moon, Sparkles, X
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
}

interface DemoRecipe {
  name: string;
  text: string;
}

interface ModalData {
  ingredient: string;
  suggestion: string;
  loading: boolean;
}

type ViewState = 'input' | 'processing' | 'cooking';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

// --- DONNÉES DE DÉMO ---

const DEMO_RECIPES: Record<string, DemoRecipe> = {
  veloute: {
    name: "Velouté",
    text: `Velouté de Potimarron\n\nIngrédients:\n- 500g de potimarron\n- 1 oignon\n- 2 pommes de terre\n- 500g d'eau\n- 1 cube de bouillon\n- 20g de crème fraîche\n\nPréparation:\n1. Mettre l'oignon coupé en deux dans le bol.\n2. Hacher 5 sec vitesse 5.\n3. Ajouter le potimarron et les pommes de terre en morceaux.\n4. Ajouter l'eau et le cube de bouillon.\n5. Cuire 20 min 100°C vitesse 1, sens inverse.\n6. À la fin de la cuisson, ajouter la crème fraîche.\n7. Mixer 1 min vitesse 10.`
  },
  pizza: {
    name: "Pâte Pizza",
    text: `Pâte à Pizza Italienne\n\nIngrédients:\n- 30g d'huile d'olive extra vierge\n- 220g d'eau tiède\n- 1 c.à.c de sucre\n- 20g de levure boulangère fraîche\n- 400g de farine de blé (type 00)\n- 1 c.à.c de sel\n\nPréparation:\n1. Mettre l'eau, le sucre et la levure dans le bol.\n2. Mélanger 20 sec vitesse 2.\n3. Ajouter la farine, l'huile et le sel.\n4. Activer le mode Pétrin pendant 2 min.\n5. Transvaser la pâte dans un saladier huilé et former une boule.\n6. Laisser pousser 1h à température ambiante.`
  },
  crepes: {
    name: "Crêpes",
    text: `Pâte à Crêpes Express\n\nIngrédients:\n- 250g de farine\n- 500g de lait\n- 2 oeufs\n- 1 c.à.s d'huile\n- 1 pincée de sel\n\nPréparation:\n1. Mettre tous les ingrédients dans le bol.\n2. Mode Turbo 2 sec (pour casser les grumeaux si besoin).\n3. Mixer 20 sec vitesse 6.\n4. Racler les parois du bol avec la spatule.\n5. Mixer 5 sec vitesse 6.\n6. Laisser reposer la pâte 30 min avant cuisson.`
  },
  risotto: {
    name: "Risotto",
    text: `Risotto Champignons\n\nIngrédients:\n- 300g de riz arborio\n- 250g de champignons\n- 40g de beurre\n- 50g de parmesan\n- 1 échalote\n- 10 cl de vin blanc\n- 700g d'eau\n\nPréparation:\n1. Mettre l'échalote dans le bol. Hacher 5 sec vitesse 5.\n2. Ajouter le beurre et les champignons. Rissoler 3 min 100°C vitesse 1.\n3. Ajouter le riz et le vin blanc. Cuire 2 min 100°C vitesse 1 sens inverse.\n4. Ajouter l'eau et le bouillon. Cuire 15 min 100°C vitesse 1 sens inverse.\n5. Ajouter le parmesan. Mélanger 1 min vitesse 2 sens inverse.`
  }
};

// --- COMPOSANT UI ---

const Button: React.FC<ButtonProps> = ({ children, onClick, className = "", variant = "primary", disabled }) => {
  const baseStyle = "px-4 py-3 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-green-600 text-white shadow-lg shadow-green-900/50 hover:bg-green-500",
    secondary: "bg-gray-800 text-gray-200 hover:bg-gray-700",
    ghost: "bg-transparent text-gray-400 hover:text-gray-900"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

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

  // 3. Vitesse & Modes Spéciaux (Pétrin, Turbo)
  const lowerText = text.toLowerCase();

  if (lowerText.match(/pétrin|pétrir|épi/)) {
    speed = "EPI";
  } else if (lowerText.match(/turbo/)) {
    speed = "TURBO";
  } else {
    // Sinon vitesse standard
    const speedMatch = text.match(/(vit|vitesse)\.?\s*(\d+(\.\d+)?(\-\d+)?)|mijotage/i);
    if (speedMatch) {
      speed = speedMatch[0].toLowerCase().includes('mijotage') ? "MIJOT" : speedMatch[2];
    }
  }

  // 4. Sens Inverse (Détection)
  if (lowerText.match(/sens inverse|inversé|inverse/) && speed !== "EPI") {
    reverse = true;
  }

  return { time, temp, speed, seconds, reverse };
};

const parseRecipe = (text: string): Recipe => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const title = lines[0] || "Recette";
  const ingredients: Ingredient[] = [];
  let steps: string[] = [];
  let currentSection = 'unknown';

  const ingredientKeywords = ['ingrédient', 'ingredients', 'il vous faut', 'liste'];
  const stepKeywords = ['préparation', 'étape', 'instruction', 'recette'];

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
  return { title, ingredients, steps };
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
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // State pour la modale Gemini/IA
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState<ModalData>({ ingredient: '', suggestion: '', loading: false });

  const [stepParams, setStepParams] = useState<StepParams>({ time: '--:--', temp: '---', speed: '---', seconds: 0, reverse: false });
  const [stepIngredients, setStepIngredients] = useState<Ingredient[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const t = (darkClass: string, lightClass: string) => isDarkMode ? darkClass : lightClass;

  useEffect(() => {
    const updateClock = () => setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

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
      setCurrentStep(-1);
      setView('cooking');
    }, 800);
  };

  const loadDemo = (key: string) => {
    setRawText(DEMO_RECIPES[key].text);
    setSelectedDemo(key);
  };

  // Gestion du clic sur ingrédient avec appel API Next.js
  const handleIngredientClick = async (ingredientFullText: string) => {
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
      setModalData({ ingredient: ingredientFullText, suggestion: "Erreur de connexion avec l'IA.", loading: false });
    }
  };

  // --- Vues ---

  if (view === 'input') {
    return (
      <div className={`min-h-screen font-sans flex flex-col items-center justify-center p-4 transition-colors duration-300 ${t('bg-gray-950 text-gray-100', 'bg-gray-100 text-gray-900')}`}>
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition-colors ${t('bg-gray-800 text-gray-400 hover:text-white', 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm')}`}
          >
            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <div className="max-w-xl w-full flex flex-col h-[90vh] md:h-auto gap-4">
          <div className="text-center shrink-0">
            <ChefHat className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <h1 className="text-3xl font-bold">ThermoMind</h1>
          </div>

          <div className={`flex-1 p-4 rounded-3xl border shadow-2xl flex flex-col gap-4 overflow-hidden transition-colors duration-300 ${t('bg-gray-900 border-gray-800', 'bg-white border-gray-200')}`}>
            <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-hide">
              {Object.keys(DEMO_RECIPES).map(key => (
                <button
                  key={key}
                  onClick={() => loadDemo(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                    selectedDemo === key
                      ? 'bg-green-600/20 text-green-600 border-green-600'
                      : t('bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500', 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-400')
                  }`}
                >
                  {DEMO_RECIPES[key].name}
                </button>
              ))}
            </div>

            <textarea
              className={`flex-1 w-full p-4 rounded-xl border focus:border-green-600 outline-none resize-none font-mono text-sm leading-relaxed transition-colors duration-300 ${t('bg-black text-white border-gray-800', 'bg-gray-50 text-gray-900 border-gray-200')}`}
              placeholder="Collez votre recette ici..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />

            <div className="shrink-0">
              <Button onClick={handleProcess} className="w-full" disabled={!rawText.trim()}>
                Cuisiner <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'processing') {
    return (
      <div className={`h-screen flex flex-col items-center justify-center text-green-500 transition-colors duration-300 ${t('bg-black', 'bg-gray-100')}`}>
        <RotateCcw className="animate-spin mb-4" size={32} />
        <p className={`text-sm tracking-widest uppercase ${t('text-gray-400', 'text-gray-500')}`}>Analyse...</p>
      </div>
    );
  }

  // COOKING MODE
  const isOverview = currentStep === -1;
  const isFinished = recipe ? currentStep >= recipe.steps.length : false;

  const isTempActive = stepParams.temp !== '---';
  const isSpeedActive = stepParams.speed !== '---';
  const isEpi = stepParams.speed === 'EPI';
  const isTurbo = stepParams.speed === 'TURBO';

  if (!recipe) return null;

  return (
    <div className={`h-screen w-full font-sans flex flex-col overflow-hidden transition-colors duration-300 ${t('bg-black text-white', 'bg-gray-50 text-gray-900')}`}>

      {/* 1. Header Ultra-Fin */}
      <div className="h-10 flex items-center justify-between px-4 z-20 shrink-0">
        <button onClick={() => setView('input')} className={`transition-colors ${t('text-gray-500 hover:text-white', 'text-gray-400 hover:text-gray-900')}`}><HomeIcon size={20} /></button>
        <span className={`text-xs font-bold uppercase tracking-wider truncate px-4 ${t('text-gray-500', 'text-gray-500')}`}>{recipe.title}</span>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`transition-colors ${t('text-gray-500 hover:text-white', 'text-gray-400 hover:text-gray-900')}`}
          >
            {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <span className={`text-xs font-mono ${t('text-gray-500', 'text-gray-500')}`}>{currentTime}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative overflow-hidden">

        {isOverview ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <h2 className="text-2xl font-bold text-green-500">Ingrédients</h2>
            <div className="space-y-3">
              {recipe.ingredients.map((ing, i) => (
                <button
                  key={i}
                  onClick={() => handleIngredientClick(ing.fullText)}
                  className={`flex w-full items-center gap-4 text-left p-2 rounded-lg transition-colors ${t('text-gray-300 hover:bg-gray-900', 'text-gray-700 hover:bg-white')}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"/>
                  <span className="text-lg leading-snug">{ing.fullText}</span>
                  <Sparkles size={14} className="ml-auto opacity-0 group-hover:opacity-50 text-green-500" />
                </button>
              ))}
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
            {/* 2. Zone des Cercles (Top - Vertical) */}
            <div className="shrink-0 flex justify-center items-center gap-4 py-6 px-4">
              {/* TIME */}
              <button
                onClick={() => timer > 0 && setIsTimerRunning(!isTimerRunning)}
                className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full border-[6px] flex flex-col items-center justify-center transition-all transform active:scale-95 ${stepParams.time !== '--:--' ? 'border-green-500 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : t('border-gray-800 text-gray-600', 'border-gray-200 text-gray-300')}`}
              >
                  <span className={`text-2xl md:text-3xl font-mono font-bold ${isTimerRunning ? 'animate-pulse' : ''} ${stepParams.time !== '--:--' ? (t('text-white', 'text-gray-800')) : ''}`}>
                    {stepParams.time !== '--:--' ? formatTime(timer) : '--:--'}
                  </span>
                <span className="text-[10px] font-bold uppercase mt-1 flex items-center gap-1 opacity-70">
                    {isTimerRunning ? <Pause size={10} fill="currentColor"/> : <Play size={10} fill="currentColor"/>}
                  Temps
                  </span>
              </button>

              {/* TEMP */}
              <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full border-[6px] flex flex-col items-center justify-center transition-colors duration-500 ${isTempActive ? 'border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : t('border-gray-800 text-gray-700', 'border-gray-200 text-gray-300')}`}>
                  <span className={`text-xl md:text-2xl font-bold ${isTempActive ? (t('text-white', 'text-gray-800')) : ''}`}>
                    {stepParams.temp}
                  </span>
                <span className="text-[10px] font-bold uppercase mt-1 opacity-70">Temp</span>
              </div>

              {/* SPEED */}
              <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full border-[6px] flex flex-col items-center justify-center transition-colors duration-500 ${isSpeedActive ? 'border-blue-500 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : t('border-gray-800 text-gray-700', 'border-gray-200 text-gray-300')}`}>
                {isEpi ? (
                  <Wheat size={40} className={`${t('text-white', 'text-gray-800')} ${isTimerRunning ? 'animate-wiggle' : ''}`} />
                ) : isTurbo ? (
                  <Zap size={40} className={`${t('text-white', 'text-gray-800')} ${isTimerRunning ? 'animate-ping' : ''}`} />
                ) : (
                  <span className={`text-xl md:text-2xl font-bold ${isSpeedActive ? (t('text-white', 'text-gray-800')) : ''}`}>
                      {stepParams.speed}
                    </span>
                )}

                <div className="flex items-center gap-1 mt-1">
                  {isSpeedActive && !isEpi && !isTurbo && (
                    stepParams.reverse
                      ? <RotateCcw size={12} className="animate-spin-slow-reverse text-orange-500" />
                      : <RotateCw size={12} className="animate-spin-slow text-blue-400" />
                  )}
                  <span className="text-[10px] font-bold uppercase opacity-70">
                        {isEpi ? 'Pétrin' : isTurbo ? 'Turbo' : 'Vit'}
                     </span>
                </div>
              </div>
            </div>

            {/* 3. Zone de Texte */}
            <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col items-center text-center">
              <div className={`rounded-full px-4 py-1.5 mb-6 inline-flex items-center gap-2 border ${t('bg-gray-900/50 border-gray-800', 'bg-gray-100 border-gray-200')}`}>
                <span className="text-green-600 font-bold text-xs uppercase tracking-widest">Étape {currentStep + 1}</span>
              </div>

              <p className="text-2xl md:text-4xl font-medium leading-normal max-w-lg mx-auto transition-colors">
                {recipe.steps[currentStep]}
              </p>

              {/* Rappel Ingrédients Contextuels Cliquables */}
              {stepIngredients.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-8 opacity-90">
                  {stepIngredients.map((ing, i) => (
                    <button
                      key={i}
                      onClick={() => handleIngredientClick(ing.fullText)}
                      className={`px-4 py-2 rounded-xl flex items-center gap-2 border transition-all hover:scale-105 active:scale-95 ${t('bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700', 'bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50')}`}
                    >
                      <Scale size={14} className="text-green-500"/>
                      <span className="text-sm font-medium">{ing.fullText}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="h-24"/>
            </div>
          </>
        )}

        {/* 4. Navigation */}
        <div className="absolute bottom-16 left-0 right-0 px-6 flex items-center justify-between pointer-events-none">
          <button
            onClick={() => setCurrentStep(p => Math.max(-1, p - 1))}
            disabled={currentStep === -1}
            className={`w-16 h-16 rounded-full backdrop-blur-md border flex items-center justify-center shadow-xl transition-all active:scale-90 pointer-events-auto ${currentStep === -1 ? 'opacity-0' : 'opacity-100'} ${t('bg-gray-900/90 border-gray-700 text-white hover:bg-gray-800', 'bg-white/90 border-gray-200 text-gray-800 hover:bg-gray-50')}`}
          >
            <ChevronLeft size={32} />
          </button>

          <button
            onClick={() => setCurrentStep(p => Math.min(recipe.steps.length, p + 1))}
            disabled={isFinished}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 pointer-events-auto ${isOverview ? 'bg-green-600 text-white w-auto px-8 rounded-2xl' : 'bg-green-600 text-white'}`}
          >
            {isOverview ? (
              <span className="font-bold text-lg">Démarrer</span>
            ) : (
              <ChevronRight size={32} />
            )}
          </button>
        </div>

        {/* --- MODALE IA GEMINI --- */}
        {modalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl relative ${t('bg-gray-900 border border-gray-700 text-white', 'bg-white border border-gray-200 text-gray-900')}`}>
              <button
                onClick={() => setModalOpen(false)}
                className={`absolute top-4 right-4 p-2 rounded-full ${t('hover:bg-gray-800', 'hover:bg-gray-100')}`}
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Gemini</h3>
                  <p className={`text-xs ${t('text-gray-400', 'text-gray-500')}`}>Assistant Culinaire</p>
                </div>
              </div>

              <div className="min-h-[120px] flex flex-col justify-center">
                {modalData.loading ? (
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Sparkles className="animate-spin text-purple-500" size={24} />
                    <span className="text-sm">Analyse de {modalData.ingredient}...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${t('text-gray-500', 'text-gray-400')}`}>Ingrédient</p>
                      <p className="text-xl font-medium">{modalData.ingredient}</p>
                    </div>
                    <div className={`p-4 rounded-xl ${t('bg-gray-800/50', 'bg-gray-50')}`}>
                      <p className={`text-xs uppercase font-bold tracking-wider mb-2 ${t('text-purple-400', 'text-purple-600')}`}>Suggestion de remplacement</p>
                      <p className="text-sm leading-relaxed">{modalData.suggestion}</p>
                    </div>
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
