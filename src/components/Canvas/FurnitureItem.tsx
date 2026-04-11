import React, { useEffect, useRef, useState } from 'react';
import { Rect, Line, Group, Text, Transformer, Line as KonvaLine, Ellipse, Path } from 'react-konva';
import Konva from 'konva';
import { FurnitureObject, RoomObject, Vector2d } from '../../types';
import { useStore } from '../../store';
import { 
  getDistanceToSegment, 
  getFurnitureVertices, 
  checkPolygonsIntersect, 
  checkPolygonLineIntersect,
  checkCirclePolygonIntersect,
  checkCircleLineIntersect,
  checkCirclesIntersect
} from '../../lib/geometry';

interface FurnitureItemProps {
  shape: FurnitureObject;
  isSelected: boolean;
  onSelect: () => void;
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
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [dragDistances, setDragDistances] = useState<{ p1: Vector2d, p2: Vector2d, dist: number }[]>([]);
  const [isColliding, setIsColliding] = useState(false);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!rooms.length) return;

    const node = e.target;
    const x = node.x();
    const y = node.y();
    const w = shape.width;
    const h = shape.height;

    // Center of the object
    const center = { x: x + w / 2, y: y + h / 2 };
    
    // Find nearest walls for each side
    const sides = [
      { x: x + w / 2, y: y }, // Top
      { x: x + w / 2, y: y + h }, // Bottom
      { x: x, y: y + h / 2 }, // Left
      { x: x + w, y: y + h / 2 }, // Right
    ];

    const newDistances: { p1: Vector2d, p2: Vector2d, dist: number }[] = [];

    sides.forEach(side => {
      let minWallDist = Infinity;
      let nearestPoint = side;

      rooms.forEach(room => {
        for (let i = 0; i < room.points.length; i++) {
          const p1 = room.points[i];
          const p2 = room.points[(i + 1) % room.points.length];
          const result = getDistanceToSegment(side, p1, p2);
          if (typeof result === 'object' && result.distance < minWallDist) {
            minWallDist = result.distance;
            nearestPoint = result.point;
          }
        }
      });

      if (minWallDist < 200) { // Only show if reasonably close
        newDistances.push({ p1: side, p2: nearestPoint, dist: minWallDist });
      }
    });

    setDragDistances(newDistances);

    // Collision Detection
    let colliding = false;

    if (shape.type === 'circle') {
      const radius = Math.max(shape.width, shape.height) / 2;
      const center = { x: node.x() + shape.width / 2, y: node.y() + shape.height / 2 };

      // Check against other furniture
      for (const other of allFurniture) {
        if (other.id === shape.id) continue;
        
        if (other.type === 'circle') {
          const otherRadius = Math.max(other.width, other.height) / 2;
          const otherCenter = { x: other.x + other.width / 2, y: other.y + other.height / 2 };
          if (checkCirclesIntersect(center, radius, otherCenter, otherRadius)) {
            colliding = true;
            break;
          }
        } else {
          const otherVertices = getFurnitureVertices(other);
          if (checkCirclePolygonIntersect(center, radius, otherVertices)) {
            colliding = true;
            break;
          }
        }
      }

      // Check against walls
      if (!colliding) {
        for (const room of rooms) {
          for (let i = 0; i < room.points.length; i++) {
            const p1 = room.points[i];
            const p2 = room.points[(i + 1) % room.points.length];
            if (checkCircleLineIntersect(center, radius, p1, p2)) {
              colliding = true;
              break;
            }
          }
          if (colliding) break;
        }
      }
    } else {
      const currentVertices = getFurnitureVertices({
        x: node.x(),
        y: node.y(),
        width: shape.width,
        height: shape.height,
        rotation: node.rotation()
      });

      // Check against other furniture
      for (const other of allFurniture) {
        if (other.id === shape.id) continue;
        
        if (other.type === 'circle') {
          const otherRadius = Math.max(other.width, other.height) / 2;
          const otherCenter = { x: other.x + other.width / 2, y: other.y + other.height / 2 };
          if (checkCirclePolygonIntersect(otherCenter, otherRadius, currentVertices)) {
            colliding = true;
            break;
          }
        } else {
          const otherVertices = getFurnitureVertices(other);
          if (checkPolygonsIntersect(currentVertices, otherVertices)) {
            colliding = true;
            break;
          }
        }
      }

      // Check against walls
      if (!colliding) {
        for (const room of rooms) {
          for (let i = 0; i < room.points.length; i++) {
            const p1 = room.points[i];
            const p2 = room.points[(i + 1) % room.points.length];
            if (checkPolygonLineIntersect(currentVertices, p1, p2)) {
              colliding = true;
              break;
            }
          }
          if (colliding) break;
        }
      }
    }

    setIsColliding(colliding);
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    let rotation = node.rotation();
    if (orthoMode) {
      rotation = Math.round(rotation / 90) * 90;
    }

    const newAttrs: Partial<FurnitureObject> = {
      x: node.x(),
      y: node.y(),
      rotation: rotation,
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
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        rotation={shape.rotation}
        draggable={!isLocked}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={() => {
          onSelect();
          onStartChange();
        }}
        onDragMove={handleDragMove}
        onDragEnd={(e) => {
          setDragDistances([]);
          setIsColliding(false);
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformStart={onStartChange}
        onTransformEnd={handleTransformEnd}
        listening={!isLocked}
      >
        {/* Bounding Box for hit detection and visual feedback */}
        <Rect
          width={shape.width}
          height={shape.height}
          fill={isColliding ? "rgba(239, 68, 68, 0.1)" : (shape.svgPath ? "transparent" : (shape.color || "#f8fafc"))}
          stroke={isColliding ? "#ef4444" : (isSelected ? "#4f46e5" : "#cbd5e1")}
          strokeWidth={2 / scale}
          cornerRadius={4 / scale}
          shadowBlur={isSelected ? 10 / scale : 0}
          shadowColor={isColliding ? "#ef4444" : "#4f46e5"}
          shadowOpacity={0.2}
          opacity={shape.svgPath ? 0.2 : 1}
        />

        {shape.svgPath && (() => {
          // Use a temporary path to get the bounding box of the data
          const tempPath = new Konva.Path({ data: shape.svgPath });
          const pathRect = tempPath.getSelfRect();
          const sX = shape.width / (pathRect.width || 100);
          const sY = shape.height / (pathRect.height || 100);
          return (
            <Path
              data={shape.svgPath}
              fill={isColliding ? "rgba(239, 68, 68, 0.2)" : (shape.color || "#f8fafc")}
              stroke={isColliding ? "#ef4444" : (isSelected ? "#4f46e5" : "#64748b")}
              strokeWidth={1.5 / (scale * sX)}
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
          <Line
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
