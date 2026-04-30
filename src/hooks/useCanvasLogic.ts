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
  
  const scale = useStore(state => state.scale);
  const setScale = useStore(state => state.setScale);
  const setPosition = useStore(state => state.setPosition);
  const mode = useStore(state => state.mode);
  const setContextMenu = useStore(state => state.setContextMenu);

  const currentTool = useMemo(() => getToolHandler(mode), [mode]);

  const toolContext: ToolContext | null = useMemo(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    return {
      state: useStore.getState(),
      getSnappedMousePos,
      mousePos,
      stage,
      scale
    };
  }, [getSnappedMousePos, mousePos, stageRef.current, scale]);

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

  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool.onDblClick && toolContext) {
      currentTool.onDblClick(e, toolContext);
    }
  };

  const handleDimensionSubmit = useCallback(() => {
    if (currentTool.onSubmitDimension && toolContext) {
      currentTool.onSubmitDimension(toolContext);
    }
  }, [currentTool, toolContext]);

  return {
    mousePos,
    setMousePos,
    getSnappedMousePos,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleDblClick,
    handleDimensionSubmit
  };
};
