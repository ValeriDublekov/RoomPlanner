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
      
      // Collect all points that should snap. 
      // For a group, we use the midpoints of all children's boundaries.
      // For a single item, we use its own midpoints.
      let pointsToSnap: Vector2d[] = [];
      
      if (shape.type === 'group' && shape.children) {
        shape.children.forEach(child => {
          const cw = child.width;
          const ch = child.height;
          const cx = child.x;
          const cy = child.y;
          const cRot = child.rotation;
          
          // Child's midpoints in its own local space (relative to child.x, child.y)
          // But child.rotation is also relative to group? 
          // Actually child.rotation in store is absolute rotation at time of grouping.
          // Wait, in FurnitureItem rendering: rotation={child.rotation}
          // But it's inside a Group that has rotation={shape.rotation}.
          // So the effective rotation is child.rotation + shape.rotation? 
          // No, when ungrouping: rotation: (child.rotation + group.rotation) % 360
          // This implies child.rotation is relative to group.
          
          const midpoints = [
            { x: cx + cw / 2, y: cy },
            { x: cx + cw / 2, y: cy + ch },
            { x: cx, y: cy + ch / 2 },
            { x: cx + cw, y: cy + ch / 2 },
          ];
          
          // Rotate these points by the group's rotation around the group's pivot
          midpoints.forEach(p => {
            pointsToSnap.push(rotatePoint(p, { x: 0, y: 0 }, rotation));
          });
        });
        // Also add group's own midpoints just in case
        const groupMidpoints = [
          { x: w / 2, y: 0 },
          { x: w / 2, y: h },
          { x: 0, y: h / 2 },
          { x: w, y: h / 2 },
        ];
        groupMidpoints.forEach(p => {
          pointsToSnap.push(rotatePoint(p, { x: 0, y: 0 }, rotation));
        });
      } else {
        pointsToSnap = [
          rotatePoint({ x: w / 2, y: 0 }, { x: 0, y: 0 }, rotation),
          rotatePoint({ x: w / 2, y: h }, { x: 0, y: 0 }, rotation),
          rotatePoint({ x: 0, y: h / 2 }, { x: 0, y: 0 }, rotation),
          rotatePoint({ x: w, y: h / 2 }, { x: 0, y: 0 }, rotation),
        ];
      }

      // Convert relative points to world points
      const worldPoints = pointsToSnap.map(p => ({ x: p.x + currentX, y: p.y + currentY }));

      for (const side of worldPoints) {
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
              // Distance to the inner face of the wall (which is the segment itself)
              const distToFace = result.distance;
              
              if (distToFace < snapThreshold && distToFace < minSnapDist) {
                minSnapDist = distToFace;
                
                // Direction from side to wall center
                const dx = result.point.x - side.x;
                const dy = result.point.y - side.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                
                if (d >= 0) {
                  bestSnap = {
                    offsetX: result.point.x - side.x,
                    offsetY: result.point.y - side.y,
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
            const distToFace = result.distance;
            if (distToFace < minFaceDist) {
              minFaceDist = distToFace;
              // Visual point on the face
              nearestPointOnFace = result.point;
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
          // If center is outside the room, it's a collision
          if (!isPointInPolygon(center, room.points)) {
            colliding = true;
            break;
          }

          // Check if any wall segment intersects the circle (excluding touching)
          for (let i = 0; i < room.points.length; i++) {
            const p1 = room.points[i];
            const p2 = room.points[(i + 1) % room.points.length];
            const result = getDistanceToSegment(center, p1, p2);
            if (typeof result === 'object' && result.distance < (radius - 1)) {
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
          // If any vertex is outside the room, it's a collision
          for (const vertex of currentVertices) {
            if (!isPointInPolygon(vertex, room.points)) {
              colliding = true;
              break;
            }
          }
          if (colliding) break;
          
          // Also check if any wall segment is "too deep" inside the furniture
          // For now, vertex-outside is a good enough approximation for wall overlap
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
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        rotation={shape.rotation}
        draggable={!isLocked}
        onClick={(e) => {
          if (e.evt.button !== 0) return;
          e.cancelBubble = true;
          onSelect(e.evt.ctrlKey || e.evt.metaKey);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect(e.evt.ctrlKey || e.evt.metaKey);
        }}
        onDragStart={(e) => {
          if (e.evt.button !== 0) return;
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
              x: e.target.x(),
              y: e.target.y(),
            });
          }
        }}
        onTransformStart={onStartChange}
        onTransformEnd={handleTransformEnd}
        listening={!isLocked}
      >
        {isGroup ? (
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
                {/* Simplified rendering for children inside group */}
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
            {/* Group bounding box */}
            <Rect
              width={shape.width}
              height={shape.height}
              stroke={isSelected ? "#4f46e5" : "transparent"}
              strokeWidth={1 / scale}
              dash={[5 / scale, 5 / scale]}
            />
          </Group>
        ) : (
          <>
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

            {/* Dimensions Text - Orientation Aware */}
            {(() => {
              // Normalize rotation to 0-360
              const normRot = (shape.rotation % 360 + 360) % 360;
              let textRotation = 0;
              
              // Determine if text should be flipped to stay upright
              // We want text to be horizontal or vertical, but not upside down
              if (normRot > 90 && normRot <= 270) {
                textRotation = 180;
              }

              return (
                <Group 
                  x={shape.width / 2} 
                  y={shape.height / 2} 
                  rotation={textRotation}
                >
                  <Text
                    text={`${shape.name}\n${(shape.width / pixelsPerCm).toFixed(0)} x ${(
                      shape.height / pixelsPerCm
                    ).toFixed(0)} cm`}
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

            {/* Face Indicator for specific furniture types */}
            {(shape.furnitureType === 'wardrobe' || shape.furnitureType === 'dresser' || shape.furnitureType === 'desk' || shape.furnitureType === 'bed') && (
              <Group>
                {/* A subtle line or double line at the "front" (bottom edge by default) */}
                <KonvaLine
                  points={[5 / scale, shape.height - 2 / scale, shape.width - 5 / scale, shape.height - 2 / scale]}
                  stroke="#4f46e5"
                  strokeWidth={3 / scale}
                  opacity={0.6}
                />
                {shape.furnitureType === 'wardrobe' && (
                  <Group>
                    <KonvaLine
                      points={[shape.width / 2, shape.height - 8 / scale, shape.width / 2, shape.height]}
                      stroke="#4f46e5"
                      strokeWidth={1 / scale}
                      opacity={0.4}
                    />
                  </Group>
                )}
              </Group>
            )}

            {/* Dynamic Shelf Dividers for Wall Shelf */}
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
        )}

        {/* Quick Rotation Buttons (Only when selected) */}
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
