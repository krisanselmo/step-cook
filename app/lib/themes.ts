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

// Thème 2 : Dave The Diver (Pixel Art / Bancho Sushi)
export const daveTheme: ThemePlugin = {
  id: 'dave',
  name: 'Dave The Diver',
  title: 'BANCHO SUSHI',
  icon: Fish,
  properties: {
    font: 'font-pixel',
    radius: 'rounded-none',
    // Bouton style "UI de jeu" : Bordure épaisse, ombre dure et décalage au survol/clic
    buttonStyle: 'border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all',
  },
  colors: {
    accent: 'text-[#00d1ff]', // Cyan néon du jeu
    accentDarker: 'text-[#0088aa]',
    bgPrimary: 'bg-[#ff5f5f]', // Rouge "Sushi/Thon" pour les actions principales
    bgPrimaryHover: 'hover:bg-[#ff7a7a]',
    borderAccent: 'border-[#00d1ff]',
    shadowAccent: 'shadow-none',

    // États cochés
    checkedBgDark: 'bg-[#29366f] border-4 border-[#00d1ff] text-[#00d1ff]',
    checkedBgLight: 'bg-[#ffd9a2] border-4 border-[#8b4513] text-[#5d2e0a]', // Style bois/tampon

    // Backgrounds (Sombre = Blue Hole / Clair = Bancho Sushi)
    rootBgDark: 'bg-[#1a1c2c] text-[#f4f4f4]', // Bleu abyssal
    rootBgLight: 'bg-[#fcf5e5] text-[#3c2a21]', // Beige parchemin / Papier de riz

    // Cards
    cardBgDark: 'bg-[#29366f] border-4 border-black', // Panneau métal/sous-marin
    cardBgLight: 'bg-[#fffdfa] border-4 border-[#3c2a21] shadow-[8px_8px_0px_0px_rgba(60,42,33,0.1)]', // Panneau bois/menu
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
    radius: 'rounded-none',
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
