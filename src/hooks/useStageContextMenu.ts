import Konva from 'konva';
import { useStore } from '../store';

export const useStageContextMenu = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const rooms = useStore(state => state.rooms);
  const furniture = useStore(state => state.furniture);
  const savedDimensions = useStore(state => state.dimensions);
  const selectedIds = useStore(state => state.selectedIds);
  const selectedRoomId = useStore(state => state.selectedRoomId);
  const selectedDimensionId = useStore(state => state.selectedDimensionId);
  const setSelectedId = useStore(state => state.setSelectedId);
  const setSelectedRoomId = useStore(state => state.setSelectedRoomId);
  const setSelectedDimensionId = useStore(state => state.setSelectedDimensionId);
  const setContextMenu = useStore(state => state.setContextMenu);

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
 
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
 
    const intersections = stage.getAllIntersections(pointer);
    
    // Find all valid furniture/room/dimension IDs under the pointer
    const hits: { id: string, type: 'furniture' | 'room' | 'dimension' }[] = [];
    
    intersections.forEach(node => {
      let p: Konva.Node | null = node;
      while (p && p !== stage) {
        // Skip transformers and their internal parts
        if (p.getType() === 'Transformer' || p.name().startsWith('_')) return; 
        
        const id = p.id();
        if (id) {
          // Check if we already found this ID in a previous intersection
          if (hits.some(h => h.id === id)) return;

          if (furniture.some(f => f.id === id)) {
            hits.push({ id, type: 'furniture' });
            return;
          }
          if (savedDimensions.some(d => d.id === id)) {
            hits.push({ id, type: 'dimension' });
            return;
          }
          if (rooms.some(r => r.id === id)) {
            hits.push({ id, type: 'room' });
            return;
          }
        }
        p = p.getParent();
      }
    });

    if (hits.length === 0) {
      setContextMenu({ visible: false, x: 0, y: 0, targetId: null, targetType: null });
      return;
    }

    // Priority: If any hit is already part of the current selection, use it to preserve multi-selection
    const selectedHit = hits.find(h => 
      (h.type === 'furniture' && selectedIds.includes(h.id)) ||
      (h.type === 'room' && selectedRoomId === h.id) ||
      (h.type === 'dimension' && selectedDimensionId === h.id)
    );

    const finalTarget = selectedHit || hits[0];

    // If we are right-clicking something NOT in the current selection, 
    // we should select it (clearing previous selection)
    if (!selectedHit) {
      if (finalTarget.type === 'furniture') {
        setSelectedId(finalTarget.id);
      } else if (finalTarget.type === 'room') {
        setSelectedRoomId(finalTarget.id);
      } else if (finalTarget.type === 'dimension') {
        setSelectedDimensionId(finalTarget.id);
      }
    }

    setContextMenu({
      visible: true,
      x: e.evt.clientX,
      y: e.evt.clientY,
      targetId: finalTarget.id,
      targetType: finalTarget.type,
    });
  };

  return { handleContextMenu };
};
