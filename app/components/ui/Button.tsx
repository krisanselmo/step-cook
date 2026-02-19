'use client';

import React from 'react';
import { ThemePlugin } from '@/app/lib/types';

export interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  disabled?: boolean;
  title?: string;
  theme: ThemePlugin;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  disabled,
  title,
  theme,
}) => {
  const baseStyle = `px-4 py-3 font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 ${theme.properties.radius} ${theme.properties.buttonStyle}`;

  const variants = {
    primary: `${theme.colors.bgPrimary} text-white ${theme.colors.bgPrimaryHover}`,
    secondary: 'bg-gray-800 text-gray-200 hover:bg-gray-700',
    outline:
      'border border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white',
    ghost: 'bg-transparent text-gray-400 hover:text-gray-900',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      title={title}
    >
      {children}
    </button>
  );
};
