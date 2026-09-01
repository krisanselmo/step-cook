'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Settings2 } from 'lucide-react';
import { ThemePlugin } from '@/app/lib/types';
import { StepAccessory } from '@/app/lib/utils';
import {
  CUTTER_ID,
  CUTTER_MODES,
  CutterModeId,
  VAROMA_ID,
  getAccessoryStepLabel,
  getEquipmentItem,
} from '@/app/lib/equipment';
import { CutterDisc } from './CutterDisc';
import { VaromaStack } from './VaromaStack';
import { getEquipmentIcon } from './EquipmentModal';

interface StepAccessoriesProps {
  accessories: StepAccessory[];
  ownedEquipment: string[];
  isTimerRunning: boolean;
  /** Opens the equipment configuration. */
  onConfigure: () => void;
  theme: ThemePlugin;
  t: (dark: string, light: string) => string;
}

/** Shown when the step needs an accessory the user has not configured. */
const MissingBanner: React.FC<{
  name: string;
  onConfigure: () => void;
  radius: string;
  t: (dark: string, light: string) => string;
}> = ({ name, onConfigure, radius, t }) => (
  <div
    className={`flex items-center gap-2 px-3 py-2 text-xs border ${radius} ${t('bg-amber-950/40 border-amber-800/60 text-amber-300', 'bg-amber-50 border-amber-200 text-amber-700')}`}
  >
    <AlertTriangle size={14} className="shrink-0" />
    <span className="flex-1 text-left">
      {name} absent de votre matériel configuré.
    </span>
    <button
      onClick={onConfigure}
      className="font-bold underline underline-offset-2 shrink-0"
    >
      Configurer
    </button>
  </div>
);

export const StepAccessories: React.FC<StepAccessoriesProps> = ({
  accessories,
  ownedEquipment,
  isTimerRunning,
  onConfigure,
  theme,
  t,
}) => {
  const varoma = accessories.find(a => a.id === VAROMA_ID);
  const cutter = accessories.find(a => a.id === CUTTER_ID);
  const others = accessories.filter(
    a => a.id !== VAROMA_ID && a.id !== CUTTER_ID,
  );

  const detectedMode = cutter?.cutterMode as CutterModeId | undefined;
  // A seed only: the user can pick another when the recipe omits it.
  const [selectedMode, setSelectedMode] = useState<CutterModeId | undefined>(
    detectedMode,
  );

  useEffect(() => {
    setSelectedMode(detectedMode);
  }, [detectedMode]);

  if (accessories.length === 0) {
    return null;
  }

  const radius = theme.properties.radius;
  const cardClass = `p-4 border ${radius} ${t('bg-gray-900/60 border-gray-800', 'bg-white border-gray-200 shadow-sm')}`;

  return (
    <div className="w-full max-w-md mx-auto mt-6 space-y-3">
      {/* --- Varoma --- */}
      {varoma && (
        <div className={cardClass}>
          <div className="flex items-center gap-4">
            <div className="text-red-500 shrink-0">
              <VaromaStack size={84} steaming={isTimerRunning} />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-red-500">
                Varoma
              </p>
              <p className="font-bold text-lg leading-tight">Cuisson vapeur</p>
              <ul
                className={`mt-2 space-y-1 text-xs ${t('text-gray-400', 'text-gray-500')}`}
              >
                <li>Répartir en une seule couche, sans boucher les trous.</li>
                <li>Plateau pour les aliments fins, récipient pour le reste.</li>
                <li>Bol rempli d&apos;eau, gobelet doseur en place.</li>
              </ul>
            </div>
          </div>
          {!ownedEquipment.includes(VAROMA_ID) && (
            <div className="mt-3">
              <MissingBanner
                name="Varoma"
                onConfigure={onConfigure}
                radius={radius}
                t={t}
              />
            </div>
          )}
        </div>
      )}

      {/* --- Découpe-minute : les 4 modes --- */}
      {cutter && (
        <div className={cardClass}>
          <div className="flex items-baseline justify-between mb-3">
            <p
              className={`text-xs font-bold uppercase tracking-widest ${theme.colors.accent}`}
            >
              Découpe-minute
            </p>
            <p className={`text-xs ${t('text-gray-500', 'text-gray-400')}`}>
              {detectedMode ? 'Mode de l’étape' : 'Mode non précisé'}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {CUTTER_MODES.map(mode => {
              const isActive = selectedMode === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  aria-pressed={isActive}
                  className={`flex flex-col items-center gap-1.5 p-2 border transition-all ${radius} ${
                    isActive
                      ? `${theme.colors.borderAccent} ${t(theme.colors.checkedBgDark, theme.colors.checkedBgLight)}`
                      : t(
                        'border-gray-800 text-gray-500 hover:bg-gray-800/50',
                        'border-gray-200 text-gray-400 hover:bg-gray-50',
                      )
                  }`}
                >
                  <CutterDisc
                    mode={mode.id}
                    size={38}
                    className={isActive ? theme.colors.accent : ''}
                    spinning={isActive && isTimerRunning}
                  />
                  <span className="text-[10px] font-medium leading-tight text-center">
                    {mode.name}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedMode && (
            <div
              className={`mt-3 text-xs text-left ${t('text-gray-400', 'text-gray-500')}`}
            >
              <p>{CUTTER_MODES.find(m => m.id === selectedMode)?.detail}</p>
              <p className="mt-1">
                Conseil :{' '}
                <span className={theme.colors.accent}>
                  {CUTTER_MODES.find(m => m.id === selectedMode)?.speed}
                </span>{' '}
                · pousser régulièrement, sans forcer.
              </p>
            </div>
          )}

          {!ownedEquipment.includes(CUTTER_ID) && (
            <div className="mt-3">
              <MissingBanner
                name="Découpe-minute"
                onConfigure={onConfigure}
                radius={radius}
                t={t}
              />
            </div>
          )}
        </div>
      )}

      {/* --- Autres accessoires : pastilles --- */}
      {others.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {others.map(accessory => {
            const item = getEquipmentItem(accessory.id);

            if (!item) {
              return null;
            }

            const Icon = getEquipmentIcon(item.id);
            const isOwned = ownedEquipment.includes(item.id);

            return (
              <button
                key={item.id}
                onClick={isOwned ? undefined : onConfigure}
                title={isOwned ? item.description : 'Matériel non configuré'}
                className={`px-3 py-1.5 flex items-center gap-2 text-xs font-medium border ${radius} ${
                  isOwned
                    ? t(
                      'bg-gray-800/50 border-gray-700 text-gray-300',
                      'bg-white border-gray-200 text-gray-600 shadow-sm',
                    )
                    : t(
                      'bg-amber-950/40 border-amber-800/60 text-amber-300',
                      'bg-amber-50 border-amber-200 text-amber-700',
                    )
                }`}
              >
                <Icon size={14} className={isOwned ? theme.colors.accent : ''} />
                {getAccessoryStepLabel(accessory)}
                {!isOwned && <Settings2 size={12} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
