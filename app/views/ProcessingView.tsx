"use client";

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useCookingState } from '@/app/hooks/useCookingState';

interface ProcessingViewProps {
  theme: ReturnType<typeof useCookingState>['theme'];
  t: ReturnType<typeof useCookingState>['t'];
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({ theme, t }) => {
  return (
    <div className={`h-screen flex flex-col items-center justify-center ${theme.colors.accent} transition-colors duration-300 ${t(theme.colors.rootBgDark, theme.colors.rootBgLight)}`}>
      <RotateCcw className="animate-spin mb-4" size={32} />
      <p className={`text-sm tracking-widest uppercase ${t('text-gray-400', 'text-gray-500')}`}>Chargement Recette...</p>
    </div>
  );
};