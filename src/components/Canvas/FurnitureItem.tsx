import React, { useEffect, useRef, useState } from 'react';
import { Rect, Line, Group, Text, Transformer, Line as KonvaLine, Ellipse, Path } from 'react-konva';
import Konva from 'konva';
import { FurnitureObject, RoomObject, Vector2d } from '../../types';
import { useStore } from '../../store';
import { 
  getDistance,
  getDistanceToSegment, 
  getFurnitureVertices, 
  rotatePoint,
  checkPolygonsIntersect, 
  checkPolygonLineIntersect,
  checkCirclePolygonIntersect,
  checkCircleLineIntersect,
  checkCirclesIntersect,
  isPointInPolygon
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
    const rotation = node.rotation();
    const wallThicknessPx = useStore.getState().wallThickness * pixelsPerCm;
    const halfWall = wallThicknessPx / 2;
    const snapThreshold = 15 / scale;
    
    let currentX = x;
    let currentY = y;
    let snappedWallIds = new Set<string>();

    // We do up to 2 passes to handle corners (snapping to two different walls)
    for (let pass = 0; pass < 2; pass++) {
      let bestSnap = null;
      let minSnapDist = Infinity;

      const pivot = { x: currentX, y: currentY };
      const currentSides = [
        rotatePoint({ x: currentX + w / 2, y: currentY }, pivot, rotation),
        rotatePoint({ x: currentX + w / 2, y: currentY + h }, pivot, rotation),
        rotatePoint({ x: currentX, y: currentY + h / 2 }, pivot, rotation),
        rotatePoint({ x: currentX + w, y: currentY + h / 2 }, pivot, rotation),
      ];

      for (const side of currentSides) {
        for (const room of rooms) {
          // Check if side is inside room (only snap to inner walls)
          const isInside = isPointInPolygon(side, room.points);
          if (!isInside) continue;

          for (let i = 0; i < room.points.length; i++) {
            const wallId = `${room.id}-${i}`;
            if (snappedWallIds.has(wallId)) continue;

            const p1 = room.points[i];
            const p2 = room.points[(i + 1) % room.points.length];
            const result = getDistanceToSegment(side, p1, p2);
            
            if (typeof result === 'object') {
              // Distance to the FACE of the wall (which is halfWall away from center line)
              const distToFace = Math.abs(result.distance - halfWall);
              
              if (distToFace < snapThreshold && distToFace < minSnapDist) {
                minSnapDist = distToFace;
                
                // Direction from side to wall center
                const dx = result.point.x - side.x;
                const dy = result.point.y - side.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                
                if (d > 0) {
                  const ux = dx / d;
                  const uy = dy / d;
                  // We want side to be at distance halfWall from result.point
                  bestSnap = {
                    offsetX: (result.point.x - ux * halfWall) - side.x,
                    offsetY: (result.point.y - uy * halfWall) - side.y,
                    wallId
                  };
                }
              }
            }
          }
        }
      }

      if (bestSnap && !useStore.getState().isAltPressed) {
        currentX += bestSnap.offsetX;
        currentY += bestSnap.offsetY;
        snappedWallIds.add(bestSnap.wallId);
      } else {
        break;
      }
    }

    // Apply final snapped position to node
    node.x(currentX);
    node.y(currentY);

    // Calculate distances for UI based on FINAL position
    const finalPivot = { x: currentX, y: currentY };
    const finalSides = [
      rotatePoint({ x: currentX + w / 2, y: currentY }, finalPivot, rotation),
      rotatePoint({ x: currentX + w / 2, y: currentY + h }, finalPivot, rotation),
      rotatePoint({ x: currentX, y: finalPivot.y + h / 2 }, finalPivot, rotation),
      rotatePoint({ x: currentX + w, y: finalPivot.y + h / 2 }, finalPivot, rotation),
    ];

    const newDistances: { p1: Vector2d, p2: Vector2d, dist: number }[] = [];
    finalSides.forEach(side => {
      let minFaceDist = Infinity;
      let nearestPointOnFace = side;

      rooms.forEach(room => {
        for (let i = 0; i < room.points.length; i++) {
          const p1 = room.points[i];
          const p2 = room.points[(i + 1) % room.points.length];
          const result = getDistanceToSegment(side, p1, p2);
          if (typeof result === 'object') {
            const distToFace = Math.abs(result.distance - halfWall);
            if (distToFace < minFaceDist) {
              minFaceDist = distToFace;
              // Visual point on the face
              const dx = result.point.x - side.x;
              const dy = result.point.y - side.y;
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d > 0) {
                nearestPointOnFace = {
                  x: result.point.x - (dx / d) * halfWall,
                  y: result.point.y - (dy / d) * halfWall
                };
              } else {
                nearestPointOnFace = result.point;
              }
            }
          }
        }
      });

      if (minFaceDist < 200) {
        newDistances.push({ p1: side, p2: nearestPointOnFace, dist: minFaceDist });
      }
    });

    setDragDistances(newDistances);

    // Collision Detection (using the snapped position)
    let colliding = false;
    const collisionEpsilon = 0.5; // Allow 0.5px overlap to avoid flickering at 0 distance

    if (shape.type === 'circle') {
      const radius = Math.max(shape.width, shape.height) / 2;
      const center = { x: currentX + shape.width / 2, y: currentY + shape.height / 2 };

      // Check against other furniture
      for (const other of allFurniture) {
        if (other.id === shape.id) continue;
        if (other.type === 'circle') {
          const otherRadius = Math.max(other.width, other.height) / 2;
          const otherCenter = { x: other.x + other.width / 2, y: other.y + other.height / 2 };
          if (getDistance(center, otherCenter) < (radius + otherRadius - collisionEpsilon)) {
            colliding = true;
            break;
          }
        } else {
          const otherVertices = getFurnitureVertices(other);
          if (checkCirclePolygonIntersect(center, radius - collisionEpsilon, otherVertices)) {
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
            const result = getDistanceToSegment(center, p1, p2);
            if (typeof result === 'object' && result.distance < (radius + halfWall - collisionEpsilon)) {
              colliding = true;
              break;
            }
          }
          if (colliding) break;
        }
      }
    } else {
      const currentVertices = getFurnitureVertices({
        x: currentX,
        y: currentY,
        width: shape.width,
        height: shape.height,
        rotation: rotation
      });

      // Check against other furniture
      for (const other of allFurniture) {
        if (other.id === shape.id) continue;
        if (other.type === 'circle') {
          const otherRadius = Math.max(other.width, other.height) / 2;
          const otherCenter = { x: other.x + other.width / 2, y: other.y + other.height / 2 };
          if (checkCirclePolygonIntersect(otherCenter, otherRadius - collisionEpsilon, currentVertices)) {
            colliding = true;
            break;
          }
        } else {
          const otherVertices = getFurnitureVertices(other);
          if (checkPolygonsIntersect(currentVertices, otherVertices)) {
            // SAT doesn't easily support epsilon, but we can shrink the polygon slightly
            // For now, standard SAT is okay, but let's check if we can do better
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
            // Check distance to wall center line
            for (const vertex of currentVertices) {
              const result = getDistanceToSegment(vertex, p1, p2);
              if (typeof result === 'object' && result.distance < (halfWall - collisionEpsilon)) {
                colliding = true;
                break;
              }
            }
            if (colliding) break;
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

        {/* Quick Rotation Buttons (Only when selected) */}
        {isSelected && (
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
