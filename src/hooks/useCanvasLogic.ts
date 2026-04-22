import { useState, useCallback, useMemo } from 'react';
import Konva from 'konva';
import { useStore } from '../store';
import { useMouseSnapping } from './useMouseSnapping';
import { getToolHandler } from '../lib/tools/registry';
import { ToolContext } from '../lib/tools/types';

export const useCanvasLogic = (
  stageRef: React.RefObject<Konva.Stage>,
  dimensions: { width: number, height: number },
  isCtrlPressed: boolean,
  isAltPressed: boolean
) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { getSnappedMousePos } = useMouseSnapping(mousePos, isCtrlPressed, isAltPressed);
  
  const state = useStore();
  const {
    scale, setScale,
    setPosition,
    mode, 
    setDimensionInput,
    addRoomPoint,
    dimensionInput,
    setContextMenu
  } = state;

  const currentTool = useMemo(() => getToolHandler(mode), [mode]);

  const toolContext: ToolContext | null = useMemo(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    return {
      state,
      getSnappedMousePos,
      mousePos,
      stage,
      scale
    };
  }, [state, getSnappedMousePos, mousePos, stageRef.current, scale]);

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

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    if (currentTool.onMouseDown && toolContext) {
      currentTool.onMouseDown(e, toolContext);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (pointer) {
      const p = {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      };
      setMousePos(p);
      if (currentTool.onMouseMove && toolContext) {
        currentTool.onMouseMove(e, { ...toolContext, mousePos: p });
      }
    }
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool.onMouseUp && toolContext) {
      currentTool.onMouseUp(e, toolContext);
    }
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    setContextMenu({ visible: false, x: 0, y: 0, targetId: null, targetType: null });
    
    if (currentTool.onClick && toolContext) {
      currentTool.onClick(e, toolContext);
    }
  };

  const handleDimensionSubmit = useCallback(() => {
    const cm = parseFloat(dimensionInput);
    const pixelsPerCm = useStore.getState().pixelsPerCm;
    if (isNaN(cm) || cm <= 0 || state.roomPoints.length === 0) return;
    
    const lastPoint = state.roomPoints[state.roomPoints.length - 1];
    const currentMouse = getSnappedMousePos(true);
    const dx = currentMouse.x - lastPoint.x;
    const dy = currentMouse.y - lastPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;
    const targetPx = cm * pixelsPerCm;
    addRoomPoint({
      x: lastPoint.x + (dx / dist) * targetPx,
      y: lastPoint.y + (dy / dist) * targetPx,
    });
    setDimensionInput('');
  }, [dimensionInput, state.roomPoints, getSnappedMousePos, addRoomPoint, setDimensionInput]);

  return {
    mousePos,
    setMousePos,
    getSnappedMousePos,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleDimensionSubmit
  };
};
