'use client';

import React, {useState, useMemo} from 'react';
import {
  ChevronRight,
  Search,
  Loader2,
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
  CalendarArrowUp,
  X,
  Sun,
  Moon,
  Sparkles,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import {Button} from '@/app/components/ui/Button';
import {ThemeDropdown} from '@/app/components/ui/ThemeDropdown';
import {SortOption, useCookingState} from '@/app/hooks/useCookingState';
import {SavedRecipeSummary, MealieRecipeSummary, ThemePlugin} from '@/app/lib/types';

// --- Unified recipe list item ---
interface RecipeItem {
  id: string;
  name: string;
  description?: string;
  date?: string;
  source: 'mealie' | 'saved';
  slug?: string;
}

function toRecipeItems(
  mealie: MealieRecipeSummary[],
  saved: SavedRecipeSummary[],
): RecipeItem[] {
  const mealieItems: RecipeItem[] = mealie.map(r => ({
    id: `mealie-${r.id}`,
    name: r.name,
    description: r.description,
    date: r.dateAdded,
    source: 'mealie',
    slug: r.slug,
  }));
  const savedItems: RecipeItem[] = saved.map(r => ({
    id: `saved-${r.id}`,
    name: r.title,
    description: r.description,
    date: r.createdAt,
    source: 'saved',
  }));
  return [...mealieItems, ...savedItems];
}

function filterAndSort(
  items: RecipeItem[],
  searchTerm: string,
  sortOption: SortOption,
): RecipeItem[] {
  let result = items;

  if (searchTerm.trim()) {
    const lower = searchTerm.toLowerCase();
    result = result.filter(
      r =>
        r.name.toLowerCase().includes(lower) ||
        (r.description && r.description.toLowerCase().includes(lower)),
    );
  }

  if (sortOption.startsWith('alpha')) {
    const dir = sortOption === 'alpha-asc' ? 1 : -1;
    result = [...result].sort((a, b) => dir * a.name.localeCompare(b.name));
  } else {
    const dir = sortOption === 'date-desc' ? -1 : 1;
    result = [...result].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  }

  return result;
}

// --- Recipe card ---
interface RecipeCardProps {
  item: RecipeItem;
  onLoad: () => void;
  onDelete?: () => void;
  theme: ThemePlugin;
  t: (dark: string, light: string) => string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({item, onLoad, onDelete, theme, t}) => {
  const dateLabel = item.date
    ? new Date(item.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})
    : null;

  return (
    <div
      className={`w-full text-left p-3 ${theme.properties.radius} transition-all border flex items-center gap-3 ${t(`bg-gray-800/30 border-gray-700/50 hover:bg-gray-800 hover:${theme.colors.borderAccent}`, `bg-gray-50/50 border-gray-200 hover:bg-white hover:${theme.colors.borderAccent}`)}`}
    >
      <button onClick={onLoad} className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t('bg-gray-700/50', 'bg-gray-200')}`}
        >
          {item.source === 'saved' ? (
            <Sparkles size={16} className="text-purple-500"/>
          ) : (
            <span className="text-xs font-bold">{item.name.charAt(0)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{item.name}</p>
          <div className={`flex items-center gap-2 text-xs ${t('text-gray-400', 'text-gray-500')}`}>
            <span className="truncate">{item.description || (item.source === 'saved' ? 'Recette générée' : 'Pas de description')}</span>
            {dateLabel && (
              <>
                <span className="shrink-0">·</span>
                <span className="shrink-0">{dateLabel}</span>
              </>
            )}
          </div>
        </div>
      </button>
      {onDelete ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={`p-2 rounded-full shrink-0 transition-colors ${t('hover:bg-red-900/30 text-gray-500 hover:text-red-400', 'hover:bg-red-50 text-gray-400 hover:text-red-500')}`}
          title="Supprimer"
        >
          <Trash2 size={14}/>
        </button>
      ) : (
        <ChevronRight size={16} className="ml-auto opacity-50 shrink-0"/>
      )}
    </div>
  );
};

// --- Main InputView ---
interface InputViewProps {
  rawText: string;
  setRawText: (text: string) => void;
  handleProcess: () => void;
  mealieRecipes: ReturnType<typeof useCookingState>['mealieRecipes'];
  isMealieLoading: ReturnType<typeof useCookingState>['isMealieLoading'];
  mealieError: ReturnType<typeof useCookingState>['mealieError'];
  searchTerm: ReturnType<typeof useCookingState>['searchTerm'];
  setSearchTerm: ReturnType<typeof useCookingState>['setSearchTerm'];
  sortOption: ReturnType<typeof useCookingState>['sortOption'];
  setSortOption: (option: SortOption) => void;
  fetchMealieRecipes: ReturnType<typeof useCookingState>['fetchMealieRecipes'];
  loadMealieRecipe: ReturnType<typeof useCookingState>['loadMealieRecipe'];
  isDarkMode: ReturnType<typeof useCookingState>['isDarkMode'];
  setIsDarkMode: ReturnType<typeof useCookingState>['setIsDarkMode'];
  theme: ReturnType<typeof useCookingState>['theme'];
  setActiveThemeId: ReturnType<typeof useCookingState>['setActiveThemeId'];
  t: ReturnType<typeof useCookingState>['t'];
  handleGeminiGenerate: (prompt: string) => void;
  savedRecipes: SavedRecipeSummary[];
  isSavedLoading: boolean;
  savedError: string | null;
  fetchSavedRecipes: () => Promise<void>;
  loadSavedRecipe: (id: string) => Promise<void>;
  deleteSavedRecipe: (id: string) => Promise<void>;
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
  fetchMealieRecipes,
  loadMealieRecipe,
  isDarkMode,
  setIsDarkMode,
  theme,
  setActiveThemeId,
  t,
  handleGeminiGenerate,
  savedRecipes,
  isSavedLoading,
  savedError,
  fetchSavedRecipes,
  loadSavedRecipe,
  deleteSavedRecipe,
}) => {
  const ThemeIcon = theme.icon;
  const [activeTab, setActiveTab] = useState<'recipes' | 'manual' | 'ai'>('recipes');
  const [geminiText, setGeminiText] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'mealie' | 'saved'>('all');
  const [deleteTarget, setDeleteTarget] = useState<RecipeItem | null>(null);

  const isLoading = isMealieLoading || isSavedLoading;
  const error = mealieError || savedError;

  const allRecipes = useMemo(
    () => toRecipeItems(mealieRecipes, savedRecipes),
    [mealieRecipes, savedRecipes],
  );

  const displayedRecipes = useMemo(() => {
    const filtered = sourceFilter === 'all'
      ? allRecipes
      : allRecipes.filter(r => r.source === sourceFilter);
    return filterAndSort(filtered, searchTerm, sortOption);
  }, [allRecipes, searchTerm, sortOption, sourceFilter]);

  const handleRefresh = () => {
    fetchMealieRecipes();
    fetchSavedRecipes();
  };

  const handleRecipeLoad = (item: RecipeItem) => {
    if (item.source === 'mealie' && item.slug) {
      loadMealieRecipe(item.slug);
    } else if (item.source === 'saved') {
      const savedId = item.id.replace('saved-', '');
      loadSavedRecipe(savedId);
    }
  };

  const handleRecipeDelete = (item: RecipeItem) => {
    setDeleteTarget(item);
  };

  const confirmDelete = () => {
    if (deleteTarget?.source === 'saved') {
      const savedId = deleteTarget.id.replace('saved-', '');
      deleteSavedRecipe(savedId);
    }
    setDeleteTarget(null);
  };

  return (
    <div
      className={`min-h-screen ${theme.properties.font} flex flex-col items-center justify-center p-4 transition-colors duration-300 ${t(theme.colors.rootBgDark, theme.colors.rootBgLight)}`}
    >
      <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
        <ThemeDropdown
          currentTheme={theme}
          setThemeId={setActiveThemeId}
          isDarkMode={isDarkMode}
        />
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
          className={`p-2 rounded-full transition-colors ${t('bg-gray-800 text-gray-400 hover:text-white', 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm')}`}
        >
          {isDarkMode ? <Moon size={20}/> : <Sun size={20}/>}
        </button>
      </div>

      <div className="w-full flex flex-col h-[90vh] gap-6">
        <div className="text-center shrink-0">
          <ThemeIcon className={`w-12 h-12 ${theme.colors.accent} mx-auto mb-2`}/>
          <h1 className="text-3xl font-bold">{theme.title}</h1>
        </div>

        {/* Toggle buttons for mobile */}
        <div className="flex w-full md:hidden mb-4 justify-center">
          <div className={`inline-flex ${theme.properties.radius} overflow-hidden border ${t('border-gray-700', 'border-gray-200')}`}>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'recipes' ? `${theme.colors.bgPrimary} text-white` : t('bg-gray-800 text-gray-300', 'bg-white text-gray-700 hover:bg-gray-50')}`}
            >
              Recettes
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'manual' ? `${theme.colors.bgPrimary} text-white` : t('bg-gray-800 text-gray-300', 'bg-white text-gray-700 hover:bg-gray-50')}`}
            >
              <Pencil size={16}/>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'ai' ? `${theme.colors.bgPrimary} text-white` : t('bg-gray-800 text-gray-300', 'bg-white text-gray-700 hover:bg-gray-50')}`}
            >
              <Sparkles size={16}/>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 flex-1 overflow-hidden">
          {/* Colonne: Recettes (Mealie + Sauvegardées) */}
          <div
            className={`${activeTab === 'recipes' ? 'flex' : 'hidden'} md:flex flex-col ${theme.properties.radius} border shadow-xl overflow-hidden transition-colors ${t(theme.colors.cardBgDark, theme.colors.cardBgLight)}`}
          >
            <div className={`p-4 border-b flex flex-col gap-3 ${t('border-gray-800/50', 'border-gray-100')}`}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">
                  Recettes ({displayedRecipes.length})
                </h2>
                <button
                  onClick={handleRefresh}
                  className={`text-xs ${theme.colors.accent} hover:underline`}
                >
                  Actualiser
                </button>
              </div>

              <div className="flex gap-2">
                <div
                  className={`flex-1 flex items-center px-3 py-2 ${theme.properties.radius} border ${t('bg-black/50 border-gray-700/50', 'bg-gray-50 border-gray-300')}`}
                >
                  <Search size={14} className="opacity-50 mr-2"/>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="bg-transparent outline-none w-full text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')}>
                      <X size={14} className="opacity-50"/>
                    </button>
                  )}
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => setSortOption(
                      sortOption === 'date-desc' ? 'date-asc' : 'date-desc'
                    )}
                    className={`p-2 ${theme.properties.radius} border transition-colors ${sortOption.startsWith('date') ? `${theme.colors.bgPrimary} ${theme.colors.borderAccent} text-white` : t('border-gray-700/50 hover:bg-gray-800/50', 'border-gray-300 hover:bg-gray-100')}`}
                    title={sortOption === 'date-desc' ? 'Plus anciennes d\'abord' : 'Plus récentes d\'abord'}
                  >
                    {sortOption === 'date-asc' ? <CalendarArrowUp size={16}/> : <Calendar size={16}/>}
                  </button>
                  <button
                    onClick={() => setSortOption(
                      sortOption === 'alpha-asc' ? 'alpha-desc' : 'alpha-asc'
                    )}
                    className={`p-2 ${theme.properties.radius} border transition-colors ${sortOption.startsWith('alpha') ? `${theme.colors.bgPrimary} ${theme.colors.borderAccent} text-white` : t('border-gray-700/50 hover:bg-gray-800/50', 'border-gray-300 hover:bg-gray-100')}`}
                    title={sortOption === 'alpha-asc' ? 'Trier Z-A' : 'Trier A-Z'}
                  >
                    {sortOption === 'alpha-desc' ? <ArrowUpAZ size={16}/> : <ArrowDownAZ size={16}/>}
                  </button>
                </div>
              </div>

              {/* Source filter */}
              <div className="flex gap-1.5">
                {([
                  { key: 'all', label: 'Tout' },
                  { key: 'mealie', label: 'Mealie' },
                  { key: 'saved', label: 'IA' },
                ] as const).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setSourceFilter(f.key)}
                    className={`px-3 py-1 text-xs font-medium ${theme.properties.radius} border transition-colors ${
                      sourceFilter === f.key
                        ? `${theme.colors.bgPrimary} ${theme.colors.borderAccent} text-white`
                        : t('border-gray-700/50 hover:bg-gray-800/50 text-gray-400', 'border-gray-300 hover:bg-gray-100 text-gray-500')
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                  <Loader2 className="animate-spin"/>
                  <span className="text-xs">Chargement...</span>
                </div>
              ) : error ? (
                <div className="text-red-400 text-sm text-center p-4">
                  {error}
                </div>
              ) : displayedRecipes.length === 0 ? (
                <div className="text-center p-8 text-gray-500 text-sm">
                  Aucune recette trouvée.
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedRecipes.map(item => (
                    <RecipeCard
                      key={item.id}
                      item={item}
                      onLoad={() => handleRecipeLoad(item)}
                      onDelete={item.source === 'saved' ? () => handleRecipeDelete(item) : undefined}
                      theme={theme}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Colonne: Mode Manuel */}
          <div
            className={`${activeTab === 'manual' ? 'flex' : 'hidden'} md:flex flex-col p-4 ${theme.properties.radius} border shadow-xl transition-colors ${t(theme.colors.cardBgDark, theme.colors.cardBgLight)}`}
          >
            <h2 className="font-bold mb-2 text-sm uppercase tracking-wider text-gray-500">
              Mode Manuel
            </h2>
            <textarea
              className={`flex-1 w-full p-4 ${theme.properties.radius} border outline-none resize-none font-mono text-xs leading-relaxed transition-colors mb-4 focus:${theme.colors.borderAccent} ${t('bg-black/50 text-white border-gray-800/50', 'bg-gray-50 text-gray-900 border-gray-200')}`}
              placeholder="Ou collez une recette ici..."
              value={rawText}
              onChange={e => setRawText(e.target.value)}
            />
            <Button
              onClick={handleProcess}
              className="w-full"
              disabled={!rawText.trim()}
              theme={theme}
            >
              Cuisiner <ChevronRight size={18}/>
            </Button>
          </div>

          {/* Colonne: Assistant IA */}
          <div
            className={`${activeTab === 'ai' ? 'flex' : 'hidden'} md:flex flex-col p-4 ${theme.properties.radius} border shadow-xl transition-colors ${t(theme.colors.cardBgDark, theme.colors.cardBgLight)}`}
          >
            <h2 className="font-bold mb-2 text-sm uppercase tracking-wider text-gray-500">
              Assistant IA
            </h2>
            <textarea
              className={`flex-1 w-full p-4 ${theme.properties.radius} border outline-none resize-none font-mono text-xs leading-relaxed transition-colors mb-4 focus:${theme.colors.borderAccent} ${t('bg-black/50 text-white border-gray-800/50', 'bg-gray-50 text-gray-900 border-gray-200')}`}
              placeholder="Décrivez votre recette de rêve (ex: 'Recette végétarienne rapide, avec des lentilles et beaucoup de légumes')..."
              value={geminiText}
              onChange={e => setGeminiText(e.target.value)}
            />
            <Button
              onClick={() => handleGeminiGenerate(geminiText)}
              className="w-full"
              disabled={!geminiText.trim()}
              theme={theme}
            >
              Générer Recette <Sparkles size={18}/>
            </Button>
          </div>
        </div>
      </div>

      {/* Modale de confirmation de suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className={`w-full max-w-sm p-6 ${theme.properties.radius} shadow-2xl ${t('bg-gray-900 border border-gray-700 text-white', 'bg-white border border-gray-200 text-gray-900')}`}>
            <h3 className="font-bold text-lg mb-2">Supprimer la recette ?</h3>
            <p className={`text-sm mb-6 ${t('text-gray-400', 'text-gray-500')}`}>
              <span className="font-medium">{deleteTarget.name}</span> sera supprimée définitivement.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className={`px-4 py-2 text-sm font-medium ${theme.properties.radius} transition-colors ${t('hover:bg-gray-800 text-gray-300', 'hover:bg-gray-100 text-gray-600')}`}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className={`px-4 py-2 text-sm font-medium ${theme.properties.radius} bg-red-600 text-white hover:bg-red-700 transition-colors`}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
