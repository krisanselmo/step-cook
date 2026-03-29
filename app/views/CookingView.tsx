'use client';

import Image from 'next/image';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Home as HomeIcon,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Wheat,
  Zap,
  Sun,
  Moon,
  Sparkles,
  X,
  Loader2,
  ExternalLink,
  Check,
  Camera,
  UploadCloud,
  Globe,
  Clock,
  Flame,
  Timer,
  ListOrdered,
  Send,
  Save,
} from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { ThemeDropdown } from '@/app/components/ui/ThemeDropdown';
import { useCookingState } from '@/app/hooks/useCookingState';

interface CookingViewProps {
  view: ReturnType<typeof useCookingState>['view'];
  setView: ReturnType<typeof useCookingState>['setView'];
  recipe: ReturnType<typeof useCookingState>['recipe'];
  currentStep: ReturnType<typeof useCookingState>['currentStep'];
  setCurrentStep: ReturnType<typeof useCookingState>['setCurrentStep'];
  timer: ReturnType<typeof useCookingState>['timer'];
  setTimer: ReturnType<typeof useCookingState>['setTimer'];
  isTimerRunning: ReturnType<typeof useCookingState>['isTimerRunning'];
  setIsTimerRunning: ReturnType<typeof useCookingState>['setIsTimerRunning'];
  currentTime: ReturnType<typeof useCookingState>['currentTime'];
  isDarkMode: ReturnType<typeof useCookingState>['isDarkMode'];
  setIsDarkMode: ReturnType<typeof useCookingState>['setIsDarkMode'];
  theme: ReturnType<typeof useCookingState>['theme'];
  setActiveThemeId: ReturnType<typeof useCookingState>['setActiveThemeId'];
  chatOpen: ReturnType<typeof useCookingState>['chatOpen'];
  setChatOpen: ReturnType<typeof useCookingState>['setChatOpen'];
  chatMessages: ReturnType<typeof useCookingState>['chatMessages'];
  isChatLoading: ReturnType<typeof useCookingState>['isChatLoading'];
  sendChatMessage: ReturnType<typeof useCookingState>['sendChatMessage'];
  saveChatRecipe: ReturnType<typeof useCookingState>['saveChatRecipe'];
  cookedModalOpen: ReturnType<typeof useCookingState>['cookedModalOpen'];
  setCookedModalOpen: ReturnType<typeof useCookingState>['setCookedModalOpen'];
  selectedImage: ReturnType<typeof useCookingState>['selectedImage'];
  setSelectedImage: ReturnType<typeof useCookingState>['setSelectedImage'];
  previewUrl: ReturnType<typeof useCookingState>['previewUrl'];
  setPreviewUrl: ReturnType<typeof useCookingState>['setPreviewUrl'];
  isUploading: ReturnType<typeof useCookingState>['isUploading'];
  setIsUploading: ReturnType<typeof useCookingState>['setIsUploading'];
  uploadSuccess: ReturnType<typeof useCookingState>['uploadSuccess'];
  setUploadSuccess: ReturnType<typeof useCookingState>['setUploadSuccess'];
  stepParams: ReturnType<typeof useCookingState>['stepParams'];
  stepIngredients: ReturnType<typeof useCookingState>['stepIngredients'];
  checkedIngredients: ReturnType<typeof useCookingState>['checkedIngredients'];
  setCheckedIngredients: ReturnType<
    typeof useCookingState
  >['setCheckedIngredients'];
  fileInputRef: ReturnType<typeof useCookingState>['fileInputRef'];
  t: ReturnType<typeof useCookingState>['t'];
  openMealiePage: ReturnType<typeof useCookingState>['openMealiePage'];
  formatTime: ReturnType<typeof useCookingState>['formatTime'];
  handleIngredientAction: ReturnType<
    typeof useCookingState
  >['handleIngredientAction'];
  handleFileChange: ReturnType<typeof useCookingState>['handleFileChange'];
  handleUpload: ReturnType<typeof useCookingState>['handleUpload'];
}

export const CookingView: React.FC<CookingViewProps> = ({
  setView,
  recipe,
  currentStep,
  setCurrentStep,
  timer,
  isTimerRunning,
  setIsTimerRunning,
  currentTime,
  isDarkMode,
  setIsDarkMode,
  theme,
  setActiveThemeId,
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
  uploadSuccess,
  stepParams,
  stepIngredients,
  checkedIngredients,
  fileInputRef,
  t,
  openMealiePage,
  formatTime,
  handleIngredientAction,
  handleFileChange,
  handleUpload,
}) => {
  if (!recipe) {
    return null;
  }

  const isOverview = currentStep === -1;
  const isFinished = currentStep >= recipe.steps.length;
  const isTempActive = stepParams.temp !== '---';
  const isSpeedActive = stepParams.speed !== '---';
  const isEpi = stepParams.speed === 'EPI';
  const isTurbo = stepParams.speed === 'TURBO';

  const ThemeIcon = theme.icon;

  return (
    <div
      className={`h-screen w-full ${theme.properties.font} flex flex-col overflow-hidden transition-colors duration-300 ${t(theme.colors.rootBgDark, theme.colors.rootBgLight)}`}
    >
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 z-20 shrink-0">
        <button
          onClick={() => setView('input')}
          className={`transition-colors ${t('text-gray-500 hover:text-white', 'text-gray-400 hover:text-gray-900')}`}
        >
          <HomeIcon size={20} />
        </button>
        <span
          className={`text-xs font-bold uppercase tracking-wider truncate px-4 ${t('text-gray-500', 'text-gray-500')}`}
        >
          {recipe.title}
        </span>
        <div className="flex items-center gap-3">
          <ThemeDropdown
            currentTheme={theme}
            setThemeId={setActiveThemeId}
            isDarkMode={isDarkMode}
          />
          {recipe.slug && (
            <button
              onClick={openMealiePage}
              className={`transition-colors ${t('text-gray-500 hover:text-white', 'text-gray-400 hover:text-gray-900')}`}
              title="Voir sur Mealie"
            >
              <ExternalLink size={16} />
            </button>
          )}
          {recipe.orgURL && (
            <a
              href={recipe.orgURL}
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors ${t('text-gray-500 hover:text-white', 'text-gray-400 hover:text-gray-900')}`}
              title="Voir la recette originale"
            >
              <Globe size={16} />
            </a>
          )}
          <button
            onClick={() => setChatOpen(true)}
            className={`transition-colors ${chatOpen ? 'text-purple-500' : t('text-gray-500 hover:text-white', 'text-gray-400 hover:text-gray-900')}`}
            title="Assistant IA"
          >
            <Sparkles size={16} />
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label={
              isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'
            }
            className={`transition-colors ${t('text-gray-500 hover:text-white', 'text-gray-400 hover:text-gray-900')}`}
          >
            {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <span
            className={`text-xs font-mono ${t('text-gray-500', 'text-gray-500')}`}
          >
            {currentTime}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {isOverview ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* KPIs: Temps de prépa, cuisson, total */}
            {(recipe.prepTime || recipe.cookTime || recipe.totalTime) && (
              <div className="flex gap-3 flex-wrap">
                {recipe.prepTime && (
                  <div className={`flex items-center gap-2 px-3 py-2 ${theme.properties.radius} border ${t('bg-gray-800/50 border-gray-700/50', 'bg-gray-50 border-gray-200')}`}>
                    <Clock size={16} className={theme.colors.accent} />
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${t('text-gray-500', 'text-gray-400')}`}>Prépa</p>
                      <p className="text-sm font-medium">{recipe.prepTime}</p>
                    </div>
                  </div>
                )}
                {recipe.cookTime && (
                  <div className={`flex items-center gap-2 px-3 py-2 ${theme.properties.radius} border ${t('bg-gray-800/50 border-gray-700/50', 'bg-gray-50 border-gray-200')}`}>
                    <Flame size={16} className="text-red-500" />
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${t('text-gray-500', 'text-gray-400')}`}>Cuisson</p>
                      <p className="text-sm font-medium">{recipe.cookTime}</p>
                    </div>
                  </div>
                )}
                {recipe.totalTime && (
                  <div className={`flex items-center gap-2 px-3 py-2 ${theme.properties.radius} border ${t('bg-gray-800/50 border-gray-700/50', 'bg-gray-50 border-gray-200')}`}>
                    <Timer size={16} className="text-blue-500" />
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${t('text-gray-500', 'text-gray-400')}`}>Total</p>
                      <p className="text-sm font-medium">{recipe.totalTime}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {recipe.description && (
              <p className={`text-sm leading-relaxed ${t('text-gray-400', 'text-gray-500')}`}>
                {recipe.description}
              </p>
            )}

            <h2 className={`text-2xl font-bold ${theme.colors.accent}`}>
              Ingrédients
            </h2>
            <div className="space-y-3">
              {recipe.ingredients.map((ing, i) => {
                const isChecked = checkedIngredients.has(ing.fullText);

                return (
                  <button
                    key={i}
                    onClick={() => handleIngredientAction(ing.fullText)}
                    className={`flex w-full items-center gap-4 text-left p-3 ${theme.properties.radius} transition-all ${
                      isChecked
                        ? t(
                            theme.colors.checkedBgDark,
                            theme.colors.checkedBgLight,
                          ) + ' line-through'
                        : t(
                            'text-gray-300 hover:bg-gray-900/50',
                            'text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm',
                          )
                    }`}
                  >
                    <div
                      className={`w-6 h-6 border-2 flex items-center justify-center shrink-0 transition-colors ${theme.properties.radius} ${
                        isChecked
                          ? `${theme.colors.bgPrimary} ${theme.colors.borderAccent} text-white`
                          : t('border-gray-600', 'border-gray-300')
                      }`}
                    >
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span
                      className={`text-lg leading-snug transition-all ${isChecked ? 'line-through opacity-60' : ''}`}
                    >
                      {ing.fullText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Étapes (collapsed) */}
            {recipe.steps.length > 0 && (
              <details className={`${theme.properties.radius} border overflow-hidden ${t('border-gray-700/50', 'border-gray-200')}`}>
                <summary className={`flex items-center gap-2 cursor-pointer p-3 select-none ${t('hover:bg-gray-800/50', 'hover:bg-gray-50')} [&>svg.chevron]:open:rotate-180`}>
                  <ListOrdered size={18} className={theme.colors.accent} />
                  <span className="font-bold flex-1">Étapes ({recipe.steps.length})</span>
                  <ChevronDown size={16} className={`chevron transition-transform ${t('text-gray-500', 'text-gray-400')}`} />
                </summary>
                <div className={`p-3 space-y-2 border-t ${t('border-gray-700/50', 'border-gray-200')}`}>
                  {recipe.steps.map((step, i) => (
                    <div
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`flex items-start gap-3 p-2 ${theme.properties.radius} cursor-pointer transition-colors ${t('hover:bg-gray-800/50', 'hover:bg-gray-50')}`}
                    >
                      <span className={`text-xs font-bold shrink-0 w-6 h-6 -mt-0.5 rounded-full flex items-center justify-center ${t('bg-gray-800 text-gray-400', 'bg-gray-100 text-gray-500')}`}>
                        {i + 1}
                      </span>
                      <p className={`text-sm leading-relaxed ${t('text-gray-300', 'text-gray-600')}`}>{step}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="h-20" />
          </div>
        ) : isFinished ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-in zoom-in">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center ${theme.colors.accent} ${t('bg-gray-800/50', 'bg-gray-200')}`}
            >
              <ThemeIcon size={48} />
            </div>
            <h2 className="text-4xl font-bold text-center">
              Recette
              <br />
              Terminée&apos; !
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Button
                onClick={() => setView('input')}
                variant="secondary"
                className="px-8"
                theme={theme}
              >
                Autre Recette
              </Button>
              {recipe.slug && (
                <Button
                  onClick={() => setCookedModalOpen(true)}
                  className="px-8"
                  theme={theme}
                >
                  Je l'ai cuisiné ! <Camera size={18} />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Dashboard (Top) */}
            <div className="shrink-0 flex justify-center items-center gap-4 py-6 px-4">
              {/* TIME */}
              <button
                onClick={() => timer > 0 && setIsTimerRunning(!isTimerRunning)}
                className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full border-[6px] flex flex-col items-center justify-center transition-all transform active:scale-95 ${stepParams.time !== '--:--' ? `${theme.colors.borderAccent} ${theme.colors.accent} ${theme.colors.shadowAccent}` : t('border-gray-800 text-gray-600', 'border-gray-200 text-gray-300')}`}
              >
                <span
                  className={`text-2xl md:text-3xl font-mono font-bold ${isTimerRunning ? 'animate-pulse' : ''} ${stepParams.time !== '--:--' ? t('text-white', 'text-gray-800') : ''}`}
                >
                  {stepParams.time !== '--:--' ? formatTime(timer) : '--:--'}
                </span>
                <span className="text-[10px] font-bold uppercase mt-1 flex items-center gap-1 opacity-70">
                  {isTimerRunning ? (
                    <Pause size={10} fill="currentColor" />
                  ) : (
                    <Play size={10} fill="currentColor" />
                  )}{' '}
                  Temps
                </span>
              </button>
              {/* TEMP */}
              <div
                className={`w-24 h-24 md:w-28 md:h-28 rounded-full border-[6px] flex flex-col items-center justify-center transition-colors duration-500 ${isTempActive ? 'border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : t('border-gray-800 text-gray-700', 'border-gray-200 text-gray-300')}`}
              >
                <span
                  className={`text-xl md:text-2xl font-bold ${isTempActive ? t('text-white', 'text-gray-800') : ''}`}
                >
                  {stepParams.temp}
                </span>
                <span className="text-[10px] font-bold uppercase mt-1 opacity-70">
                  Temp
                </span>
              </div>
              {/* SPEED */}
              <div
                className={`w-24 h-24 md:w-28 md:h-28 rounded-full border-[6px] flex flex-col items-center justify-center transition-colors duration-500 ${isSpeedActive ? 'border-blue-500 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : t('border-gray-800 text-gray-700', 'border-gray-200 text-gray-300')}`}
              >
                {isEpi ? (
                  <Wheat
                    size={40}
                    className={`${t('text-white', 'text-gray-800')} ${isTimerRunning ? 'animate-wiggle' : ''}`}
                  />
                ) : isTurbo ? (
                  <Zap
                    size={40}
                    className={`${t('text-white', 'text-gray-800')} ${isTimerRunning ? 'animate-ping' : ''}`}
                  />
                ) : (
                  <span
                    className={`text-xl md:text-2xl font-bold ${isSpeedActive ? t('text-white', 'text-gray-800') : ''}`}
                  >
                    {stepParams.speed}
                  </span>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {isSpeedActive &&
                    !isEpi &&
                    !isTurbo &&
                    (stepParams.reverse ? (
                      <RotateCcw
                        size={12}
                        className="animate-spin-slow-reverse text-orange-500"
                      />
                    ) : (
                      <RotateCw
                        size={12}
                        className="animate-spin-slow text-blue-400"
                      />
                    ))}
                  <span className="text-[10px] font-bold uppercase opacity-70">
                    {isEpi ? 'Pétrin' : isTurbo ? 'Turbo' : 'Vit'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instruction Text */}
            <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col items-center text-center">
              <div
                className={`rounded-full px-4 py-1.5 mb-6 inline-flex items-center gap-2 border ${t('bg-gray-900/50 border-gray-800', 'bg-gray-100 border-gray-200')}`}
              >
                <span
                  className={`${theme.colors.accentDarker} font-bold text-xs uppercase tracking-widest`}
                >
                  Étape {currentStep + 1}
                </span>
              </div>
              {/* Refactored font size class to avoid false positive linter error */}
              {(() => {
                const stepFontSizeClass =
                  recipe.steps[currentStep].length > 150
                    ? 'text-l md:text-2xl'
                    : 'text-2xl md:text-4xl';

                return (
                  <p
                    className={`font-medium leading-normal mx-auto transition-colors ${stepFontSizeClass}`}
                  >
                    {recipe.steps[currentStep]}
                  </p>
                );
              })()}

              {/* Step Ingredients List */}
              {stepIngredients.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-8 opacity-90">
                  {stepIngredients.map((ing, i) => {
                    const isChecked = checkedIngredients.has(ing.fullText);

                    return (
                      <button
                        key={i}
                        onClick={() => handleIngredientAction(ing.fullText)}
                        className={`px-4 py-2 ${theme.properties.radius} flex items-center gap-2 border transition-all hover:scale-105 active:scale-95 ${
                          isChecked
                            ? t(
                                theme.colors.checkedBgDark,
                                theme.colors.checkedBgLight,
                              ) + ' opacity-60 line-through'
                            : t(
                                'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700',
                                'bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50',
                              )
                        }`}
                      >
                        <Check
                          size={14}
                          strokeWidth={3}
                          className={isChecked ? theme.colors.accent : 'text-gray-400 opacity-30'}
                        />
                        <span className="text-sm font-medium">
                          {ing.fullText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="h-24" />
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="absolute bottom-16 left-0 right-0 px-6 flex items-center justify-between pointer-events-none">
          <button
            aria-label="Étape précédente"
            onClick={() => setCurrentStep(p => Math.max(-1, p - 1))}
            disabled={currentStep === -1}
            className={`w-16 h-16 rounded-full backdrop-blur-md border flex items-center justify-center shadow-xl transition-all active:scale-90 pointer-events-auto ${currentStep === -1 ? 'opacity-0' : 'opacity-100'} ${t('bg-gray-900/90 border-gray-700 text-white hover:bg-gray-800', 'bg-white/90 border-gray-200 text-gray-800 hover:bg-gray-50')}`}
          >
            <ChevronLeft size={32} />
          </button>

          <button
            aria-label="Étape suivante"
            onClick={() =>
              setCurrentStep(p => Math.min(recipe.steps.length, p + 1))
            }
            disabled={isFinished}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 pointer-events-auto ${isOverview ? `${theme.colors.bgPrimary} text-white w-auto px-8 ${theme.properties.radius}` : `${theme.colors.bgPrimary} text-white`}`}
          >
            {isOverview ? (
              <span className="font-bold text-lg">Démarrer</span>
            ) : (
              <ChevronRight size={32} />
            )}
          </button>
        </div>

        {/* Chat IA Panel */}
        {chatOpen && <ChatPanel
          chatMessages={chatMessages}
          isChatLoading={isChatLoading}
          sendChatMessage={sendChatMessage}
          saveChatRecipe={saveChatRecipe}
          canSave={!!recipe.firestoreId}
          onClose={() => setChatOpen(false)}
          theme={theme}
          t={t}
        />}

        {/* Modal "Je l'ai cuisiné" (Upload) */}
        {cookedModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div
              className={`w-full max-w-sm p-6 ${theme.properties.radius} shadow-2xl relative flex flex-col ${t('bg-gray-900 border border-gray-700 text-white', 'bg-white border border-gray-200 text-gray-900')}`}
            >
              <button
                onClick={() => {
                  setCookedModalOpen(false);
                  setSelectedImage(null);
                  setPreviewUrl(null);
                }}
                className={`absolute top-4 right-4 p-2 rounded-full ${t('hover:bg-gray-800', 'hover:bg-gray-100')}`}
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Bravo ! 🎉</h3>
                <p className={`text-sm ${t('text-gray-400', 'text-gray-500')}`}>
                  Immortalisez votre chef-d&apos;œuvre pour Mealie.
                </p>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                {uploadSuccess ? (
                  <div className="flex flex-col items-center animate-in zoom-in text-green-500">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                      <Check size={32} />
                    </div>
                    <span className="font-bold">Image envoyée !</span>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />

                    {previewUrl ? (
                      <div className="relative w-full aspect-square bg-black/50 rounded-lg overflow-hidden border border-gray-700">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                        <button
                          onClick={() => {
                            setSelectedImage(null);
                            setPreviewUrl(null);
                          }}
                          className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full aspect-[4/3] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${t('border-gray-700 hover:border-gray-500 hover:bg-gray-800/50', 'border-gray-300 hover:border-gray-400 hover:bg-gray-50')}`}
                      >
                        <Camera size={48} className="opacity-50" />
                        <span className="text-sm font-medium opacity-70">
                          Ajouter une photo (optionnel)
                        </span>
                      </div>
                    )}

                    <Button
                      onClick={handleUpload}
                      className="w-full mt-4"
                      theme={theme}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="animate-spin" /> Traitement...
                        </>
                      ) : selectedImage ? (
                        <>
                          <UploadCloud size={18} /> Envoyer la photo
                        </>
                      ) : (
                        <>
                          <Check size={18} /> Valider sans photo
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Chat Panel Component ---
import { ChatMessage, ThemePlugin } from '@/app/lib/types';

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  sendChatMessage: (message: string) => Promise<void>;
  saveChatRecipe: () => Promise<void>;
  canSave: boolean;
  onClose: () => void;
  theme: ThemePlugin;
  t: (dark: string, light: string) => string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  chatMessages,
  isChatLoading,
  sendChatMessage,
  saveChatRecipe,
  canSave,
  onClose,
  theme,
  t,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleSend = () => {
    if (!input.trim() || isChatLoading) return;
    sendChatMessage(input.trim());
    setInput('');
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className={`flex-1 flex flex-col max-w-lg mx-auto w-full ${theme.properties.radius} overflow-hidden ${t('bg-gray-900', 'bg-white')} m-4 shadow-2xl border ${t('border-gray-700', 'border-gray-200')}`}>
        {/* Header */}
        <div className={`flex items-center gap-3 p-4 border-b ${t('border-gray-800', 'border-gray-100')}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">Assistant IA</h3>
            <p className={`text-xs ${t('text-gray-500', 'text-gray-400')}`}>Modifier la recette</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full ${t('hover:bg-gray-800', 'hover:bg-gray-100')}`}>
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 && (
            <p className={`text-sm text-center py-8 ${t('text-gray-600', 'text-gray-400')}`}>
              Demandez une modification, ex: &quot;Remplace le beurre par de l&apos;huile d&apos;olive&quot;
            </p>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 ${theme.properties.radius} text-sm ${
                msg.role === 'user'
                  ? `${theme.colors.bgPrimary} text-white`
                  : t('bg-gray-800 text-gray-200', 'bg-gray-100 text-gray-800')
              }`}>
                <p>{msg.content}</p>
                {msg.changes && msg.changes.length > 0 && (
                  <ul className={`mt-2 space-y-1 text-xs ${t('text-gray-400', 'text-gray-500')}`}>
                    {msg.changes.map((change, j) => (
                      <li key={j} className="flex gap-1.5">
                        <span className="shrink-0">-</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className={`px-3 py-2 ${theme.properties.radius} ${t('bg-gray-800', 'bg-gray-100')}`}>
                <Loader2 size={16} className="animate-spin text-purple-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className={`p-3 border-t ${t('border-gray-800', 'border-gray-100')} space-y-2`}>
          {canSave && (
            <button
              onClick={saveChatRecipe}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium ${theme.properties.radius} transition-colors ${t('bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-800', 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200')}`}
            >
              <Save size={14} /> Sauvegarder les modifications
            </button>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Modifier la recette..."
              disabled={isChatLoading}
              className={`flex-1 px-3 py-2 text-sm ${theme.properties.radius} border outline-none ${t('bg-gray-800 border-gray-700 text-white placeholder:text-gray-500', 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400')}`}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isChatLoading}
              className={`px-3 py-2 ${theme.properties.radius} ${theme.colors.bgPrimary} text-white disabled:opacity-40 transition-opacity`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
