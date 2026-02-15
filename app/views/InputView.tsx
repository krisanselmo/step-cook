"use client";

import React, { useState } from 'react';
import {
  Home as HomeIcon, ChevronRight, Search, Loader2, ArrowDownAZ, Calendar, X, Sun, Moon, Sparkles, ExternalLink, Check, Play, Pause, RotateCcw, RotateCw, Scale, Wheat, Zap, Camera, UploadCloud
} from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { ThemeDropdown } from '@/app/components/ui/ThemeDropdown';
import { UseCookingState, SortOption } from '@/app/hooks/useCookingState'; // Assuming UseCookingState is exported

interface InputViewProps {
  rawText: string;
  setRawText: (text: string) => void;
  handleProcess: () => void;
  mealieRecipes: UseCookingState['mealieRecipes'];
  isMealieLoading: UseCookingState['isMealieLoading'];
  mealieError: UseCookingState['mealieError'];
  searchTerm: UseCookingState['searchTerm'];
  setSearchTerm: UseCookingState['setSearchTerm'];
  sortOption: UseCookingState['sortOption'];
  setSortOption: (option: SortOption) => void;
  filteredRecipes: UseCookingState['filteredRecipes'];
  fetchMealieRecipes: UseCookingState['fetchMealieRecipes'];
  loadMealieRecipe: UseCookingState['loadMealieRecipe'];
  isDarkMode: UseCookingState['isDarkMode'];
  setIsDarkMode: UseCookingState['setIsDarkMode'];
  theme: UseCookingState['theme'];
  setActiveThemeId: UseCookingState['setActiveThemeId'];
  t: UseCookingState['t'];
}

export const InputView: React.FC<InputViewProps> = ({
  rawText,
  setRawText,
  handleProcess,
  mealieRecipes,
  isMealieLoading,
  mealieError,
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  filteredRecipes,
  fetchMealieRecipes,
  loadMealieRecipe,
  isDarkMode,
  setIsDarkMode,
  theme,
  setActiveThemeId,
  t,
}) => {
  const ThemeIcon = theme.icon;
  const [showMealieList, setShowMealieList] = useState(true); // State to control which section is shown on mobile

  return (
    <div className={`min-h-screen ${theme.properties.font} flex flex-col items-center justify-center p-4 transition-colors duration-300 ${t(theme.colors.rootBgDark, theme.colors.rootBgLight)}`}>
      <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
        <ThemeDropdown currentTheme={theme} setThemeId={setActiveThemeId} isDarkMode={isDarkMode} />

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-full transition-colors ${t('bg-gray-800 text-gray-400 hover:text-white', 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm')}`}
        >
          {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <div className="max-w-5xl w-full flex flex-col h-[90vh] gap-6">
        <div className="text-center shrink-0">
          <ThemeIcon className={`w-12 h-12 ${theme.colors.accent} mx-auto mb-2`} />
          <h1 className="text-3xl font-bold">{theme.title}</h1>
        </div>

        {/* Toggle buttons for mobile */}
        <div className="flex w-full md:hidden mb-4 justify-center">
          <div className={`inline-flex ${theme.properties.radius} overflow-hidden border ${t('border-gray-700', 'border-gray-200')}`}>
            <button
              onClick={() => setShowMealieList(true)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${showMealieList ? `${theme.colors.bgPrimary} text-white` : t('bg-gray-800 text-gray-300', 'bg-white text-gray-700 hover:bg-gray-50')}`}
            >
              Mealie
            </button>
            <button
              onClick={() => setShowMealieList(false)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${!showMealieList ? `${theme.colors.bgPrimary} text-white` : t('bg-gray-800 text-gray-300', 'bg-white text-gray-700 hover:bg-gray-50')}`}
            >
              Manuel
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Colonne Gauche: Liste Mealie */}
          <div className={`${showMealieList ? 'flex' : 'hidden'} md:flex flex-col ${theme.properties.radius} border shadow-xl overflow-hidden transition-colors ${t(theme.colors.cardBgDark, theme.colors.cardBgLight)}`}>

            <div className={`p-4 border-b flex flex-col gap-3 ${t('border-gray-800/50', 'border-gray-100')}`}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2"><Search size={16}/> Recettes ({filteredRecipes.length})</h2>
                <button onClick={fetchMealieRecipes} className={`text-xs ${theme.colors.accent} hover:underline`}>Actualiser</button>
              </div>

              <div className="flex gap-2">
                <div className={`flex-1 flex items-center px-3 py-2 ${theme.properties.radius} border ${t('bg-black/50 border-gray-700/50', 'bg-gray-50 border-gray-300')}`}>
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
                    className={`p-2 ${theme.properties.radius} border transition-colors ${sortOption === 'date' ? `${theme.colors.bgPrimary} ${theme.colors.borderAccent} text-white` : t('border-gray-700/50 hover:bg-gray-800/50', 'border-gray-300 hover:bg-gray-100')}`}
                    title="Trier par date"
                  >
                    <Calendar size={16} />
                  </button>
                  <button
                    onClick={() => setSortOption('alpha')}
                    className={`p-2 ${theme.properties.radius} border transition-colors ${sortOption === 'alpha' ? `${theme.colors.bgPrimary} ${theme.colors.borderAccent} text-white` : t('border-gray-700/50 hover:bg-gray-800/50', 'border-gray-300 hover:bg-gray-100')}`}
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
                      className={`w-full text-left p-3 ${theme.properties.radius} transition-all border flex items-center gap-3 ${t(`bg-gray-800/30 border-gray-700/50 hover:bg-gray-800 hover:${theme.colors.borderAccent}`, `bg-gray-50/50 border-gray-200 hover:bg-white hover:${theme.colors.borderAccent}`)}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t('bg-gray-700/50', 'bg-gray-200')}`}>
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
          <div className={`${!showMealieList ? 'flex' : 'hidden'} md:flex flex-col p-4 ${theme.properties.radius} border shadow-xl transition-colors ${t(theme.colors.cardBgDark, theme.colors.cardBgLight)}`}>
            <h2 className="font-bold mb-2 text-sm uppercase tracking-wider text-gray-500">Mode Manuel</h2>
            <textarea
              className={`flex-1 w-full p-4 ${theme.properties.radius} border outline-none resize-none font-mono text-xs leading-relaxed transition-colors mb-4 focus:${theme.colors.borderAccent} ${t('bg-black/50 text-white border-gray-800/50', 'bg-gray-50 text-gray-900 border-gray-200')}`}
              placeholder="Ou collez une recette ici..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <Button onClick={handleProcess} className="w-full" disabled={!rawText.trim()} theme={theme}>
              Cuisiner <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};