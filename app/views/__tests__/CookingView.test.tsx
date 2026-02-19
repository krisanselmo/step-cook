import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CookingView } from '../CookingView';
import { useCookingState } from '@/app/hooks/useCookingState';
import { Recipe, StepParams } from '@/app/lib/types';

// Mock the useCookingState hook
jest.mock('@/app/hooks/useCookingState');

// Mock Image from next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

describe('CookingView', () => {
  const mockUseCookingState = useCookingState as jest.MockedFunction<typeof useCookingState>;

  const mockRecipe: Recipe = {
    title: 'Test Recipe',
    ingredients: [{ fullText: '1 Egg', keywords: ['egg'] }, { fullText: '2 Sugar', keywords: ['sugar'] }],
    steps: ['Step 1: Mix ingredients', 'Step 2: Cook for 5 min', 'Step 3: Serve warm'],
  };

  const defaultStepParams: StepParams = { time: '--:--', temp: '---', speed: '---', seconds: 0, reverse: false };

  let mockSetView: jest.Mock;
  let mockSetCurrentStep: jest.Mock;
  let mockSetTimer: jest.Mock;
  let mockSetIsTimerRunning: jest.Mock;
  let mockSetIsDarkMode: jest.Mock;
  let mockSetActiveThemeId: jest.Mock;
  let mockSetModalOpen: jest.Mock;
  let mockSetModalData: jest.Mock;
  let mockSetCookedModalOpen: jest.Mock;
  let mockSetSelectedImage: jest.Mock;
  let mockSetPreviewUrl: jest.Mock;
  let mockSetIsUploading: jest.Mock;
  let mockSetUploadSuccess: jest.Mock;
  let mockSetCheckedIngredients: jest.Mock;
  let mockSetIsGeminiMode: jest.Mock;
  let mockOpenMealiePage: jest.Mock;
  let mockFormatTime: jest.Mock;
  let mockOpenGeminiModal: jest.Mock;
  let mockHandleIngredientAction: jest.Mock;
  let mockHandleFileChange: jest.Mock;
  let mockHandleUpload: jest.Mock; // Fixed type here

  const getMockedDefaultProps = (overrides?: Partial<ReturnType<typeof useCookingState>>) => {
    mockSetView = jest.fn();
    mockSetCurrentStep = jest.fn();
    mockSetTimer = jest.fn();
    mockSetIsTimerRunning = jest.fn();
    mockSetIsDarkMode = jest.fn();
    mockSetActiveThemeId = jest.fn();
    mockSetModalOpen = jest.fn();
    mockSetModalData = jest.fn();
    mockSetCookedModalOpen = jest.fn();
    mockSetSelectedImage = jest.fn();
    mockSetPreviewUrl = jest.fn();
    mockSetIsUploading = jest.fn();
    mockSetUploadSuccess = jest.fn();
    mockSetCheckedIngredients = jest.fn();
    mockSetIsGeminiMode = jest.fn();
    mockOpenMealiePage = jest.fn();
    mockFormatTime = jest.fn((seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    });
    mockOpenGeminiModal = jest.fn();
    mockHandleIngredientAction = jest.fn();
    mockHandleFileChange = jest.fn();
    mockHandleUpload = jest.fn();

    const baseProps = {
      view: 'cooking' as 'cooking',
      setView: mockSetView,
      recipe: mockRecipe,
      currentStep: -1,
      setCurrentStep: mockSetCurrentStep,
      timer: 0,
      setTimer: mockSetTimer,
      isTimerRunning: false,
      setIsTimerRunning: mockSetIsTimerRunning,
      currentTime: '12:00',
      isDarkMode: true,
      setIsDarkMode: mockSetIsDarkMode,
      theme: {
        id: 'default',
        name: 'Default',
        title: 'Step Cook',
        icon: () => <svg data-testid="theme-icon" />,
        properties: { font: 'font-sans', radius: 'rounded-xl', buttonStyle: 'base' },
        colors: {
          accent: 'text-blue-500', accentDarker: 'text-blue-600', bgPrimary: 'bg-blue-500',
          bgPrimaryHover: 'hover:bg-blue-600', borderAccent: 'border-blue-500', shadowAccent: 'shadow-blue-500',
          checkedBgDark: 'bg-gray-800', checkedBgLight: 'bg-gray-100', rootBgDark: 'bg-gray-950',
          rootBgLight: 'bg-gray-50', cardBgDark: 'bg-gray-900', cardBgLight: 'bg-white',
        },
      },
      setActiveThemeId: mockSetActiveThemeId,
      modalOpen: false,
      setModalOpen: mockSetModalOpen,
      modalData: { ingredient: '', suggestion: '', loading: false },
      setModalData: mockSetModalData,
      cookedModalOpen: false,
      setCookedModalOpen: mockSetCookedModalOpen,
      selectedImage: null,
      setSelectedImage: mockSetSelectedImage,
      previewUrl: null,
      setPreviewUrl: mockSetPreviewUrl,
      isUploading: false,
      setIsUploading: mockSetIsUploading,
      uploadSuccess: false,
      setUploadSuccess: mockSetUploadSuccess,
      stepParams: defaultStepParams,
      stepIngredients: [],
      checkedIngredients: new Set(),
      setCheckedIngredients: mockSetCheckedIngredients,
      isGeminiMode: false,
      setIsGeminiMode: mockSetIsGeminiMode,
      fileInputRef: { current: null },
      t: jest.fn((darkClass: string, lightClass: string) => baseProps.isDarkMode ? darkClass : lightClass),
      openMealiePage: mockOpenMealiePage,
      formatTime: mockFormatTime,
      openGeminiModal: mockOpenGeminiModal,
      handleIngredientAction: mockHandleIngredientAction,
      handleFileChange: mockHandleFileChange,
      handleUpload: mockHandleUpload,
    };
    return { ...baseProps, ...overrides };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCookingState.mockReturnValue(getMockedDefaultProps());
  });

  it('renders recipe title in the header', () => {
    render(<CookingView {...getMockedDefaultProps()} />);
    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
  });

  describe('Overview Mode (-1 currentStep)', () => {
    it('renders ingredient list with correct items', () => {
      render(<CookingView {...getMockedDefaultProps({ currentStep: -1 })} />);
      expect(screen.getByText('Ingrédients')).toBeInTheDocument();
      expect(screen.getByText('1 Egg')).toBeInTheDocument();
      expect(screen.getByText('2 Sugar')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Démarrer/i })).toBeInTheDocument();
    });

    it('calls setCurrentStep with 0 when "Démarrer" is clicked', () => {
      render(<CookingView {...getMockedDefaultProps({ currentStep: -1 })} />);
      fireEvent.click(screen.getByRole('button', { name: /Démarrer/i }));
      expect(mockSetCurrentStep).toHaveBeenCalledWith(0);
    });

    it('calls handleIngredientAction when ingredient is clicked', () => {
      const checkedIngredients = new Set(['1 Egg']);
      render(<CookingView {...getMockedDefaultProps({ currentStep: -1, checkedIngredients })} />);

      fireEvent.click(screen.getByText('2 Sugar'));
      expect(mockHandleIngredientAction).toHaveBeenCalledWith('2 Sugar');
    });

    it('calls openGeminiModal when ingredient is clicked and in Gemini mode', () => {
      render(<CookingView {...getMockedDefaultProps({ currentStep: -1, isGeminiMode: true })} />);
      fireEvent.click(screen.getByText('1 Egg'));
      expect(mockOpenGeminiModal).toHaveBeenCalledWith('1 Egg');
    });
  });

  describe('Active Step Mode (0 to recipe.steps.length - 1)', () => {
    let activeStepProps: ReturnType<typeof useCookingState>;

    beforeEach(() => {
      activeStepProps = getMockedDefaultProps({ currentStep: 0, stepParams: { ...defaultStepParams, time: '05:00', seconds: 300 } });
      mockUseCookingState.mockReturnValue(activeStepProps);
    });

    it('renders the current step instruction', () => {
      render(<CookingView {...activeStepProps} />);
      expect(screen.getByText('Étape 1')).toBeInTheDocument();
      expect(screen.getByText('Step 1: Mix ingredients')).toBeInTheDocument();
    });

    it('displays the timer and allows toggling', () => {
      const initialProps = getMockedDefaultProps({ currentStep: 0, timer: 300, isTimerRunning: false, stepParams: { ...defaultStepParams, time: '05:00', seconds: 300 } });
      mockUseCookingState.mockReturnValue(initialProps);
      render(<CookingView {...initialProps} />);
      expect(screen.getByText('05:00')).toBeInTheDocument();

      const timerButton = screen.getByText('Temps').closest('button');
      fireEvent.click(timerButton!);
      expect(mockSetIsTimerRunning).toHaveBeenCalledWith(true);

      const runningTimerProps = getMockedDefaultProps({ currentStep: 0, timer: 299, isTimerRunning: true, stepParams: { ...defaultStepParams, time: '05:00', seconds: 300 } });
      mockUseCookingState.mockReturnValue(runningTimerProps); // Simulate running timer
      fireEvent.click(timerButton!);
      expect(mockSetIsTimerRunning).toHaveBeenCalledWith(false);
    });

    it('navigates to the next step when "next" button is clicked', () => {
      render(<CookingView {...getMockedDefaultProps({ currentStep: 0 })} />);
      fireEvent.click(screen.getByRole('button', { name: /Étape suivante/i }));
      expect(mockSetCurrentStep).toHaveBeenCalledWith(1);
    });

    it('navigates to the previous step when "previous" button is clicked', () => {
      render(<CookingView {...getMockedDefaultProps({ currentStep: 1 })} />);
      fireEvent.click(screen.getByRole('button', { name: /Étape précédente/i }));
      expect(mockSetCurrentStep).toHaveBeenCalledWith(0);
    });
  });

  describe('Finished Mode (currentStep >= recipe.steps.length)', () => {
    let finishedProps: ReturnType<typeof useCookingState>;

    beforeEach(() => {
      finishedProps = getMockedDefaultProps({ currentStep: mockRecipe.steps.length });
      mockUseCookingState.mockReturnValue(finishedProps);
    });

    it('renders the "Recette Terminée !" message', () => {
      render(<CookingView {...finishedProps} />);
      expect(screen.getByText(/Recette Terminée/i)).toBeInTheDocument();
      expect(screen.getByText('Bravo ! 🎉')).toBeInTheDocument(); // From the cooked modal if open
    });

    it('navigates to input view when "Autre Recette" is clicked', () => {
      render(<CookingView {...finishedProps} />);
      fireEvent.click(screen.getByRole('button', { name: /Autre Recette/i }));
      expect(mockSetView).toHaveBeenCalledWith('input');
    });

    it('opens cooked modal when "Je l\'ai cuisiné !" is clicked', () => {
      const recipeWithSlug = { ...mockRecipe, slug: 'test-recipe' };
      render(<CookingView {...getMockedDefaultProps({ currentStep: mockRecipe.steps.length, recipe: recipeWithSlug })} />);
      fireEvent.click(screen.getByRole('button', { name: new RegExp('Je l\'ai cuisiné !', 'i') }));
      expect(mockSetCookedModalOpen).toHaveBeenCalledWith(true);
    });
  });

  describe('Dark/Light Mode Toggle', () => {
    it('toggles dark/light mode when button is clicked', () => {
      const initialProps = getMockedDefaultProps({ isDarkMode: false });
      mockUseCookingState.mockReturnValue(initialProps);
      render(<CookingView {...initialProps} />);
      const toggleButton = screen.getByRole('button', { name: /Passer en mode clair/i }); // Sun icon is visible in light mode
      fireEvent.click(toggleButton);
      expect(mockSetIsDarkMode).toHaveBeenCalledWith(true);
    });
  });

  // More tests would be added for modals, upload, theme dropdown, etc.
});