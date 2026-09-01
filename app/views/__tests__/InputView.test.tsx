import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InputView } from '../InputView';
import { useCookingState } from '@/app/hooks/useCookingState';
import { makeCookingState, mockTheme } from '@/test-utils/cookingState';

jest.mock('@/app/hooks/useCookingState');

describe('InputView', () => {
  const mockUseCookingState = useCookingState as jest.MockedFunction<
    typeof useCookingState
  >;

  const isDarkMode = true;

  // `handleGeminiGenerate` is an InputView prop, not part of the hook state.
  const defaultProps = {
    ...makeCookingState({
      isDarkMode,
      theme: mockTheme,
      t: jest.fn((darkClass: string, lightClass: string) =>
        isDarkMode ? darkClass : lightClass,
      ),
    }),
    handleGeminiGenerate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
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

    // On desktop the AI column renders straight away, no tab to activate.
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
    render(<InputView {...defaultProps} mealieRecipes={mealieRecipes} />);

    // Mealie and saved recipes are merged into one column.
    expect(screen.getByText('Recipe One')).toBeInTheDocument();
    expect(screen.getByText('Recipe Two')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Recipe One'));
    expect(defaultProps.loadMealieRecipe).toHaveBeenCalledWith('recipe-1');
  });

  it('displays loading state for Mealie recipes', () => {
    render(<InputView {...defaultProps} isMealieLoading={true} />);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('displays error state for Mealie recipes', () => {
    render(<InputView {...defaultProps} mealieError="Failed to load" />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('hides Mealie entirely when it is not configured', () => {
    render(
      <InputView
        {...defaultProps}
        isMealieConfigured={false}
        mealieError="Impossible de charger les recettes Mealie."
      />,
    );

    // No banner, no filter: the integration does not exist for this user.
    expect(screen.queryByText('Mealie indisponible')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mealie' })).not.toBeInTheDocument();
    // One source left, so the source filter is pointless.
    expect(screen.queryByRole('button', { name: 'IA' })).not.toBeInTheDocument();
  });

  it('hides the AI assistant when Gemini is not configured', () => {
    render(<InputView {...defaultProps} isGeminiConfigured={false} />);

    expect(screen.queryByText('Assistant IA')).not.toBeInTheDocument();
    expect(screen.queryByText('Générer Recette')).not.toBeInTheDocument();
    // Manual mode depends on no integration.
    expect(screen.getByText('Mode Manuel')).toBeInTheDocument();
  });

  it('hides the saved recipes source when Firestore is not configured', () => {
    render(
      <InputView
        {...defaultProps}
        isFirestoreConfigured={false}
        savedError="Impossible de charger les recettes sauvegardées."
      />,
    );

    expect(screen.queryByText('Recettes IA indisponible')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'IA' })).not.toBeInTheDocument();
  });

  it('shows the Mealie filter when it is configured', () => {
    render(<InputView {...defaultProps} isMealieConfigured={true} />);
    expect(screen.getByRole('button', { name: 'Mealie' })).toBeInTheDocument();
  });

  it('keeps the saved recipes visible when Mealie fails', () => {
    render(
      <InputView
        {...defaultProps}
        mealieError="Impossible de charger les recettes Mealie."
        savedRecipes={[
          {
            id: 'saved-1',
            title: 'Clafoutis aux Figues',
            createdAt: '2026-08-31T15:07:43.853Z',
          },
        ]}
      />,
    );

    // The banner reports the outage...
    expect(screen.getByText('Mealie indisponible')).toBeInTheDocument();
    // ...without hiding the source that answered.
    expect(screen.getByText('Clafoutis aux Figues')).toBeInTheDocument();
    expect(screen.queryByText('Aucune recette trouvée.')).not.toBeInTheDocument();
  });

  it('offers a retry that refetches both sources', () => {
    render(<InputView {...defaultProps} mealieError="Failed to load" />);
    fireEvent.click(screen.getByLabelText('Réessayer Mealie'));
    expect(defaultProps.fetchMealieRecipes).toHaveBeenCalled();
  });
});
