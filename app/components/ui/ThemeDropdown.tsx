'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ThemePlugin } from '@/app/lib/types';
import { THEMES } from '@/app/lib/themes';

interface ThemeDropdownProps {
  currentTheme: ThemePlugin;
  setThemeId: (id: string) => void;
  isDarkMode: boolean;
}

export const ThemeDropdown: React.FC<ThemeDropdownProps> = ({
  currentTheme,
  setThemeId,
  isDarkMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const t = (darkClass: string, lightClass: string) =>
    isDarkMode ? darkClass : lightClass;

  const ThemeIcon = currentTheme.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 transition-all ${currentTheme.properties.radius} ${t(
          'bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700',
          'bg-white text-gray-700 hover:bg-gray-50 border-gray-200',
        )} border shadow-sm`}
        title="Changer de thème"
      >
        <ThemeIcon size={18} className={currentTheme.colors.accent} />
        <span className="text-xs font-bold hidden sm:inline-block">
          {currentTheme.name}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-48 z-50 overflow-hidden shadow-xl border ${currentTheme.properties.radius} ${t('bg-gray-900 border-gray-700', 'bg-white border-gray-200')}`}
        >
          <div className="p-1 flex flex-col gap-1">
            {THEMES.map(theme => {
              const Icon = theme.icon;
              const isActive = currentTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    setThemeId(theme.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 text-left text-sm transition-colors ${currentTheme.properties.radius} ${
                    isActive
                      ? t('bg-gray-800 text-white', 'bg-gray-100 text-gray-900')
                      : t(
                          'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
                          'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        )
                  }`}
                >
                  <Icon
                    size={16}
                    className={isActive ? theme.colors.accent : ''}
                  />
                  <span>{theme.name}</span>
                  {isActive && (
                    <Check size={14} className="ml-auto opacity-50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
