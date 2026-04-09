import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Line, Text } from 'react-konva';
import { useStore } from '../store';
import Konva from 'konva';
import useImage from 'use-image';
import { X, Download, Upload, Undo2 } from 'lucide-react';
import { getDistance, getOrthoPoint, getSnappedPosition } from '../lib/geometry';
import { FurnitureItem } from './Canvas/FurnitureItem';
import { RoomItem } from './Canvas/RoomItem';
import { DimensionItem } from './Canvas/DimensionItem';
import { DrawingLayer } from './Canvas/DrawingLayer';
import { GridLayer } from './Canvas/GridLayer';

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  
  const { 
    scale, setScale, 
    position, setPosition, 
    mode, setMode,
    activeLayer, setActiveLayer,
    backgroundImage, backgroundOpacity,
    backgroundPosition, backgroundScale, backgroundRotation, setBackgroundTransform,
    calibrationPoints, setCalibrationPoints,
    setPixelsPerCm,
    roomPoints, addRoomPoint, closeRoom, rooms,
    dimensionInput, setDimensionInput,
    furniture, addFurniture, updateFurniture, selectedId, setSelectedId,
    selectedRoomId, setSelectedRoomId, deleteRoom,
    measurePoints, addMeasurePoint, lastMeasurement, resetMeasurement,
    dimensions: savedDimensions, deleteDimension, selectedDimensionId, setSelectedDimensionId,
    undo, history,
    orthoMode, setOrthoMode,
    snapToGrid, setSnapToGrid,
    moveView, saveHistory
  } = useStore();

  const [bgImage] = useImage(backgroundImage || '');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const bgRef = useRef<Konva.Image>(null);
  const bgTrRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (activeLayer === 'blueprint' && bgTrRef.current && bgRef.current) {
      bgTrRef.current.nodes([bgRef.current]);
      bgTrRef.current.getLayer()?.batchDraw();
    }
  }, [activeLayer, bgImage]);

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Control') setIsCtrlPressed(true);
      
      const panStep = 20;
      if (e.key === 'ArrowUp') { moveView(0, panStep); return; }
      if (e.key === 'ArrowDown') { moveView(0, -panStep); return; }
      if (e.key === 'ArrowLeft') { moveView(panStep, 0); return; }
      if (e.key === 'ArrowRight') { moveView(-panStep, 0); return; }

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

      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'v': setMode('select'); break;
          case 'r': setMode('draw-room'); break;
          case 'b': setMode('add-box'); break;
          case 'f': setMode('draw-furniture'); break;
          case 'c': setMode('calibrate'); break;
          case 'm': setMode('measure'); break;
          case 'd': setMode('dimension'); break;
          case 'o': setOrthoMode(!orthoMode); break;
          case 's': setSnapToGrid(!snapToGrid); break;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!dimensionInput) {
          if (selectedId) useStore.getState().deleteSelected();
          if (selectedRoomId) deleteRoom(selectedRoomId);
          if (selectedDimensionId) deleteDimension(selectedDimensionId);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }

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
  }, [mode, roomPoints, dimensionInput, selectedId, selectedRoomId, orthoMode, snapToGrid]);

  const handleDimensionSubmit = () => {
    const cm = parseFloat(dimensionInput);
    const pixelsPerCm = useStore.getState().pixelsPerCm;
    if (isNaN(cm) || cm <= 0 || roomPoints.length === 0) return;

    const lastPoint = roomPoints[roomPoints.length - 1];
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
    const pixelsPerCm = useStore.getState().pixelsPerCm;

    if (snapToGrid && !forceIgnoreGrid) {
      const snapThreshold = 10 / scale;
      const snapped = getSnappedPosition(pos, rooms, furniture, snapThreshold);
      
      if (snapped.x !== pos.x || snapped.y !== pos.y) {
        pos = snapped;
      } else {
        const gridPx = 10 * pixelsPerCm;
        pos.x = Math.round(pos.x / gridPx) * gridPx;
        pos.y = Math.round(pos.y / gridPx) * gridPx;
      }
    }

    const isOrthoActive = orthoMode || isCtrlPressed;
    if ((mode === 'draw-room' || mode === 'draw-furniture' || mode === 'measure' || mode === 'dimension') && isOrthoActive && (roomPoints.length > 0 || measurePoints.length > 0)) {
      const lastPoint = mode === 'measure' || mode === 'dimension' ? measurePoints[0] : roomPoints[roomPoints.length - 1];
      if (lastPoint) {
        pos = getOrthoPoint(lastPoint, pos);
      }
    }

    return pos;
  }, [mousePos, isCtrlPressed, orthoMode, snapToGrid, mode, roomPoints, measurePoints, rooms, furniture, scale]);

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

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    
    const stage = stageRef.current;
    if (!stage) return;

    const relPos = getSnappedMousePos();

    if (mode === 'calibrate') {
      if (!calibrationPoints) {
        setCalibrationPoints([relPos]);
      } else if (calibrationPoints.length === 1) {
        const p1 = calibrationPoints[0];
        const p2 = relPos;
        const dist = getDistance(p1, p2);
        useStore.getState().setTempCalibrationDist(dist);
        setCalibrationPoints(null);
      }
    } else if (mode === 'measure' || mode === 'dimension') {
      addMeasurePoint(relPos);
    } else if (mode === 'draw-room' || mode === 'draw-furniture') {
      if (roomPoints.length >= 3) {
        const startPoint = roomPoints[0];
        const threshold = 15 / scale;
        if (getDistance(relPos, startPoint) < threshold) {
          closeRoom();
          return;
        }
      }
      addRoomPoint(relPos);
    } else if (mode === 'add-box') {
      const pixelsPerCm = useStore.getState().pixelsPerCm;
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
        setSelectedDimensionId(null);
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

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (stage) stage.container().style.cursor = 'grabbing';
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
  const pixelsPerCmVal = useStore.getState().pixelsPerCm;

  return (
    <div ref={containerRef} className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Top Header Bar */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Canvas Ready</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
              title={`Undo (${history.length})`}
            >
              <Undo2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const data = { rooms, furniture, dimensions: savedDimensions, pixelsPerCm: pixelsPerCmVal, version: '1.0' };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'room-plan.json';
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors uppercase tracking-wider"
          >
            <Download size={14} />
            Save
          </button>
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const json = JSON.parse(event.target?.result as string);
                    useStore.getState().loadState(json);
                  } catch (err) {
                    console.error('Failed to load:', err);
                  }
                };
                reader.readAsText(file);
              };
              input.click();
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors uppercase tracking-wider"
          >
            <Upload size={14} />
            Load
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <GridLayer scale={scale} position={position} />
        
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
          draggable={mode === 'select' && !selectedId && !selectedRoomId && !selectedDimensionId}
          style={{ cursor: (mode === 'calibrate' || mode === 'draw-room' || mode === 'draw-furniture') ? 'crosshair' : 'default' }}
        >
        {/* Layer 1: Background / Blueprint */}
        <Layer id="background-layer">
          {bgImage && (
            <>
              <KonvaImage
                ref={bgRef}
                image={bgImage}
                x={backgroundPosition.x}
                y={backgroundPosition.y}
                scaleX={backgroundScale}
                scaleY={backgroundScale}
                rotation={backgroundRotation}
                opacity={backgroundOpacity}
                draggable={activeLayer === 'blueprint'}
                onDragEnd={(e) => {
                  setBackgroundTransform({ x: e.target.x(), y: e.target.y() });
                }}
                onTransformEnd={() => {
                  const node = bgRef.current;
                  if (node) {
                    setBackgroundTransform({
                      x: node.x(),
                      y: node.y(),
                      scale: node.scaleX(),
                      rotation: node.rotation(),
                    });
                  }
                }}
              />
              {activeLayer === 'blueprint' && (
                <Transformer
                  ref={bgTrRef}
                  rotateEnabled={true}
                  enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) return oldBox;
                    return newBox;
                  }}
                />
              )}
            </>
          )}
        </Layer>

        {/* Layer 2: Static Room Shapes (Locked unless active) */}
        <Layer id="room-layer">
          {rooms.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              isSelected={selectedRoomId === room.id}
              onSelect={() => setSelectedRoomId(room.id)}
              scale={scale}
              isLocked={activeLayer !== 'room'}
            />
          ))}
        </Layer>

        {/* Layer 3: Furniture Objects */}
        <Layer id="furniture-layer">
          {furniture.map((item) => (
            <FurnitureItem
              key={item.id}
              shape={item}
              isSelected={item.id === selectedId}
              onSelect={() => {
                if (activeLayer === 'furniture') {
                  setSelectedId(item.id);
                }
              }}
              onStartChange={saveHistory}
              onChange={(newAttrs) => updateFurniture(item.id, newAttrs)}
              scale={scale}
              pixelsPerCm={pixelsPerCmVal}
              isLocked={activeLayer !== 'furniture'}
            />
          ))}
        </Layer>

        {/* Layer 4: Annotations (Future dimensions) */}
        <Layer id="annotation-layer">
          {savedDimensions.map((dim) => (
            <DimensionItem
              key={dim.id}
              dimension={dim}
              pixelsPerCm={pixelsPerCmVal}
              scale={scale}
              isSelected={selectedDimensionId === dim.id}
              onSelect={() => {
                if (activeLayer === 'annotation') {
                  setSelectedDimensionId(dim.id);
                  setMode('select');
                }
              }}
            />
          ))}
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
              />
            </>
          )}
        </Layer>

        {/* Layer 5: Interactive / UI Elements (Active drawing) */}
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
        </Layer>
      </Stage>

      {/* Overlays */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 pointer-events-none">
        {lastMeasurement !== null && (
          <div className="bg-rose-500 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-1 animate-in slide-in-from-bottom-4 pointer-events-auto">
            <div className="flex items-center justify-between gap-8">
              <span className="text-[10px] font-bold text-rose-100 uppercase tracking-widest">Last Measurement</span>
              <button 
                onClick={resetMeasurement}
                className="hover:bg-rose-600 p-0.5 rounded transition-colors"
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold tracking-tighter">{(lastMeasurement / pixelsPerCmVal).toFixed(1)}</span>
              <span className="text-xs font-bold text-rose-200">cm</span>
            </div>
          </div>
        )}

        {dimensionInput && (
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-1 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between gap-8">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Length</span>
              <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${(orthoMode || isCtrlPressed) ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                Ortho: {(orthoMode || isCtrlPressed) ? 'ON' : 'OFF'}
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold tracking-tighter">{dimensionInput}</span>
              <span className="text-xs font-bold text-slate-500">cm</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Press Enter to confirm</div>
          </div>
        )}
        
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Canvas</div>
          <div className="text-xs font-bold text-slate-700 leading-none">
            {Math.round(scale * 100)}% Zoom
          </div>
          <div className="text-[10px] opacity-70 font-medium mt-0.5">Ortho: {(orthoMode || isCtrlPressed) ? 'ON' : 'OFF'} | Snap: {snapToGrid ? 'ON' : 'OFF'}</div>
        </div>
      </div>
      </div>
    </div>
  );
};
