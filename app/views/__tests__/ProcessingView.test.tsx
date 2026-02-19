import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProcessingView } from '../ProcessingView';
import { useCookingState } from '@/app/hooks/useCookingState';

// Mock the useCookingState hook
jest.mock('@/app/hooks/useCookingState');

describe('ProcessingView', () => {
  const mockUseCookingState = useCookingState as jest.MockedFunction<typeof useCookingState>;

  const defaultProps = {
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
    t: jest.fn((darkClass: string, lightClass: string) => defaultProps.isDarkMode ? darkClass : lightClass),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCookingState.mockReturnValue({ ...defaultProps, isDarkMode: true });
  });

  it('renders the loading message and spinner', () => {
    render(<ProcessingView {...defaultProps} />);

    expect(screen.getByText('Chargement Recette...')).toBeInTheDocument();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('applies dark mode background classes when isDarkMode is true', () => {
    mockUseCookingState.mockReturnValue({ ...defaultProps, isDarkMode: true });
    render(<ProcessingView {...defaultProps} />);
    expect(screen.getByTestId('processing-view-container')).toHaveClass('bg-gray-950');
    expect(defaultProps.t).toHaveBeenCalledWith('bg-gray-950', 'bg-gray-50');
  });

  it('applies light mode background classes when isDarkMode is false', () => {
    mockUseCookingState.mockReturnValue({ ...defaultProps, isDarkMode: false });
    render(<ProcessingView {...defaultProps} />);
    expect(screen.getByTestId('processing-view-container')).toHaveClass('bg-gray-50');
    expect(defaultProps.t).toHaveBeenCalledWith(defaultProps.theme.colors.rootBgDark, defaultProps.theme.colors.rootBgLight);
  });
});
