import React from 'react';
import { Group, Line, Circle, Text } from 'react-konva';
import { Vector2d, AppMode } from '../../types';
import { getDistance, formatDistance } from '../../lib/geometry';

interface DrawingLayerProps {
  mode: AppMode;
  roomPoints: Vector2d[];
  snappedMouse: Vector2d;
  mousePos: Vector2d;
  calibrationPoints: Vector2d[] | null;
  scale: number;
  pixelsPerCm: number;
}

export const DrawingLayer: React.FC<DrawingLayerProps> = ({
  mode,
  roomPoints,
  snappedMouse,
  mousePos,
  calibrationPoints,
  scale,
  pixelsPerCm,
}) => {
  const isDrawing = (mode === 'draw-room' || mode === 'draw-furniture' || mode === 'draw-beam') && roomPoints.length > 0;
  const isStartingBeam = mode === 'draw-beam' && roomPoints.length === 0;
  
  const isDragDrawing = (mode === 'add-box' || mode === 'draw-circle') && roomPoints.length === 1;
  const isCalibrating = mode === 'calibrate' && calibrationPoints && calibrationPoints.length === 1;
  const isActive = isDrawing || isDragDrawing || isCalibrating || isStartingBeam;

  return (
    <Group listening={isActive}>
      {/* Start cursor for beam */}
      {isStartingBeam && (
        <Circle x={snappedMouse.x} y={snappedMouse.y} radius={4 / scale} fill="#6366f1" stroke="white" strokeWidth={1/scale} />
      )}
      {/* Drag-to-draw preview for furniture */}
      {isDragDrawing && (
        <Group>
          <Line
            points={[
              roomPoints[0].x, roomPoints[0].y,
              snappedMouse.x, roomPoints[0].y,
              snappedMouse.x, snappedMouse.y,
              roomPoints[0].x, snappedMouse.y,
              roomPoints[0].x, roomPoints[0].y
            ]}
            stroke="#6366f1"
            strokeWidth={2 / scale}
            dash={[5 / scale, 5 / scale]}
          />
          <Text
            x={Math.min(roomPoints[0].x, snappedMouse.x)}
            y={Math.min(roomPoints[0].y, snappedMouse.y) - 20 / scale}
            text={`${(Math.abs(snappedMouse.x - roomPoints[0].x) / pixelsPerCm).toFixed(1)} x ${(Math.abs(snappedMouse.y - roomPoints[0].y) / pixelsPerCm).toFixed(1)} cm`}
            fontSize={12 / scale}
            fill="#4f46e5"
            fontStyle="bold"
          />
        </Group>
      )}

      {/* Current Drawing (Room or Furniture or Beam) */}
      {isDrawing && (
        <Group>
          {mode === 'draw-beam' ? (
            <Line
              points={[roomPoints[0].x, roomPoints[0].y, snappedMouse.x, snappedMouse.y]}
              stroke="#6366f1"
              strokeWidth={20 / scale} // Placeholder for beam width preview if possible, or just a line
              lineJoin="round"
              lineCap="round"
              opacity={0.5}
            />
          ) : (
            <Line
              points={[...roomPoints.flatMap((p) => [p.x, p.y]), snappedMouse.x, snappedMouse.y]}
              stroke="#6366f1"
              strokeWidth={2 / scale}
              lineJoin="round"
              lineCap="round"
            />
          )}

          {roomPoints.map((p, i) => (
            <Circle
              key={i}
              x={p.x}
              y={p.y}
              radius={i === 0 ? 6 / scale : 3 / scale}
              fill="#4f46e5"
              stroke={i === 0 ? "white" : "none"}
              strokeWidth={i === 0 ? 2 / scale : 0}
            />
          ))}
          {/* Live Distance Label */}
          <Text
            x={snappedMouse.x + 10 / scale}
            y={snappedMouse.y + 10 / scale}
            text={formatDistance(
              getDistance(snappedMouse, roomPoints[roomPoints.length - 1]),
              pixelsPerCm
            )}
            fontSize={12 / scale}
            fill="#4f46e5"
            fontStyle="bold"
          />
        </Group>
      )}

      {/* Calibration Preview */}
      {isCalibrating && (
        <Group>
          <Line
            points={[calibrationPoints![0].x, calibrationPoints![0].y, mousePos.x, mousePos.y]}
            stroke="#6366f1"
            strokeWidth={2 / scale}
            dash={[5 / scale, 5 / scale]}
          />
          <Circle x={calibrationPoints![0].x} y={calibrationPoints![0].y} radius={4 / scale} fill="#6366f1" />
        </Group>
      )}
    </Group>
  );
};
