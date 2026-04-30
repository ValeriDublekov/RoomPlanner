import React, { useEffect, useRef } from 'react';
import { Group, Transformer, Line as KonvaLine, Text, Ellipse } from 'react-konva';
import Konva from 'konva';
import { FurnitureObject, RoomObject } from '@/src/types';
import { useStore } from '@/src/store';
import { useFurnitureInteraction } from '@/src/hooks';
import { FurnitureRenderer } from './FurnitureRenderer';

interface FurnitureItemProps {
  shape: FurnitureObject;
  isSelected: boolean;
  onSelect: (multi?: boolean) => void;
  onChange: (newAttrs: Partial<FurnitureObject>) => void;
  onStartChange: () => void;
  scale: number;
  pixelsPerCm: number;
  isLocked?: boolean;
  rooms?: RoomObject[];
  allFurniture?: FurnitureObject[];
}

export const FurnitureItem: React.FC<FurnitureItemProps> = ({
  shape,
  isSelected,
  onSelect,
  onChange,
  onStartChange,
  scale,
  pixelsPerCm,
  isLocked,
  rooms = [],
  allFurniture = [],
}) => {
  const orthoMode = useStore(state => state.orthoMode);
  const mode = useStore(state => state.mode);
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const {
    dragDistances,
    setDragDistances,
    isColliding,
    setIsColliding,
    handleDragMove
  } = useFurnitureInteraction(shape, rooms, allFurniture, pixelsPerCm, scale, onChange);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    let rotation = node.rotation();
    if (orthoMode) {
      rotation = Math.round(rotation / 90) * 90;
    }

    const newWidth = node.width() * node.scaleX();
    const newHeight = node.height() * node.scaleY();

    const newAttrs: Partial<FurnitureObject> = {
      x: node.x() - newWidth / 2,
      y: node.y() - newHeight / 2,
      rotation: rotation,
      width: newWidth,
      height: newHeight,
    };

    node.scaleX(1);
    node.scaleY(1);
    onChange(newAttrs);
  };

  const isGroup = shape.type === 'group';

  return (
    <React.Fragment>
      {dragDistances.map((d, i) => (
        <Group key={i}>
          <KonvaLine
            points={[d.p1.x, d.p1.y, d.p2.x, d.p2.y]}
            stroke="#6366f1"
            strokeWidth={1 / scale}
            dash={[4 / scale, 4 / scale]}
          />
          <Text
            text={`${(d.dist / pixelsPerCm).toFixed(1)} cm`}
            x={(d.p1.x + d.p2.x) / 2}
            y={(d.p1.y + d.p2.y) / 2}
            fontSize={10 / scale}
            fill="#4f46e5"
            fontStyle="bold"
            align="center"
          />
        </Group>
      ))}
      <Group
        ref={shapeRef}
        id={shape.id}
        x={shape.x + shape.width / 2}
        y={shape.y + shape.height / 2}
        width={shape.width}
        height={shape.height}
        offsetX={shape.width / 2}
        offsetY={shape.height / 2}
        rotation={shape.rotation}
        draggable={!isLocked && mode === 'select'}
        onClick={(e) => {
          if (e.evt.button !== 0 || mode !== 'select') return;
          e.cancelBubble = true;
          onSelect(e.evt.ctrlKey || e.evt.metaKey);
        }}
        onTap={(e) => {
          if (mode !== 'select') return;
          e.cancelBubble = true;
          onSelect(e.evt.ctrlKey || e.evt.metaKey);
        }}
        onDragStart={(e) => {
          if (e.evt.button !== 0 || mode !== 'select') return;
          if (e.target === shapeRef.current) {
            onSelect(e.evt.ctrlKey || e.evt.metaKey);
            onStartChange();
          }
        }}
        onDragMove={handleDragMove}
        onDragEnd={(e) => {
          if (e.target === shapeRef.current) {
            setDragDistances([]);
            setIsColliding(false);
            onChange({
              x: e.target.x() - shape.width / 2,
              y: e.target.y() - shape.height / 2,
            });
          }
        }}
        onTransformStart={onStartChange}
        onTransformEnd={handleTransformEnd}
        listening={!isLocked}
      >
        <FurnitureRenderer
          shape={shape}
          isSelected={isSelected}
          isColliding={isColliding}
          scale={scale}
          pixelsPerCm={pixelsPerCm}
        />

        {/* Quick Rotation Buttons */}
        {isSelected && !isGroup && (
          <Group y={-30 / scale} x={shape.width / 2 - 25 / scale}>
            <Group 
              onClick={(e) => {
                e.cancelBubble = true;
                onStartChange();
                onChange({ rotation: (shape.rotation - 90) % 360 });
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                onStartChange();
                onChange({ rotation: (shape.rotation - 90) % 360 });
              }}
            >
              <Ellipse
                radiusX={10 / scale}
                radiusY={10 / scale}
                fill="white"
                stroke="#4f46e5"
                strokeWidth={1 / scale}
                shadowBlur={5 / scale}
                shadowOpacity={0.1}
              />
              <Text
                text="↺"
                fontSize={14 / scale}
                fill="#4f46e5"
                x={-6 / scale}
                y={-8 / scale}
                fontStyle="bold"
              />
            </Group>
            <Group 
              x={30 / scale}
              onClick={(e) => {
                e.cancelBubble = true;
                onStartChange();
                onChange({ rotation: (shape.rotation + 90) % 360 });
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                onStartChange();
                onChange({ rotation: (shape.rotation + 90) % 360 });
              }}
            >
              <Ellipse
                radiusX={10 / scale}
                radiusY={10 / scale}
                fill="white"
                stroke="#4f46e5"
                strokeWidth={1 / scale}
                shadowBlur={5 / scale}
                shadowOpacity={0.1}
              />
              <Text
                text="↻"
                fontSize={14 / scale}
                fill="#4f46e5"
                x={-6 / scale}
                y={-8 / scale}
                fontStyle="bold"
              />
            </Group>
          </Group>
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-right', 'middle-left',
            'bottom-left', 'bottom-center', 'bottom-right',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
          anchorSize={8 / scale}
          borderStroke="#4f46e5"
          anchorStroke="#4f46e5"
          anchorFill="white"
        />
      )}
    </React.Fragment>
  );
};
