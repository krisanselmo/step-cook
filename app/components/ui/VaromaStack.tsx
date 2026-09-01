'use client';

import React from 'react';

interface VaromaStackProps {
  size?: number;
  /** Colour class; drawn in `currentColor`. */
  className?: string;
  /** Animates the steam while the step timer runs. */
  steaming?: boolean;
}

/** The Varoma stacked on the bowl, seen from the front. */
export const VaromaStack: React.FC<VaromaStackProps> = ({
  size = 88,
  className = '',
  steaming = false,
}) => (
  <svg
    viewBox="0 0 120 132"
    width={size}
    height={(size * 132) / 120}
    aria-hidden="true"
    className={className}
  >
    {/* Vapeur */}
    <g
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    >
      {[
        { d: 'M42 30 q -7 -9 0 -17 q 7 -8 0 -13', delay: '0s' },
        { d: 'M60 26 q -7 -9 0 -17 q 7 -8 0 -13', delay: '0.7s' },
        { d: 'M78 30 q -7 -9 0 -17 q 7 -8 0 -13', delay: '1.4s' },
      ].map(wisp => (
        <path
          key={wisp.d}
          d={wisp.d}
          className={steaming ? 'animate-steam' : ''}
          style={steaming ? { animationDelay: wisp.delay } : undefined}
        />
      ))}
    </g>

    {/* Couvercle du Varoma */}
    <path
      d="M24 50 q 36 -18 72 0 z"
      fill="currentColor"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinejoin="round"
    />

    {/* Récipient Varoma — plus large que le bol */}
    <path
      d="M24 54 h72 l-8 28 h-56 z"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    {/* Plateau vapeur, glissé dans le récipient */}
    <line
      x1="30"
      y1="66"
      x2="90"
      y2="66"
      stroke="currentColor"
      strokeWidth="3"
      strokeDasharray="7 5"
      opacity="0.85"
    />

    {/* Couvercle du bol, sur lequel repose le Varoma */}
    <rect
      x="38"
      y="84"
      width="44"
      height="6"
      rx="3"
      fill="currentColor"
      fillOpacity="0.3"
      stroke="currentColor"
      strokeWidth="3"
    />

    {/* Bol du robot */}
    <path
      d="M40 92 h40 l-6 32 h-28 z"
      fill="currentColor"
      fillOpacity="0.08"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    {/* Niveau d'eau */}
    <line
      x1="47"
      y1="112"
      x2="73"
      y2="112"
      stroke="currentColor"
      strokeWidth="3"
      opacity="0.55"
    />
  </svg>
);
