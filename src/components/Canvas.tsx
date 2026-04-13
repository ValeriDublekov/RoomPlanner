import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../store';
import Konva from 'konva';
import useImage from 'use-image';
import { getDistance } from '../lib/geometry';
import { processImageForEdges } from '../lib/edgeDetection';
import { CanvasHeader } from './Canvas/CanvasHeader';
import { SubHeader } from './SubHeader';
import { CanvasOverlays } from './Canvas/CanvasOverlays';
import { CanvasStage } from './Canvas/CanvasStage';
import { GridLayer } from './Canvas/GridLayer';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useMouseSnapping } from '../hooks/useMouseSnapping';

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  
  const { 
    scale, setScale, 
    position, setPosition, 
    mode, setMode,
    activeLayer,
    backgroundImage,
    setPixelsPerCm,
    roomPoints, addRoomPoint, closeRoom, rooms,
    dimensionInput, setDimensionInput,
    furniture, addFurniture, selectedId, setSelectedId,
    selectedRoomId, setSelectedRoomId, deleteRoom,
    measurePoints, addMeasurePoint, lastMeasurement, resetMeasurement,
    dimensions: savedDimensions, deleteDimension, selectedDimensionId, setSelectedDimensionId,
    selectedAttachmentId, setSelectedAttachmentId, addWallAttachment,
    orthoMode,
    snapToGrid,
    snapToImage,
    gridVisible,
    isAltPressed,
    edgeMap, setEdgeMap,
    saveHistory,
    fitToScreen,
    finishRoom
  } = useStore();

  const [hasAutoFitted, setHasAutoFitted] = useState(false);

  const [bgImage] = useImage(backgroundImage || '');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const bgRef = useRef<Konva.Image>(null);
  const bgTrRef = useRef<Konva.Transformer>(null);

  const { getSnappedMousePos } = useMouseSnapping(mousePos, isCtrlPressed, isAltPressed);

  // Auto-fit on initial load
  useEffect(() => {
    if (!hasAutoFitted && dimensions.width > 0 && (rooms.length > 0 || furniture.length > 0)) {
      fitToScreen(dimensions.width, dimensions.height);
      setHasAutoFitted(true);
    }
  }, [dimensions, rooms.length, furniture.length, hasAutoFitted, fitToScreen]);

  const handleDimensionSubmit = useCallback(() => {
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
  }, [dimensionInput, roomPoints, getSnappedMousePos, addRoomPoint, setDimensionInput]);

  useKeyboardShortcuts(setIsCtrlPressed, handleDimensionSubmit);

  useEffect(() => {
    if (activeLayer === 'blueprint' && bgTrRef.current && bgRef.current) {
      bgTrRef.current.nodes([bgRef.current]);
      bgTrRef.current.getLayer()?.batchDraw();
    }
  }, [activeLayer, bgImage]);

  // Process image for edges when background image changes
  useEffect(() => {
    if (backgroundImage) {
      processImageForEdges(backgroundImage)
        .then(map => setEdgeMap(map))
        .catch(err => console.error('Edge processing failed:', err));
    } else {
      setEdgeMap(null);
    }
  }, [backgroundImage, setEdgeMap]);

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
    
    useStore.getState().setContextMenu({ visible: false, x: 0, y: 0, targetId: null, targetType: null });

    const stage = stageRef.current;
    if (!stage) return;

    const relPos = getSnappedMousePos();

    if (mode === 'calibrate') {
      const { calibrationPoints, setCalibrationPoints } = useStore.getState();
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
    } else if (mode === 'add-box' || mode === 'draw-circle') {
      const pixelsPerCm = useStore.getState().pixelsPerCm;
      const size = 50 * pixelsPerCm;
      addFurniture({
        type: mode === 'add-box' ? 'box' : 'circle',
        name: mode === 'add-box' ? 'New Box' : 'New Circle',
        x: relPos.x - size / 2,
        y: relPos.y - size / 2,
        width: size,
        height: size,
        rotation: 0
      });
      setMode('select');
    } else if (mode === 'select') {
      if (e.target === stage) {
        setSelectedId(null);
        setSelectedRoomId(null);
        setSelectedDimensionId(null);
        setSelectedAttachmentId(null);
      }
    } else if (mode === 'add-door' || mode === 'add-window') {
      // Find nearest wall
      let nearestWall = null;
      let minDist = 20 / scale;

      for (const room of rooms) {
        for (let i = 0; i < room.points.length; i++) {
          const p1 = room.points[i];
          const p2 = room.points[(i + 1) % room.points.length];
          
          // Project point onto line segment
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const l2 = dx * dx + dy * dy;
          if (l2 === 0) continue;
          
          let t = ((relPos.x - p1.x) * dx + (relPos.y - p1.y) * dy) / l2;
          t = Math.max(0, Math.min(1, t));
          
          const projection = {
            x: p1.x + t * dx,
            y: p1.y + t * dy
          };
          
          const d = getDistance(relPos, projection);
          if (d < minDist) {
            minDist = d;
            nearestWall = { roomId: room.id, wallSegmentIndex: i, positionAlongWall: t };
          }
        }
      }

      if (nearestWall) {
        addWallAttachment({
          type: mode === 'add-door' ? 'door' : 'window',
          roomId: nearestWall.roomId,
          wallSegmentIndex: nearestWall.wallSegmentIndex,
          positionAlongWall: nearestWall.positionAlongWall,
          width: 80 // Default 80cm
        });
        setMode('select');
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

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target instanceof Konva.Stage) {
      setPosition({ x: e.target.x(), y: e.target.y() });
    }
  };

  const snappedMouse = getSnappedMousePos();
  const pixelsPerCmVal = useStore.getState().pixelsPerCm;

  return (
    <div ref={containerRef} className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
      <CanvasHeader />
      <SubHeader />

      <div className="flex-1 relative">
        {gridVisible && <GridLayer scale={scale} position={position} />}
        {dimensions.width > 0 && dimensions.height > 0 && (
          <CanvasStage
            stageRef={stageRef}
            dimensions={dimensions}
            scale={scale}
            position={position}
            onWheel={handleWheel}
            onMouseDown={() => {}}
            onMouseUp={() => {}}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            onDblClick={handleDblClick}
            onMouseMove={handleMouseMove}
            bgImage={bgImage}
            bgRef={bgRef}
            bgTrRef={bgTrRef}
            snappedMouse={snappedMouse}
            mousePos={mousePos}
          />
        )}

        <CanvasOverlays
          lastMeasurement={lastMeasurement}
          pixelsPerCm={pixelsPerCmVal}
          resetMeasurement={resetMeasurement}
          dimensionInput={dimensionInput}
          orthoMode={orthoMode}
          isCtrlPressed={isCtrlPressed}
          scale={scale}
          snapToGrid={snapToGrid}
          finishRoom={finishRoom}
          continueRoom={useStore.getState().continueRoom}
          closeOpenRoom={useStore.getState().closeOpenRoom}
          roomPoints={roomPoints}
          selectedRoomId={selectedRoomId}
          rooms={rooms}
        />
      </div>
    </div>
  );
};
