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
    setEdgeMap, fitToScreen, finishRoom
  } = useStore();

  const [hasAutoFitted, setHasAutoFitted] = useState(false);
  const [bgImage] = useImage(backgroundImage || '');
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
    handleDimensionSubmit
  } = useCanvasLogic(stageRef, dimensions, isCtrlPressed, isAltPressed);

  const { handleExport, handlePrint, getStageThumbnail } = useCanvasExport(stageRef);

  useClipboardPaste();
  useKeyboardShortcuts(setIsCtrlPressed, handleDimensionSubmit);

  // Auto-fit on initial load
  useEffect(() => {
    if (!hasAutoFitted && dimensions.width > 0 && (rooms.length > 0 || furniture.length > 0)) {
      fitToScreen(dimensions.width, dimensions.height);
      setHasAutoFitted(true);
    }
  }, [dimensions, rooms.length, furniture.length, hasAutoFitted, fitToScreen]);

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
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
    <div ref={containerRef} className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
      <CanvasHeader onExport={handleExport} onPrint={handlePrint} getThumbnail={getStageThumbnail} />
      <SubHeader />

      <div className="flex-1 relative">
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
            onDblClick={() => {}}
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
