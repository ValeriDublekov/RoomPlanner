import React, { useEffect, useRef } from 'react';
import { Rect, Line, Group, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { FurnitureObject } from '../../types';

interface FurnitureItemProps {
  shape: FurnitureObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<FurnitureObject>) => void;
  onStartChange: () => void;
  scale: number;
  pixelsPerCm: number;
  isLocked?: boolean;
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
}) => {
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const newAttrs: Partial<FurnitureObject> = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: node.width() * node.scaleX(),
      height: node.height() * node.scaleY(),
    };

    // Reset scale to 1 and apply to width/height
    node.scaleX(1);
    node.scaleY(1);

    onChange(newAttrs);
  };

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        rotation={shape.rotation}
        draggable={isSelected && !isLocked}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onStartChange}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformStart={onStartChange}
        onTransformEnd={handleTransformEnd}
        listening={!isLocked}
      >
        {shape.type === 'box' ? (
          <Rect
            width={shape.width}
            height={shape.height}
            fill="#f8fafc"
            stroke={isSelected ? "#4f46e5" : "#cbd5e1"}
            strokeWidth={2 / scale}
            cornerRadius={4 / scale}
            shadowBlur={isSelected ? 10 / scale : 0}
            shadowColor="#4f46e5"
            shadowOpacity={0.2}
          />
        ) : (
          <Line
            points={shape.points?.flatMap((p) => [p.x, p.y]) || []}
            closed={true}
            fill="#f8fafc"
            stroke={isSelected ? "#4f46e5" : "#cbd5e1"}
            strokeWidth={2 / scale}
            shadowBlur={isSelected ? 10 / scale : 0}
            shadowColor="#4f46e5"
            shadowOpacity={0.2}
          />
        )}

        {/* Dimensions Text */}
        <Text
          text={`${shape.name}\n${(shape.width / pixelsPerCm).toFixed(0)} x ${(
            shape.height / pixelsPerCm
          ).toFixed(0)} cm`}
          width={shape.width}
          height={shape.height}
          align="center"
          verticalAlign="middle"
          fontSize={10 / scale}
          fill="#64748b"
          fontStyle="bold"
          listening={false}
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-center',
            'top-right',
            'middle-right',
            'middle-left',
            'bottom-left',
            'bottom-center',
            'bottom-right',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
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
