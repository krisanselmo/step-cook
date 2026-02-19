import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InputView } from '../InputView';
import { useCookingState } from '@/app/hooks/useCookingState';

// Mock the useCookingState hook
jest.mock('@/app/hooks/useCookingState');

describe('InputView', () => {
  const mockUseCookingState = useCookingState as jest.MockedFunction<
    typeof useCookingState
  >;

  // Common props to pass to InputView for testing
  const defaultProps = {
    rawText: '',
    setRawText: jest.fn(),
    handleProcess: jest.fn(),
    mealieRecipes: [],
    isMealieLoading: false,
    mealieError: null,
    searchTerm: '',
    setSearchTerm: jest.fn(),
    sortOption: 'date',
    setSortOption: jest.fn(),
    filteredRecipes: [],
    fetchMealieRecipes: jest.fn(),
    loadMealieRecipe: jest.fn(),
    isDarkMode: true,
    setIsDarkMode: jest.fn(),
    theme: {
      id: 'default',
      name: 'Default',
      title: 'Step Cook',
      icon: () => <svg data-testid="theme-icon" />,
      properties: {
        font: 'font-sans',
        radius: 'rounded-xl',
        buttonStyle: 'base',
      },
      colors: {
        accent: 'text-blue-500',
        accentDarker: 'text-blue-600',
        bgPrimary: 'bg-blue-500',
        bgPrimaryHover: 'hover:bg-blue-600',
        borderAccent: 'border-blue-500',
        shadowAccent: 'shadow-blue-500',
        checkedBgDark: 'bg-gray-800',
        checkedBgLight: 'bg-gray-100',
        rootBgDark: 'bg-gray-950',
        rootBgLight: 'bg-gray-50',
        cardBgDark: 'bg-gray-900',
        cardBgLight: 'bg-white',
      },
    },
    setActiveThemeId: jest.fn(),
    t: jest.fn((darkClass: string, lightClass: string) =>
      defaultProps.isDarkMode ? darkClass : lightClass,
    ),
    handleGeminiGenerate: jest.fn(),
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Set a default mock implementation for useCookingState
    // InputView manages its own activeTab state, so we don't mock it here
    mockUseCookingState.mockReturnValue(defaultProps);
  });

  it('renders correctly in manual mode by default', () => {
    render(<InputView {...defaultProps} />);

    expect(screen.getByText('Mode Manuel')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Ou collez une recette ici...'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Cuisiner/i }),
    ).toBeInTheDocument();
  });

  it('handles raw text input change', () => {
    render(<InputView {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      'Ou collez une recette ici...',
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Nouvelle recette' } });

    expect(defaultProps.setRawText).toHaveBeenCalledWith('Nouvelle recette');
  });

  it('calls handleProcess when "Cuisiner" button is clicked', () => {
    render(<InputView {...defaultProps} rawText="Test recipe" />);
    fireEvent.click(screen.getByRole('button', { name: /Cuisiner/i }));

    expect(defaultProps.handleProcess).toHaveBeenCalledTimes(1);
  });

  it('disables "Cuisiner" button if rawText is empty', () => {
    render(<InputView {...defaultProps} rawText="" />);
    expect(screen.getByRole('button', { name: /Cuisiner/i })).toBeDisabled();
  });

  it('enables "Cuisiner" button if rawText is not empty', () => {
    render(<InputView {...defaultProps} rawText="Some text" />);
    expect(screen.getByRole('button', { name: /Cuisiner/i })).toBeEnabled();
  });

  it('toggles dark/light mode when button is clicked', () => {
    render(<InputView {...defaultProps} isDarkMode={false} />);
    const toggleButton = screen.getByRole('button', {
      name: /Passer en mode sombre/i,
    }); // Button has 'Passer en mode sombre' aria-label in light mode
    fireEvent.click(toggleButton);
    expect(defaultProps.setIsDarkMode).toHaveBeenCalledWith(true);
  });
  it('switches to Gemini tab and handles input', async () => {
    render(<InputView {...defaultProps} />);

    // Switch to Gemini tab (mobile view)
    fireEvent.click(screen.getByRole('button', { name: /Gemini/i }));

    const geminiTextarea = screen.getByPlaceholderText(
      /Décrivez votre recette de rêve/i,
    ) as HTMLTextAreaElement;
    fireEvent.change(geminiTextarea, { target: { value: 'My dream recipe' } });
    expect(geminiTextarea.value).toBe('My dream recipe');

    fireEvent.click(screen.getByRole('button', { name: /Générer Recette/i }));
    expect(defaultProps.handleGeminiGenerate).toHaveBeenCalledWith(
      'My dream recipe',
    );
  });

  it('displays Mealie recipes and loads one on click', async () => {
    const mealieRecipes = [
      {
        id: '1',
        slug: 'recipe-1',
        name: 'Recipe One',
        description: 'Desc One',
      },
      {
        id: '2',
        slug: 'recipe-2',
        name: 'Recipe Two',
        description: 'Desc Two',
      },
    ];
    mockUseCookingState.mockReturnValue({
      ...defaultProps,
      mealieRecipes,
      filteredRecipes: mealieRecipes,
      isMealieLoading: false,
      activeTab: 'mealie',
    });

    render(
      <InputView
        {...defaultProps}
        mealieRecipes={mealieRecipes}
        filteredRecipes={mealieRecipes}
        activeTab="mealie"
      />,
    );

    // Switch to Mealie tab (mobile view if activeTab is not already mealie)
    fireEvent.click(screen.getByRole('button', { name: /Mealie/i }));

    expect(screen.getByText('Recipe One')).toBeInTheDocument();
    expect(screen.getByText('Recipe Two')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Recipe One'));
    expect(defaultProps.loadMealieRecipe).toHaveBeenCalledWith('recipe-1');
  });

  it('displays loading state for Mealie recipes', () => {
    mockUseCookingState.mockReturnValue({
      ...defaultProps,
      isMealieLoading: true,
      activeTab: 'mealie',
    });
    render(
      <InputView {...defaultProps} isMealieLoading={true} activeTab="mealie" />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Mealie/i }));
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('displays error state for Mealie recipes', () => {
    mockUseCookingState.mockReturnValue({
      ...defaultProps,
      mealieError: 'Failed to load',
      activeTab: 'mealie',
    });
    render(
      <InputView
        {...defaultProps}
        mealieError="Failed to load"
        activeTab="mealie"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Mealie/i }));
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });
});
