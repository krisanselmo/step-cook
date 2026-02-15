"use client";

import React from 'react';
import { useCookingState } from './hooks/useCookingState';
import { InputView } from './views/InputView';
import { ProcessingView } from './views/ProcessingView';
import { CookingView } from './views/CookingView';

export default function Home() {
  const {
    view,
    setView,
    rawText,
    setRawText,
    recipe,
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
  } = useCookingState();

  switch (view) {
    case 'input':
      return (
        <InputView
          rawText={rawText}
          setRawText={setRawText}
          handleProcess={handleProcess}
          mealieRecipes={mealieRecipes}
          isMealieLoading={isMealieLoading}
          mealieError={mealieError}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortOption={sortOption}
          setSortOption={setSortOption}
          filteredRecipes={filteredRecipes}
          fetchMealieRecipes={fetchMealieRecipes}
          loadMealieRecipe={loadMealieRecipe}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          theme={theme}
          setActiveThemeId={setActiveThemeId}
          t={t}
          handleGeminiGenerate={generateGeminiRecipe}
        />
      );
    case 'processing':
      return (
        <ProcessingView
          theme={theme}
          t={t}
        />
      );
    case 'cooking':
      return (
        <CookingView
          view={view}
          setView={setView}
          recipe={recipe}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          timer={timer}
          setTimer={setTimer}
          isTimerRunning={isTimerRunning}
          setIsTimerRunning={setIsTimerRunning}
          currentTime={currentTime}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          theme={theme}
          setActiveThemeId={setActiveThemeId}
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          modalData={modalData}
          setModalData={setModalData}
          cookedModalOpen={cookedModalOpen}
          setCookedModalOpen={setCookedModalOpen}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          previewUrl={previewUrl}
          setPreviewUrl={setPreviewUrl}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
          uploadSuccess={uploadSuccess}
          setUploadSuccess={setUploadSuccess}
          stepParams={stepParams}
          stepIngredients={stepIngredients}
          checkedIngredients={checkedIngredients}
          setCheckedIngredients={setCheckedIngredients}
          isGeminiMode={isGeminiMode}
          setIsGeminiMode={setIsGeminiMode}
          fileInputRef={fileInputRef}
          t={t}
          openMealiePage={openMealiePage}
          formatTime={formatTime}
          openGeminiModal={openGeminiModal}
          handleIngredientAction={handleIngredientAction}
          handleFileChange={handleFileChange}
          handleUpload={handleUpload}
        />
      );
    default:
      return null;
  }
}
