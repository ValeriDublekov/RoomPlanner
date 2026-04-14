import React from 'react';
import { Rect, Line as KonvaLine, Ellipse, Path, Group, Text } from 'react-konva';
import Konva from 'konva';
import { FurnitureObject } from '../../types';

interface FurnitureRendererProps {
  shape: FurnitureObject;
  isSelected: boolean;
  isColliding: boolean;
  scale: number;
  pixelsPerCm: number;
}

export const FurnitureRenderer: React.FC<FurnitureRendererProps> = ({
  shape,
  isSelected,
  isColliding,
  scale,
  pixelsPerCm,
}) => {
  const isGroup = shape.type === 'group';

  if (isGroup) {
    return (
      <Group>
        {shape.children?.map((child) => (
          <Group
            key={child.id}
            x={child.x}
            y={child.y}
            width={child.width}
            height={child.height}
            rotation={child.rotation}
          >
            <Rect
              width={child.width}
              height={child.height}
              fill={child.color || "#f8fafc"}
              stroke="#cbd5e1"
              strokeWidth={1 / scale}
              cornerRadius={4 / scale}
            />
            {child.svgPath && (() => {
              const tempPath = new Konva.Path({ data: child.svgPath });
              const pathRect = tempPath.getSelfRect();
              const sX = child.width / (pathRect.width || 100);
              const sY = child.height / (pathRect.height || 100);
              return (
                <Path
                  data={child.svgPath}
                  fill={child.color || "#f8fafc"}
                  stroke="#64748b"
                  strokeWidth={1 / (scale * sX)}
                  scaleX={sX}
                  scaleY={sY}
                  x={-pathRect.x * sX}
                  y={-pathRect.y * sY}
                />
              );
            })()}
          </Group>
        ))}
        <Rect
          width={shape.width}
          height={shape.height}
          stroke={isSelected ? "#4f46e5" : "transparent"}
          strokeWidth={1 / scale}
          dash={[5 / scale, 5 / scale]}
        />
      </Group>
    );
  }

  return (
    <>
      <Rect
        width={shape.width}
        height={shape.height}
        fill={isColliding ? "rgba(239, 68, 68, 0.1)" : (
          shape.svgPath ? "transparent" : (
            (shape.furnitureType === 'bed' || shape.furnitureType === 'wardrobe' || shape.furnitureType === 'dresser') 
              ? (shape.secondaryColor || "#f8fafc") 
              : (shape.color || "#f8fafc")
          )
        )}
        stroke={isColliding ? "#ef4444" : (isSelected ? "#4f46e5" : (
          (shape.furnitureType === 'bed' || shape.furnitureType === 'wardrobe' || shape.furnitureType === 'dresser')
            ? (shape.color || "#cbd5e1")
            : "#cbd5e1"
        ))}
        strokeWidth={(shape.furnitureType === 'bed' || shape.furnitureType === 'wardrobe' || shape.furnitureType === 'dresser') ? 4 / scale : 2 / scale}
        cornerRadius={4 / scale}
        shadowBlur={isSelected ? 10 / scale : 0}
        shadowColor={isColliding ? "#ef4444" : "#4f46e5"}
        shadowOpacity={0.2}
        opacity={shape.svgPath ? 0.2 : 1}
      />

      {shape.svgPath && (() => {
        const tempPath = new Konva.Path({ data: shape.svgPath });
        const pathRect = tempPath.getSelfRect();
        const sX = shape.width / (pathRect.width || 100);
        const sY = shape.height / (pathRect.height || 100);
        
        const isTwoColor = shape.furnitureType === 'bed' || shape.furnitureType === 'wardrobe' || shape.furnitureType === 'dresser';
        const fillColor = isTwoColor ? (shape.secondaryColor || "#f8fafc") : (shape.color || "#f8fafc");
        const strokeColor = isTwoColor ? (shape.color || "#64748b") : (isSelected ? "#4f46e5" : "#64748b");

        return (
          <Path
            data={shape.svgPath}
            fill={isColliding ? "rgba(239, 68, 68, 0.2)" : fillColor}
            stroke={isColliding ? "#ef4444" : strokeColor}
            strokeWidth={(isTwoColor ? 2 : 1.5) / (scale * sX)}
            scaleX={sX}
            scaleY={sY}
            x={-pathRect.x * sX}
            y={-pathRect.y * sY}
          />
        );
      })()}

      {!shape.svgPath && shape.type === 'circle' && (
        <Ellipse
          x={shape.width / 2}
          y={shape.height / 2}
          radiusX={shape.width / 2}
          radiusY={shape.height / 2}
          fill={isColliding ? "rgba(239, 68, 68, 0.1)" : (shape.color || "#f8fafc")}
          stroke={isColliding ? "#ef4444" : (isSelected ? "#4f46e5" : "#cbd5e1")}
          strokeWidth={2 / scale}
          shadowBlur={isSelected ? 10 / scale : 0}
          shadowColor={isColliding ? "#ef4444" : "#4f46e5"}
          shadowOpacity={0.2}
        />
      )}

      {!shape.svgPath && shape.type === 'polygon' && (
        <KonvaLine
          points={shape.points?.flatMap((p) => [p.x, p.y]) || []}
          closed={true}
          fill={isColliding ? "rgba(239, 68, 68, 0.1)" : (shape.color || "#f8fafc")}
          stroke={isColliding ? "#ef4444" : (isSelected ? "#4f46e5" : "#cbd5e1")}
          strokeWidth={2 / scale}
          shadowBlur={isSelected ? 10 / scale : 0}
          shadowColor={isColliding ? "#ef4444" : "#4f46e5"}
          shadowOpacity={0.2}
        />
      )}

      {/* Dimensions Text */}
      {(() => {
        const normRot = (shape.rotation % 360 + 360) % 360;
        let textRotation = 0;
        if (normRot > 90 && normRot <= 270) {
          textRotation = 180;
        }

        return (
          <Group x={shape.width / 2} y={shape.height / 2} rotation={textRotation}>
            <Text
              text={`${shape.name}\n${(shape.width / pixelsPerCm).toFixed(0)} x ${(shape.height / pixelsPerCm).toFixed(0)} cm`}
              width={shape.width * 0.9}
              offsetX={shape.width * 0.45}
              offsetY={10 / scale}
              align="center"
              fontSize={10 / scale}
              fill="#64748b"
              fontStyle="bold"
              listening={false}
            />
          </Group>
        );
      })()}

      {/* Face Indicator */}
      {(shape.furnitureType === 'wardrobe' || shape.furnitureType === 'dresser' || shape.furnitureType === 'desk' || shape.furnitureType === 'bed') && (
        <Group>
          <KonvaLine
            points={[5 / scale, shape.height - 2 / scale, shape.width - 5 / scale, shape.height - 2 / scale]}
            stroke="#4f46e5"
            strokeWidth={3 / scale}
            opacity={0.6}
          />
          {shape.furnitureType === 'wardrobe' && (
            <KonvaLine
              points={[shape.width / 2, shape.height - 8 / scale, shape.width / 2, shape.height]}
              stroke="#4f46e5"
              strokeWidth={1 / scale}
              opacity={0.4}
            />
          )}
        </Group>
      )}

      {/* Shelf Dividers */}
      {shape.furnitureType === 'shelf' && !shape.svgPath && (
        <Group>
          {(() => {
            const widthCm = shape.width / pixelsPerCm;
            const numDividers = Math.floor(widthCm / 30);
            const dividers = [];
            if (numDividers > 0) {
              const spacing = shape.width / (numDividers + 1);
              for (let i = 1; i <= numDividers; i++) {
                dividers.push(
                  <KonvaLine
                    key={i}
                    points={[i * spacing, 0, i * spacing, shape.height]}
                    stroke="#cbd5e1"
                    strokeWidth={1 / scale}
                  />
                );
              }
            }
            return dividers;
          })()}
        </Group>
      )}
    </>
  );
};
