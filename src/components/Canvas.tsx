import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Image as KonvaImage, Line, Group, Text, Transformer } from 'react-konva';
import { useStore, FurnitureObject } from '../store';
import Konva from 'konva';
import useImage from 'use-image';

const FurnitureItem: React.FC<{ 
  shape: FurnitureObject; 
  isSelected: boolean; 
  onSelect: () => void;
  onChange: (newAttrs: Partial<FurnitureObject>) => void;
  onStartChange: () => void;
  scale: number;
  pixelsPerCm: number;
}> = ({ shape, isSelected, onSelect, onChange, onStartChange, scale, pixelsPerCm }) => {
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
        draggable={isSelected}
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
            points={shape.points?.flatMap(p => [p.x, p.y]) || []}
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
          text={`${shape.name}\n${(shape.width / pixelsPerCm).toFixed(0)} x ${(shape.height / pixelsPerCm).toFixed(0)} cm`}
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
          enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']}
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

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  
  const { 
    scale, setScale, 
    position, setPosition, 
    mode, setMode,
    backgroundImage, backgroundOpacity,
    calibrationPoints, setCalibrationPoints,
    setPixelsPerCm,
    roomPoints, addRoomPoint, closeRoom, rooms,
    dimensionInput, setDimensionInput,
    pixelsPerCm,
    furniture, addFurniture, updateFurniture, selectedId, setSelectedId,
    selectedRoomId, setSelectedRoomId, deleteRoom,
    undo, history,
    orthoMode, setOrthoMode,
    snapToGrid, setSnapToGrid,
    moveView, saveHistory
  } = useStore();

  const [bgImage] = useImage(backgroundImage || '');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input (like furniture name)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Control') setIsCtrlPressed(true);
      
      // Arrow Key Navigation
      const panStep = 20;
      if (e.key === 'ArrowUp') { moveView(0, panStep); return; }
      if (e.key === 'ArrowDown') { moveView(0, -panStep); return; }
      if (e.key === 'ArrowLeft') { moveView(panStep, 0); return; }
      if (e.key === 'ArrowRight') { moveView(-panStep, 0); return; }

      // Dimension Input
      if ((mode === 'draw-room' || mode === 'draw-furniture') && roomPoints.length > 0) {
        if (e.key >= '0' && e.key <= '9' || e.key === '.') {
          setDimensionInput(dimensionInput + e.key);
          return;
        } else if (e.key === 'Backspace') {
          setDimensionInput(dimensionInput.slice(0, -1));
          return;
        } else if (e.key === 'Enter' && dimensionInput) {
          handleDimensionSubmit();
          return;
        } else if (e.key === 'Escape') {
          if (dimensionInput) {
            setDimensionInput('');
          } else {
            useStore.setState({ roomPoints: [] });
          }
          return;
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedRoomId(null);
        setMode('select');
        return;
      }

      // Mode Shortcuts
      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'v': setMode('select'); break;
          case 'r': setMode('draw-room'); break;
          case 'b': setMode('add-box'); break;
          case 'f': setMode('draw-furniture'); break;
          case 'c': setMode('calibrate'); break;
          case 'o': setOrthoMode(!orthoMode); break;
          case 's': setSnapToGrid(!snapToGrid); break;
        }
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!dimensionInput) {
          if (selectedId) useStore.getState().deleteSelected();
          if (selectedRoomId) deleteRoom(selectedRoomId);
        }
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }

      // Copy/Paste
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'c') {
          useStore.getState().copySelected();
        } else if (e.key.toLowerCase() === 'v') {
          useStore.getState().paste();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, roomPoints, dimensionInput, selectedId, selectedRoomId]);

  const handleDimensionSubmit = () => {
    const cm = parseFloat(dimensionInput);
    if (isNaN(cm) || cm <= 0 || roomPoints.length === 0) return;

    const lastPoint = roomPoints[roomPoints.length - 1];
    // Ignore grid snapping when submitting a precise dimension
    const currentMouse = getSnappedMousePos(true);
    
    const dx = currentMouse.x - lastPoint.x;
    const dy = currentMouse.y - lastPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;

    const targetPx = cm * pixelsPerCm;
    const newPoint = {
      x: lastPoint.x + (dx / dist) * targetPx,
      y: lastPoint.y + (dy / dist) * targetPx,
    };

    addRoomPoint(newPoint);
    setDimensionInput('');
  };

  const getSnappedMousePos = useCallback((forceIgnoreGrid = false) => {
    let pos = { ...mousePos };

    // 1. Snap to Grid/Objects
    if (snapToGrid && !forceIgnoreGrid) {
      const snapThreshold = 10 / scale;
      let snapped = false;

      // Snap to existing room points
      for (const room of rooms) {
        for (const p of room.points) {
          const d = Math.sqrt(Math.pow(pos.x - p.x, 2) + Math.pow(pos.y - p.y, 2));
          if (d < snapThreshold) {
            pos = { ...p };
            snapped = true;
            break;
          }
        }
        if (snapped) break;
      }

      // Snap to furniture corners
      if (!snapped) {
        for (const f of furniture) {
          const corners = [
            { x: f.x, y: f.y },
            { x: f.x + f.width, y: f.y },
            { x: f.x, y: f.y + f.height },
            { x: f.x + f.width, y: f.y + f.height },
          ];
          for (const p of corners) {
            const d = Math.sqrt(Math.pow(pos.x - p.x, 2) + Math.pow(pos.y - p.y, 2));
            if (d < snapThreshold) {
              pos = { ...p };
              snapped = true;
              break;
            }
          }
          if (snapped) break;
        }
      }

      // Snap to grid (10cm increments)
      if (!snapped) {
        const gridPx = 10 * pixelsPerCm;
        pos.x = Math.round(pos.x / gridPx) * gridPx;
        pos.y = Math.round(pos.y / gridPx) * gridPx;
      }
    }

    // 2. Ortho Mode (overrides grid/object snap if active)
    const isOrthoActive = orthoMode || isCtrlPressed;
    if ((mode === 'draw-room' || mode === 'draw-furniture') && isOrthoActive && roomPoints.length > 0) {
      const lastPoint = roomPoints[roomPoints.length - 1];
      const dx = Math.abs(pos.x - lastPoint.x);
      const dy = Math.abs(pos.y - lastPoint.y);
      
      if (dx > dy) {
        pos = { x: pos.x, y: lastPoint.y };
      } else {
        pos = { x: lastPoint.x, y: pos.y };
      }
    }

    return pos;
  }, [mousePos, isCtrlPressed, orthoMode, snapToGrid, mode, roomPoints, rooms, furniture, scale, pixelsPerCm]);

  // Handle Zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.05, Math.min(newScale, 20));

    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  const getRelativePointerPosition = (stage: Konva.Stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY(),
    };
  };

  // Handle Clicks
  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return; // Only left click
    
    const stage = stageRef.current;
    if (!stage) return;

    const relPos = getSnappedMousePos();

    if (mode === 'calibrate') {
      if (!calibrationPoints) {
        setCalibrationPoints([relPos]);
      } else if (calibrationPoints.length === 1) {
        const p1 = calibrationPoints[0];
        const p2 = relPos;
        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        useStore.getState().setTempCalibrationDist(dist);
        setCalibrationPoints(null);
      }
    } else if (mode === 'draw-room' || mode === 'draw-furniture') {
      if (roomPoints.length >= 3) {
        const startPoint = roomPoints[0];
        const dist = Math.sqrt(Math.pow(relPos.x - startPoint.x, 2) + Math.pow(relPos.y - startPoint.y, 2));
        const threshold = 15 / scale;
        
        if (dist < threshold) {
          closeRoom();
          return;
        }
      }
      addRoomPoint(relPos);
    } else if (mode === 'add-box') {
      const boxSize = 50 * pixelsPerCm;
      addFurniture({
        type: 'box',
        name: 'New Box',
        x: relPos.x - boxSize / 2,
        y: relPos.y - boxSize / 2,
        width: boxSize,
        height: boxSize,
        rotation: 0
      });
      setMode('select');
    } else if (mode === 'select') {
      if (e.target === stage) {
        setSelectedId(null);
        setSelectedRoomId(null);
      }
    }
  };

  const handleDblClick = () => {
    if (mode === 'draw-room' || mode === 'draw-furniture') {
      closeRoom();
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const relPos = getRelativePointerPosition(stage);
    if (relPos) setMousePos(relPos);
  };

  // Handle Panning
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1) {
      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    const stage = stageRef.current;
    if (stage) stage.container().style.cursor = (mode === 'calibrate' || mode === 'draw-room' || mode === 'draw-furniture') ? 'crosshair' : 'default';
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target instanceof Konva.Stage) {
      setPosition({ x: e.target.x(), y: e.target.y() });
    }
  };

  const snappedMouse = getSnappedMousePos();

  return (
    <div ref={containerRef} className="flex-1 bg-slate-50 relative overflow-hidden">
      {/* Grid Background */}
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
          backgroundPosition: `${position.x}px ${position.y}px`
        }}
      />
      
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDblClick={handleDblClick}
        onMouseMove={handleMouseMove}
        draggable={mode === 'select' && !selectedId}
        style={{ cursor: (mode === 'calibrate' || mode === 'draw-room' || mode === 'draw-furniture') ? 'crosshair' : 'default' }}
      >
        <Layer>
          {/* Background Image */}
          {bgImage && (
            <KonvaImage
              image={bgImage}
              opacity={backgroundOpacity}
              listening={false}
            />
          )}

          {/* Completed Rooms */}
          {rooms.map((room) => (
            <Line
              key={room.id}
              points={room.points.flatMap(p => [p.x, p.y])}
              closed={true}
              fill={selectedRoomId === room.id ? "#818cf8" : "#f1f5f9"}
              opacity={selectedRoomId === room.id ? 0.3 : 0.5}
              stroke={selectedRoomId === room.id ? "#4f46e5" : "#94a3b8"}
              strokeWidth={selectedRoomId === room.id ? 3 / scale : 2 / scale}
              onClick={() => setSelectedRoomId(room.id)}
              onTap={() => setSelectedRoomId(room.id)}
            />
          ))}

          {/* Furniture Layer */}
          {furniture.map((item) => (
            <FurnitureItem
              key={item.id}
              shape={item}
              isSelected={item.id === selectedId}
              onSelect={() => setSelectedId(item.id)}
              onStartChange={saveHistory}
              onChange={(newAttrs) => updateFurniture(item.id, newAttrs)}
              scale={scale}
              pixelsPerCm={pixelsPerCm}
            />
          ))}

          {/* Current Drawing (Room or Furniture) */}
          {(mode === 'draw-room' || mode === 'draw-furniture') && roomPoints.length > 0 && (
            <Group>
              <Line
                points={[...roomPoints.flatMap(p => [p.x, p.y]), snappedMouse.x, snappedMouse.y]}
                stroke="#6366f1"
                strokeWidth={2 / scale}
                lineJoin="round"
                lineCap="round"
              />
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
                text={`${(Math.sqrt(Math.pow(snappedMouse.x - roomPoints[roomPoints.length - 1].x, 2) + Math.pow(snappedMouse.y - roomPoints[roomPoints.length - 1].y, 2)) / pixelsPerCm).toFixed(1)} cm`}
                fontSize={12 / scale}
                fill="#4f46e5"
                fontStyle="bold"
              />
            </Group>
          )}

          {/* Calibration Preview */}
          {mode === 'calibrate' && calibrationPoints && calibrationPoints.length === 1 && (
            <>
              <Line
                points={[calibrationPoints[0].x, calibrationPoints[0].y, mousePos.x, mousePos.y]}
                stroke="#6366f1"
                strokeWidth={2 / scale}
                dash={[5 / scale, 5 / scale]}
              />
              <Circle x={calibrationPoints[0].x} y={calibrationPoints[0].y} radius={4 / scale} fill="#6366f1" />
            </>
          )}
        </Layer>
      </Stage>

      {/* Dimension Input Overlay */}
      {(mode === 'draw-room' || mode === 'draw-furniture') && dimensionInput && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex flex-col items-center gap-1 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Length</span>
              <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${(orthoMode || isCtrlPressed) ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                Ortho: {(orthoMode || isCtrlPressed) ? 'ON' : 'OFF'}
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold">{dimensionInput}</span>
              <span className="text-sm font-bold text-slate-400">cm</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 italic">Press Enter to confirm</span>
          </div>
        </div>
      )}

      {/* Zoom & Mode Indicators */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2">
        {(mode === 'draw-room' || mode === 'draw-furniture') && (
          <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg text-xs font-bold">
            {roomPoints.length === 0 ? 'Click to start drawing' : 'Double-click to close'}
            <div className="text-[10px] opacity-70 font-medium mt-0.5">Ortho: {(orthoMode || isCtrlPressed) ? 'ON' : 'OFF'} | Snap: {snapToGrid ? 'ON' : 'OFF'}</div>
          </div>
        )}
        {mode === 'add-box' && (
          <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg text-xs font-bold">
            Click anywhere to place a 50x50cm box
          </div>
        )}
        <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Zoom: {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
};
