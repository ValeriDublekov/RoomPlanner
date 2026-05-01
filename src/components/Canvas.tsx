import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import Konva from 'konva';
import useImage from 'use-image';
import { processImageForEdges } from '../lib/edgeDetection';
import { CanvasHeader } from './Canvas/CanvasHeader';
import { SubHeader } from './SubHeader';
import { CanvasOverlays } from './Canvas/CanvasOverlays';
import { CanvasStage } from './Canvas/CanvasStage';
import { GridLayer } from './Canvas/GridLayer';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useClipboardPaste } from '../hooks/useClipboardPaste';
import { useCanvasLogic } from '../hooks/useCanvasLogic';
import { useCanvasExport } from '../hooks/useCanvasExport';

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  
  const { 
    scale, position, setPosition, 
    activeLayer, backgroundImage,
    rooms, furniture,
    dimensionInput,
    gridVisible, isAltPressed,
    setEdgeMap, fitToScreen, finishRoom,
    selectedId, selectedRoomId, selectedDimensionId, selectedAttachmentId,
    wallAttachments, dimensions: savedDimensions,
    ensureVisible,
    setViewport,
    sidebarWidth
  } = useStore();

  // Auto-focus selected object if it's covered by UI
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    
    let bounds = null;
    
    if (selectedId) {
      const f = furniture.find(item => item.id === selectedId);
      if (f) {
        bounds = { minX: f.x, minY: f.y, maxX: f.x + f.width, maxY: f.y + f.height };
      }
    } else if (selectedRoomId) {
      const r = rooms.find(item => item.id === selectedRoomId);
      if (r) {
        bounds = {
          minX: Math.min(...r.points.map(p => p.x)),
          minY: Math.min(...r.points.map(p => p.y)),
          maxX: Math.max(...r.points.map(p => p.x)),
          maxY: Math.max(...r.points.map(p => p.y)),
        };
      }
    } else if (selectedDimensionId) {
      const d = savedDimensions.find(item => item.id === selectedDimensionId);
      if (d) {
        bounds = {
          minX: Math.min(d.p1.x, d.p2.x),
          minY: Math.min(d.p1.y, d.p2.y),
          maxX: Math.max(d.p1.x, d.p2.x),
          maxY: Math.max(d.p1.y, d.p2.y),
        };
      }
    }

    if (bounds) {
      ensureVisible(bounds);
    }
  }, [selectedId, selectedRoomId, selectedDimensionId, selectedAttachmentId, dimensions.width, dimensions.height, furniture, rooms, savedDimensions, wallAttachments, ensureVisible, sidebarWidth]);

  const [bgImage] = useImage(backgroundImage || '');
  const hasAutoFittedRef = useRef(false);
  const bgRef = useRef<Konva.Image>(null);
  const bgTrRef = useRef<Konva.Transformer>(null);

  const {
    mousePos,
    getSnappedMousePos,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleDblClick,
    handleDimensionSubmit
  } = useCanvasLogic(stageRef, dimensions, isCtrlPressed, isAltPressed);

  const { handleExport, handlePrint, getStageThumbnail, handleExportDXF, handleExportOBJ, handleExportGLB } = useCanvasExport(stageRef);

  useClipboardPaste();
  useKeyboardShortcuts(setIsCtrlPressed, handleDimensionSubmit);

  // Auto-fit on initial load
  useEffect(() => {
    if (!hasAutoFittedRef.current && dimensions.width > 0 && (rooms.length > 0 || furniture.length > 0)) {
      fitToScreen();
      hasAutoFittedRef.current = true;
    }
  }, [dimensions.width, dimensions.height, rooms.length, furniture.length, fitToScreen]);

  useEffect(() => {
    if (activeLayer === 'blueprint' && bgTrRef.current && bgRef.current) {
      bgTrRef.current.nodes([bgRef.current]);
      bgTrRef.current.getLayer()?.batchDraw();
    }
  }, [activeLayer, bgImage]);

  useEffect(() => {
    if (backgroundImage) {
      processImageForEdges(backgroundImage)
        .then(map => setEdgeMap(map))
        .catch(err => console.error('Edge processing failed:', err));
    } else {
      setEdgeMap(null);
    }
  }, [backgroundImage, setEdgeMap]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
        setViewport({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [setViewport]);

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target instanceof Konva.Stage) {
      setPosition({ x: e.target.x(), y: e.target.y() });
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target instanceof Konva.Stage) {
      setPosition({ x: e.target.x(), y: e.target.y() });
    }
  };

  const snappedMouse = getSnappedMousePos();
  const pixelsPerCmVal = useStore.getState().pixelsPerCm;

  return (
    <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
      <CanvasHeader 
        onExport={handleExport} 
        onExportDXF={handleExportDXF} 
        onExportOBJ={handleExportOBJ} 
        onExportGLB={handleExportGLB} 
        onPrint={handlePrint} 
        getThumbnail={getStageThumbnail} 
      />
      <SubHeader />

      <div ref={containerRef} className="flex-1 relative">
        {gridVisible && activeLayer !== 'blueprint' && <GridLayer scale={scale} position={position} />}
        {dimensions.width > 0 && dimensions.height > 0 && (
          <CanvasStage
            stageRef={stageRef}
            dimensions={dimensions}
            scale={scale}
            position={position}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onDragMove={handleDragMove}
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
          lastMeasurement={useStore.getState().lastMeasurement}
          pixelsPerCm={pixelsPerCmVal}
          resetMeasurement={useStore.getState().resetMeasurement}
          dimensionInput={dimensionInput}
          orthoMode={useStore.getState().orthoMode}
          isCtrlPressed={isCtrlPressed}
          scale={scale}
          snapToGrid={useStore.getState().snapToGrid}
          finishRoom={finishRoom}
          continueRoom={useStore.getState().continueRoom}
          closeOpenRoom={useStore.getState().closeOpenRoom}
          roomPoints={useStore.getState().roomPoints}
          selectedRoomId={useStore.getState().selectedRoomId}
          rooms={rooms}
        />
      </div>
    </div>
  );
};
