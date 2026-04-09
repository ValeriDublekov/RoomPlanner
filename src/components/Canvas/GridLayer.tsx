import React from 'react';
import { Vector2d } from '../../types';

interface GridLayerProps {
  scale: number;
  position: Vector2d;
}

export const GridLayer: React.FC<GridLayerProps> = ({ scale, position }) => {
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
          ${10 * scale}px ${10 * scale}px,
          ${10 * scale}px ${10 * scale}px,
          ${50 * scale}px ${50 * scale}px,
          ${50 * scale}px ${50 * scale}px
        `,
        backgroundPosition: `${position.x}px ${position.y}px`,
      }}
    />
  );
};
