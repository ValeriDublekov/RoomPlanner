import React from 'react';
import { Layer, Line, Text } from 'react-konva';
import { useStore } from '../../../store';
import { getDistance } from '../../../lib/geometry';
import { DimensionItem } from '../DimensionItem';

interface AnnotationOverlayProps {
  scale: number;
  snappedMouse: { x: number; y: number };
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  scale,
  snappedMouse,
}) => {
  const {
    activeLayer,
    mode,
    setMode,
    dimensions: savedDimensions,
    selectedDimensionId,
    setSelectedDimensionId,
    pixelsPerCm: pixelsPerCmVal,
    measurePoints,
  } = useStore();

  const dimensionElements = React.useMemo(() => savedDimensions.map((dim) => (
    <DimensionItem
      key={dim.id}
      dimension={dim}
      pixelsPerCm={pixelsPerCmVal}
      scale={scale}
      isSelected={selectedDimensionId === dim.id}
      onSelect={() => {
        if (activeLayer === 'furniture') {
          setSelectedDimensionId(dim.id);
          if (mode !== 'select') setMode('select');
        }
      }}
      isLocked={activeLayer !== 'furniture'}
    />
  )), [savedDimensions, pixelsPerCmVal, scale, selectedDimensionId, setSelectedDimensionId, setMode, mode, activeLayer]);

  return (
    <Layer id="annotation-layer" visible={activeLayer !== 'blueprint'}>
      {/* 7. Annotations */}
      {dimensionElements}
      {(mode === 'measure' || mode === 'dimension') && measurePoints.length === 1 && (
        <>
          <Line
            points={[measurePoints[0].x, measurePoints[0].y, snappedMouse.x, snappedMouse.y]}
            stroke={mode === 'measure' ? "#f43f5e" : "#6366f1"}
            strokeWidth={2 / scale}
            dash={[5 / scale, 5 / scale]}
          />
          <Text
            text={`${(getDistance(measurePoints[0], snappedMouse) / pixelsPerCmVal).toFixed(1)} cm`}
            x={(measurePoints[0].x + snappedMouse.x) / 2}
            y={(measurePoints[0].y + snappedMouse.y) / 2 - 20 / scale}
            fontSize={14 / scale}
            fill={mode === 'measure' ? "#f43f5e" : "#6366f1"}
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </>
      )}
    </Layer>
  );
};
