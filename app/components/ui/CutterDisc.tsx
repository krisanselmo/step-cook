'use client';

import React from 'react';
import { CutterModeId } from '@/app/lib/equipment';

interface CutterDiscProps {
  mode: CutterModeId;
  size?: number;
  /** Colour class; the disc is drawn in `currentColor`. */
  className?: string;
  /** Spins while the step timer runs. */
  spinning?: boolean;
}

/** Slits for slicing modes, perforations for grating ones. */
export const CutterDisc: React.FC<CutterDiscProps> = ({
  mode,
  size = 64,
  className = '',
  spinning = false,
}) => {
  // Thick slices get wider, fewer slits than thin ones.
  const slits =
    mode === 'tranches-fines'
      ? [0, 90, 180, 270].map(angle => ({ angle, width: 3 }))
      : mode === 'tranches-epaisses'
        ? [0, 120, 240].map(angle => ({ angle, width: 7 }))
        : [];

  // Grating holes, spread over two rings.
  const holes: { cx: number; cy: number; r: number }[] = [];

  if (mode === 'rape-fin' || mode === 'rape-epais') {
    const isFine = mode === 'rape-fin';
    const rings = isFine
      ? [
        { radius: 18, count: 8, r: 2.2 },
        { radius: 30, count: 14, r: 2.2 },
      ]
      : [
        { radius: 20, count: 6, r: 4 },
        { radius: 33, count: 9, r: 4 },
      ];

    rings.forEach(ring => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2;

        holes.push({
          cx: 50 + Math.cos(angle) * ring.radius,
          cy: 50 + Math.sin(angle) * ring.radius,
          r: ring.r,
        });
      }
    });
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className={`${className} ${spinning ? 'animate-spin-slow' : ''}`}
    >
      {/* Corps du disque */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="4"
      />
      {/* Moyeu central */}
      <circle
        cx="50"
        cy="50"
        r="8"
        fill="currentColor"
        fillOpacity="0.35"
        stroke="currentColor"
        strokeWidth="3"
      />

      {slits.map(({ angle, width }) => (
        <rect
          key={angle}
          x={50 - width / 2}
          y="14"
          width={width}
          height="24"
          rx={width / 2}
          fill="currentColor"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}

      {holes.map((hole, i) => (
        <circle
          key={i}
          cx={hole.cx}
          cy={hole.cy}
          r={hole.r}
          fill="currentColor"
        />
      ))}
    </svg>
  );
};
