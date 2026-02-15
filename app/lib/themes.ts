import { ChefHat, Fish, Zap } from 'lucide-react';
import { ThemePlugin } from './types';

// Thème 1 : Classique (Vert/Clean)
export const defaultTheme: ThemePlugin = {
  id: 'default',
  name: 'Classique',
  title: 'Step Cook',
  icon: ChefHat,
  properties: {
    font: 'font-sans',
    radius: 'rounded-2xl',
    buttonStyle: 'shadow-lg active:scale-95',
  },
  colors: {
    accent: 'text-green-500',
    accentDarker: 'text-green-600',
    bgPrimary: 'bg-green-600',
    bgPrimaryHover: 'hover:bg-green-500',
    borderAccent: 'border-green-500',
    shadowAccent: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    checkedBgDark: 'bg-green-900/20 border-green-500/30 text-green-400',
    checkedBgLight: 'bg-green-50 border-green-200 text-green-700',
    rootBgDark: 'bg-gray-950 text-gray-100',
    rootBgLight: 'bg-gray-100 text-gray-900',
    cardBgDark: 'bg-gray-900 border-gray-800',
    cardBgLight: 'bg-white border-gray-200',
  }
};

// Thème 2 : Dave The Diver (Cyan/Océan)
export const daveTheme: ThemePlugin = {
  id: 'dave',
  name: 'Dave The Diver',
  title: 'Bancho Sushi',
  icon: Fish,
  properties: {
    font: 'font-sans',
    radius: 'rounded-xl',
    buttonStyle: 'shadow-md border-b-4 border-cyan-800 active:border-b-0 active:translate-y-1',
  },
  colors: {
    accent: 'text-cyan-400',
    accentDarker: 'text-cyan-600',
    bgPrimary: 'bg-cyan-600',
    bgPrimaryHover: 'hover:bg-cyan-500',
    borderAccent: 'border-cyan-500',
    shadowAccent: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    checkedBgDark: 'bg-cyan-900/30 border-cyan-500/40 text-cyan-300',
    checkedBgLight: 'bg-cyan-100 border-cyan-300 text-cyan-800',
    rootBgDark: 'bg-slate-950 text-cyan-50',
    rootBgLight: 'bg-sky-50 text-slate-900',
    cardBgDark: 'bg-slate-900 border-slate-800',
    cardBgLight: 'bg-white border-sky-200',
  }
};

// Thème 3 : Cyberpunk (Rose/Néon/Mono)
export const cyberTheme: ThemePlugin = {
  id: 'cyber',
  name: 'Cyberpunk',
  title: 'NET_COOK',
  icon: Zap,
  properties: {
    font: 'font-mono',
    radius: 'rounded-none', // Pas d'arrondis
    buttonStyle: 'border border-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] active:bg-pink-500/20',
  },
  colors: {
    accent: 'text-pink-500',
    accentDarker: 'text-pink-600',
    bgPrimary: 'bg-pink-600',
    bgPrimaryHover: 'hover:bg-pink-500',
    borderAccent: 'border-pink-500',
    shadowAccent: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]',
    checkedBgDark: 'bg-pink-900/40 border-pink-500 text-pink-300',
    checkedBgLight: 'bg-pink-100 border-pink-500 text-pink-800',
    rootBgDark: 'bg-black text-pink-50',
    rootBgLight: 'bg-zinc-100 text-zinc-900',
    cardBgDark: 'bg-zinc-950 border-zinc-800',
    cardBgLight: 'bg-white border-zinc-300',
  }
};

export const THEMES: ThemePlugin[] = [defaultTheme, daveTheme, cyberTheme];
