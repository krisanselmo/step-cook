'use client';

import React from 'react';
import {
  Check,
  CookingPot,
  Fan,
  Beaker,
  GlassWater,
  Utensils,
  Slice,
  Carrot,
  Shield,
  Layers,
  Thermometer,
  Wrench,
} from 'lucide-react';
import { ThemePlugin } from '@/app/lib/types';
import { CUTTER_ID, CUTTER_MODES, EQUIPMENT } from '@/app/lib/equipment';
import { CloseButton } from './CloseButton';
import { CutterDisc } from './CutterDisc';

/**
 * Icônes du catalogue. Elles vivent ici plutôt que dans `equipment.ts` pour
 * garder ce dernier pur (il est aussi importé côté serveur par les routes IA).
 */
const EQUIPMENT_ICONS: Record<string, React.ElementType> = {
  varoma: CookingPot,
  'panier-cuisson': Beaker,
  fouet: Fan,
  'gobelet-doseur': GlassWater,
  spatule: Utensils,
  'decoupe-minute': Slice,
  eplucheur: Carrot,
  'couvercle-lames': Shield,
  'bol-supplementaire': Layers,
  sensor: Thermometer,
};

export const getEquipmentIcon = (id: string): React.ElementType =>
  EQUIPMENT_ICONS[id] || Wrench;

interface EquipmentModalProps {
  ownedEquipment: string[];
  toggleEquipment: (id: string) => void;
  onClose: () => void;
  theme: ThemePlugin;
  t: (dark: string, light: string) => string;
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  ownedEquipment,
  toggleEquipment,
  onClose,
  theme,
  t,
}) => {
  const hasCutter = ownedEquipment.includes(CUTTER_ID);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Configurer le matériel"
        className={`w-full max-w-lg max-h-[85vh] flex flex-col ${theme.properties.radius} shadow-2xl overflow-hidden ${t('bg-gray-900 border border-gray-700 text-white', 'bg-white border border-gray-200 text-gray-900')}`}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-3 p-4 border-b shrink-0 ${t('border-gray-800', 'border-gray-100')}`}
        >
          <Wrench size={18} className={theme.colors.accent} />
          <div className="flex-1">
            <h3 className="font-bold text-sm">Mon matériel</h3>
            <p className={`text-xs ${t('text-gray-500', 'text-gray-400')}`}>
              {ownedEquipment.length} accessoire
              {ownedEquipment.length > 1 ? 's' : ''} configuré
              {ownedEquipment.length > 1 ? 's' : ''}
            </p>
          </div>
          <CloseButton onClose={onClose} t={t} />
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {EQUIPMENT.map(item => {
            const Icon = getEquipmentIcon(item.id);
            const isOwned = ownedEquipment.includes(item.id);

            return (
              <button
                key={item.id}
                onClick={() => toggleEquipment(item.id)}
                aria-pressed={isOwned}
                className={`w-full flex items-center gap-3 p-3 text-left border transition-all ${theme.properties.radius} ${
                  isOwned
                    ? t(theme.colors.checkedBgDark, theme.colors.checkedBgLight)
                    : t(
                        'bg-gray-800/30 border-gray-700/50 text-gray-400 hover:bg-gray-800',
                        'bg-gray-50/50 border-gray-200 text-gray-500 hover:bg-white',
                      )
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isOwned
                      ? `${theme.colors.bgPrimary} text-white`
                      : t('bg-gray-700/50', 'bg-gray-200')
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs opacity-70 truncate">
                    {item.description}
                  </p>
                </div>
                <div
                  className={`w-6 h-6 border-2 flex items-center justify-center shrink-0 ${theme.properties.radius} ${
                    isOwned
                      ? `${theme.colors.bgPrimary} ${theme.colors.borderAccent} text-white`
                      : t('border-gray-600', 'border-gray-300')
                  }`}
                >
                  {isOwned && <Check size={14} strokeWidth={3} />}
                </div>
              </button>
            );
          })}

          {/* Rappel des 4 modes du Découpe-minute */}
          {hasCutter && (
            <div
              className={`p-3 border ${theme.properties.radius} ${t('bg-gray-800/30 border-gray-700/50', 'bg-gray-50 border-gray-200')}`}
            >
              <p
                className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${t('text-gray-500', 'text-gray-400')}`}
              >
                Découpe-minute · 4 modes de coupe
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CUTTER_MODES.map(mode => (
                  <div
                    key={mode.id}
                    className={`flex items-center gap-2 p-2 ${theme.properties.radius} ${t('bg-gray-900/50', 'bg-white')}`}
                  >
                    <CutterDisc
                      mode={mode.id}
                      size={32}
                      className={theme.colors.accent}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{mode.name}</p>
                      <p
                        className={`text-[10px] truncate ${t('text-gray-500', 'text-gray-400')}`}
                      >
                        {mode.speed}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-3 border-t shrink-0 text-xs ${t('border-gray-800 text-gray-500', 'border-gray-100 text-gray-400')}`}
        >
          L&apos;assistant IA ne proposera que des étapes réalisables avec ce
          matériel.
        </div>
      </div>
    </div>
  );
};
