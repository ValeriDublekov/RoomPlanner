import React from 'react';
import { Vector2d } from '../../types';
import { useStore } from '../../store';

interface GridLayerProps {
  scale: number;
  position: Vector2d;
}

export const GridLayer: React.FC<GridLayerProps> = ({ scale, position }) => {
  const pixelsPerCm = useStore((state) => state.pixelsPerCm);
  const grid10 = 10 * pixelsPerCm * scale;
  const grid50 = 50 * pixelsPerCm * scale;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
        `,
        backgroundSize: `
          ${grid10}px ${grid10}px,
          ${grid10}px ${grid10}px,
          ${grid50}px ${grid50}px,
          ${grid50}px ${grid50}px
        `,
        backgroundPosition: `${position.x}px ${position.y}px`,
      }}
    />
  );
};
