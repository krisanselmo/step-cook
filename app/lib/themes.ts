import {
  ChefHat,
  CupSoda,
  Fish,
  Leaf,
  Rat,
  Skull,
  Sparkles,
  Star,
  Wheat,
  Zap,
} from 'lucide-react';
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
  },
};

// Thème 2 : Dave The Diver (Pixel Art / Bancho Sushi)
const daveTheme: ThemePlugin = {
  id: 'dave',
  name: 'Dave The Diver',
  title: 'BANCHO SUSHI',
  icon: Fish,
  properties: {
    font: 'font-pixel',
    radius: 'rounded-none',
    buttonStyle:
      'border-4 border-[#0a0a2e] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all',
  },
  colors: {
    accent: 'text-[#5ee8ff]',
    accentDarker: 'text-[#38c8e0]',
    bgPrimary: 'bg-[#ff6b4a]',
    bgPrimaryHover: 'hover:bg-[#ff8566]',
    borderAccent: 'border-[#5ee8ff]',
    shadowAccent: 'shadow-none',

    checkedBgDark: 'bg-[#5ee8ff]/15 border-4 border-[#5ee8ff] text-[#5ee8ff]',
    checkedBgLight: 'bg-[#ffe4b5] border-4 border-[#8b4513] text-[#5d2e0a]',

    rootBgDark: 'bg-[#0a0e2a] text-[#e8f0ff]',
    rootBgLight: 'bg-[#fcf5e5] text-[#3c2a21]',

    cardBgDark: 'bg-[#12184a] border-4 border-[#1e2870]',
    cardBgLight:
      'bg-[#fffdfa] border-4 border-[#3c2a21] shadow-[8px_8px_0px_0px_rgba(60,42,33,0.1)]',
  },
};

// Thème 3 : Cyberpunk (Rose/Néon/Mono)
const cyberTheme: ThemePlugin = {
  id: 'cyber',
  name: 'Cyberpunk',
  title: 'NET_COOK',
  icon: Zap,
  properties: {
    font: 'font-mono',
    radius: 'rounded-none',
    buttonStyle:
      'border border-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.6)] active:bg-pink-500/20',
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
  },
};

// Thème 4 : Monkey Island (Pirate / Rétro aventure)
const monkeyIslandTheme: ThemePlugin = {
  id: 'monkey-island',
  name: 'Monkey Island',
  title: 'SCUMM Kitchen',
  icon: Skull,
  properties: {
    font: 'font-cinzel',
    radius: 'rounded-lg',
    buttonStyle:
      'border-2 border-[#c8a84e] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all',
  },
  colors: {
    accent: 'text-[#c8a84e]',
    accentDarker: 'text-[#a68a3a]',
    bgPrimary: 'bg-[#8b2f2f]',
    bgPrimaryHover: 'hover:bg-[#a33a3a]',
    borderAccent: 'border-[#c8a84e]',
    shadowAccent: 'shadow-[0_0_15px_rgba(200,168,78,0.3)]',
    checkedBgDark: 'bg-[#2a1a4e]/60 border-[#c8a84e]/50 text-[#c8a84e]',
    checkedBgLight: 'bg-[#f5e6c8] border-[#8b6914] text-[#5a3e0a]',
    rootBgDark: 'bg-[#0f0a1a] text-[#e8d5a3]',
    rootBgLight: 'bg-[#f2e8d0] text-[#2a1a0a]',
    cardBgDark: 'bg-[#1a1030] border-[#3a2a5e]',
    cardBgLight: 'bg-[#fdf6e3] border-[#c8a84e]',
  },
};

// Thème 5 : Ratatouille (Paris / Gusteau's)
const ratatouilleTheme: ThemePlugin = {
  id: 'ratatouille',
  name: 'Ratatouille',
  title: "Chez Gusteau",
  icon: Rat,
  properties: {
    font: 'font-lora',
    radius: 'rounded-lg',
    buttonStyle:
      'shadow-md hover:shadow-lg active:scale-[0.97] transition-all',
  },
  colors: {
    accent: 'text-[#c0392b]',
    accentDarker: 'text-[#8f291e]',
    bgPrimary: 'bg-[#c0392b]',
    bgPrimaryHover: 'hover:bg-[#a32f23]',
    borderAccent: 'border-[#c0392b]',
    shadowAccent: 'shadow-[0_0_20px_rgba(192,57,43,0.22)]',
    checkedBgDark: 'bg-[#c0392b]/15 border-[#c0392b]/50 text-[#e8a89f]',
    checkedBgLight: 'bg-[#f7ddd6] border-[#c0392b] text-[#8f291e]',
    // Mode clair : fond parchemin + cartes quasi-blanches → contraste net.
    rootBgDark: 'bg-[#221520] text-[#f3e7d8]',
    rootBgLight: 'bg-[#f5ead5] text-[#3d2817]',
    cardBgDark: 'bg-[#311f2d] border-[#4a3343]',
    cardBgLight: 'bg-[#fffdf9] border-[#e7d5b8]',
  },
};

// Thème 6 : Mario (Nintendo / Pixel / Champignon)
const marioTheme: ThemePlugin = {
  id: 'mario',
  name: 'Mario',
  title: "MAMA MIA'S",
  icon: Star,
  properties: {
    font: 'font-pixel',
    radius: 'rounded-none',
    buttonStyle:
      'border-4 border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all',
  },
  colors: {
    accent: 'text-[#e8c500]',
    accentDarker: 'text-[#c8a800]',
    bgPrimary: 'bg-[#e52521]',
    bgPrimaryHover: 'hover:bg-[#ff3b36]',
    borderAccent: 'border-[#e8c500]',
    shadowAccent: 'shadow-none',
    checkedBgDark: 'bg-[#e8c500]/15 border-4 border-[#e8c500] text-[#e8c500]',
    checkedBgLight: 'bg-[#fff8d0] border-4 border-[#c8a800] text-[#8a7000]',
    rootBgDark: 'bg-[#2a0f8a] text-[#ffffff]',
    rootBgLight: 'bg-[#63b4ff] text-[#1a1a1a]',
    cardBgDark: 'bg-[#1a0860] border-4 border-[#3d1fb0]',
    cardBgLight: 'bg-[#fffef5] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]',
  },
};

export const THEMES = [
  defaultTheme,
  daveTheme,
  cyberTheme,
  monkeyIslandTheme,
  ratatouilleTheme,
  marioTheme,
] as const satisfies ThemePlugin[];
