'use client';

import React from 'react';
import { X } from 'lucide-react';

/** Bouton de fermeture des panneaux (matériel, assistant). */
export const CloseButton: React.FC<{
  onClose: () => void;
  t: (dark: string, light: string) => string;
}> = ({ onClose, t }) => (
  <button
    onClick={onClose}
    aria-label="Fermer"
    className={`p-2 rounded-full ${t('hover:bg-gray-800', 'hover:bg-gray-100')}`}
  >
    <X size={18} />
  </button>
);
