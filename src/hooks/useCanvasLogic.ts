import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';
import { useStore } from '../store';
import { getDistance } from '../lib/geometry';
import { useMouseSnapping } from './useMouseSnapping';

export const useCanvasLogic = (
  stageRef: React.RefObject<Konva.Stage>,
  dimensions: { width: number, height: number },
  isCtrlPressed: boolean,
  isAltPressed: boolean
) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { getSnappedMousePos } = useMouseSnapping(mousePos, isCtrlPressed, isAltPressed);
  
  const {
    scale, setScale,
    position, setPosition,
    mode, setMode,
    roomPoints, addRoomPoint, closeRoom,
    dimensionInput, setDimensionInput,
    addFurniture, setSelectedId,
    setSelectedRoomId,
    setSelectedDimensionId,
    setSelectedAttachmentId,
    addMeasurePoint,
    addWallAttachment,
    rooms
  } = useStore();

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
    const relPos = getSnappedMousePos();
    if (mode === 'add-box' || mode === 'draw-circle') {
      addRoomPoint(relPos);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (pointer) {
      setMousePos({
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      });
    }
  };

  const handleMouseUp = () => {
    if ((mode === 'add-box' || mode === 'draw-circle') && roomPoints.length === 1) {
      const start = roomPoints[0];
      const end = getSnappedMousePos();
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      if (width > 5 && height > 5) {
        addFurniture({
          type: mode === 'add-box' ? 'box' : 'circle',
          name: mode === 'add-box' ? 'New Box' : 'New Circle',
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          width,
          height,
          rotation: 0
        });
        setMode('select');
      }
      useStore.setState({ roomPoints: [] });
    }
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    if ((mode === 'add-box' || mode === 'draw-circle') && roomPoints.length > 0) return;

    useStore.getState().setContextMenu({ visible: false, x: 0, y: 0, targetId: null, targetType: null });
    const relPos = getSnappedMousePos();

    if (mode === 'calibrate') {
      const { calibrationPoints, setCalibrationPoints } = useStore.getState();
      if (!calibrationPoints) {
        setCalibrationPoints([relPos]);
      } else if (calibrationPoints.length === 1) {
        const p1 = calibrationPoints[0];
        const dist = getDistance(p1, relPos);
        useStore.getState().setTempCalibrationDist(dist);
        setCalibrationPoints(null);
      }
    } else if (mode === 'measure' || mode === 'dimension') {
      addMeasurePoint(relPos);
    } else if (mode === 'draw-room' || mode === 'draw-furniture') {
      if (roomPoints.length >= 3) {
        const threshold = 15 / scale;
        if (getDistance(relPos, roomPoints[0]) < threshold) {
          closeRoom();
          return;
        }
      }
      addRoomPoint(relPos);
    } else if (mode === 'add-box' || mode === 'draw-circle') {
      const size = 50 * useStore.getState().pixelsPerCm;
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
      if (e.target === stageRef.current) {
        setSelectedId(null);
        setSelectedRoomId(null);
        setSelectedDimensionId(null);
        setSelectedAttachmentId(null);
      }
    } else if (mode === 'add-door' || mode === 'add-window') {
      let nearestWall = null;
      let minDist = 20 / scale;
      for (const room of rooms) {
        for (let i = 0; i < room.points.length; i++) {
          const p1 = room.points[i];
          const p2 = room.points[(i + 1) % room.points.length];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const l2 = dx * dx + dy * dy;
          if (l2 === 0) continue;
          let t = ((relPos.x - p1.x) * dx + (relPos.y - p1.y) * dy) / l2;
          t = Math.max(0, Math.min(1, t));
          const projection = { x: p1.x + t * dx, y: p1.y + t * dy };
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
          width: 80
        });
        setMode('select');
      }
    }
  };

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
    addRoomPoint({
      x: lastPoint.x + (dx / dist) * targetPx,
      y: lastPoint.y + (dy / dist) * targetPx,
    });
    setDimensionInput('');
  }, [dimensionInput, roomPoints, getSnappedMousePos, addRoomPoint, setDimensionInput]);

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
