import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProcessingView } from '../ProcessingView';
import { useCookingState } from '@/app/hooks/useCookingState';
import { makeCookingState, mockTheme } from '@/test-utils/cookingState';

jest.mock('@/app/hooks/useCookingState');

describe('ProcessingView', () => {
  const mockUseCookingState = useCookingState as jest.MockedFunction<
    typeof useCookingState
  >;

  // defaultProps carries no isDarkMode, so its `t` always returns the light class.
  const isDarkMode = false;

  const defaultProps = {
    theme: mockTheme,
    t: jest.fn((darkClass: string, lightClass: string) =>
      isDarkMode ? darkClass : lightClass,
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCookingState.mockReturnValue(
      makeCookingState({ ...defaultProps, isDarkMode: true }),
    );
  });

  it('renders the loading message and spinner', () => {
    render(<ProcessingView {...defaultProps} />);

    expect(screen.getByText('Chargement Recette...')).toBeInTheDocument();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('applies dark mode background classes when isDarkMode is true', () => {
    // Props-driven, so pass a `t` that returns the dark class.
    const t = jest.fn((darkClass: string) => darkClass);
    render(<ProcessingView {...defaultProps} t={t} />);
    expect(screen.getByTestId('processing-view-container')).toHaveClass(
      'bg-gray-950',
    );
    expect(t).toHaveBeenCalledWith('bg-gray-950', 'bg-gray-50');
  });

  it('applies light mode background classes when isDarkMode is false', () => {
    mockUseCookingState.mockReturnValue(
      makeCookingState({ ...defaultProps, isDarkMode: false }),
    );
    render(<ProcessingView {...defaultProps} />);
    expect(screen.getByTestId('processing-view-container')).toHaveClass(
      'bg-gray-50',
    );
    expect(defaultProps.t).toHaveBeenCalledWith(
      defaultProps.theme.colors.rootBgDark,
      defaultProps.theme.colors.rootBgLight,
    );
  });
});
