import React from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { useStore } from '../../store';
import { BackgroundLayer } from './Layers/BackgroundLayer';
import { ArchitecturalLayer } from './Layers/ArchitecturalLayer';
import { AnnotationOverlay } from './Layers/AnnotationOverlay';
import { InteractionLayer } from './Layers/InteractionLayer';
import { ContextMenu } from './ContextMenu';
import { useStageContextMenu } from '../../hooks/useStageContextMenu';

interface CanvasStageProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  dimensions: { width: number; height: number };
  scale: number;
  position: { x: number; y: number };
  onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  bgImage: HTMLImageElement | undefined;
  bgRef: React.RefObject<Konva.Image | null>;
  bgTrRef: React.RefObject<Konva.Transformer | null>;
  snappedMouse: { x: number; y: number };
  mousePos: { x: number; y: number };
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  stageRef,
  dimensions,
  scale,
  position,
  onWheel,
  onMouseDown,
  onMouseUp,
  onDragEnd,
  onDragMove,
  onClick,
  onDblClick,
  onMouseMove,
  bgImage,
  bgRef,
  bgTrRef,
  snappedMouse,
  mousePos
}) => {
  const mode = useStore(state => state.mode);
  const { handleContextMenu } = useStageContextMenu(stageRef);

  return (
    <>
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={onWheel}
        onMouseDown={(e) => {
          onMouseDown(e);
        }}
        onMouseUp={onMouseUp}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onClick={onClick}
        onDblClick={onDblClick}
        onMouseMove={onMouseMove}
        onContextMenu={handleContextMenu}
        draggable={mode === 'select'}
        name="stage"
        dragBoundFunc={(pos) => {
          const stage = stageRef.current;
          if (stage && mode === 'select') {
            const pointer = stage.getPointerPosition();
            if (pointer) {
              const intersection = stage.getIntersection(pointer);
              if (intersection) {
                const name = intersection.name();
                const className = intersection.className;
                
                // Block panning if we hit ANYTHING that isn't background or stage itself
                const isBg = name === 'stage' || name === 'grid-layer' || name === 'background-image' || intersection.hasName('grid-line');
                
                if (!isBg || name === 'transformer' || className.includes('Transformer')) {
                  console.log(`[Stage DragBound] Blocking pan. Hit: ${name} (${className})`);
                  return { x: stage.x(), y: stage.y() };
                }
              }
            }
          }
          return pos;
        }}
        className={(mode === 'calibrate' || mode === 'draw-room' || mode === 'draw-furniture' || mode === 'add-door' || mode === 'add-window' || mode === 'measure' || mode === 'dimension' || mode === 'place-furniture') ? 'custom-cursor' : ''}
      >
        <BackgroundLayer bgImage={bgImage} bgRef={bgRef} bgTrRef={bgTrRef} />
        
        <ArchitecturalLayer scale={scale} />

        <AnnotationOverlay scale={scale} snappedMouse={snappedMouse} />

        <InteractionLayer 
          mode={mode} 
          snappedMouse={snappedMouse} 
          mousePos={mousePos} 
          scale={scale} 
        />
      </Stage>
      <ContextMenu />
    </>
  );
};
