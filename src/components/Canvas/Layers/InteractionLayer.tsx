import React from 'react';
import { Layer, Group } from 'react-konva';
import { useStore } from '../../../store';
import { DrawingLayer } from '../DrawingLayer';
import { FurnitureRenderer } from '../FurnitureRenderer';
import { AppMode } from '../../../types';

interface InteractionLayerProps {
  mode: AppMode;
  snappedMouse: { x: number; y: number };
  mousePos: { x: number; y: number };
  scale: number;
}

export const InteractionLayer: React.FC<InteractionLayerProps> = ({
  mode,
  snappedMouse,
  mousePos,
  scale,
}) => {
  const {
    roomPoints,
    calibrationPoints,
    pixelsPerCm: pixelsPerCmVal,
    pendingFurniture
  } = useStore();

  return (
    <Layer id="interaction-layer">
      <DrawingLayer
        mode={mode}
        roomPoints={roomPoints}
        snappedMouse={snappedMouse}
        mousePos={mousePos}
        calibrationPoints={calibrationPoints}
        scale={scale}
        pixelsPerCm={pixelsPerCmVal}
      />
      {mode === 'place-furniture' && pendingFurniture && (
        <Group
          x={snappedMouse.x}
          y={snappedMouse.y}
          rotation={pendingFurniture.rotation}
          offsetX={pendingFurniture.width / 2}
          offsetY={pendingFurniture.height / 2}
          opacity={0.6}
          listening={false}
        >
          <FurnitureRenderer
            shape={{ ...pendingFurniture, id: 'preview' } as any}
            isSelected={false}
            isColliding={false}
            scale={scale}
            pixelsPerCm={pixelsPerCmVal}
          />
        </Group>
      )}
    </Layer>
  );
};
