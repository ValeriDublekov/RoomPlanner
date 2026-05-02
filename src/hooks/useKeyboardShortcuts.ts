import { useEffect } from 'react';
import { useStore } from '../store';
import { isUserTyping } from '../lib/keyboard';

export const useKeyboardShortcuts = () => {
  const { setIsCtrlPressed } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global typing guard
      if (isUserTyping(e)) {
        return;
      }

      const state = useStore.getState();
      const { 
        mode, 
        setMode, 
        roomPoints, 
        dimensionInput, 
        setDimensionInput,
        selectedId, 
        setSelectedId,
        selectedRoomId, 
        setSelectedRoomId,
        selectedDimensionId,
        setSelectedDimensionId,
        undo,
        groupSelected,
        ungroupSelected,
        orthoMode,
        setOrthoMode,
        snapToGrid,
        setSnapToGrid,
        snapToObjects,
        setSnapToObjects,
        moveView,
        activeLayer,
        show3d,
        selectedAttachmentId,
        flipSelectedAttachment,
        submitDimension
      } = state;

      if (e.key === 'Control') setIsCtrlPressed(true);
      if (e.key === 'Alt') {
        e.preventDefault();
        state.setIsAltPressed(true);
      }
      
      const panStep = 20;
      if (e.key === 'ArrowUp') { moveView(0, panStep); return; }
      if (e.key === 'ArrowDown') { moveView(0, -panStep); return; }
      if (e.key === 'ArrowLeft') { moveView(panStep, 0); return; }
      if (e.key === 'ArrowRight') { moveView(-panStep, 0); return; }

      // Special check for 3D mode to avoid WASD conflicts
      if (show3d && !e.ctrlKey && !e.metaKey) {
        return;
      }

      if ((mode === 'draw-room' || mode === 'draw-furniture' || mode === 'draw-beam') && roomPoints.length > 0) {
        if (e.key >= '0' && e.key <= '9' || e.key === '.') {
          setDimensionInput(dimensionInput + e.key);
          return;
        } else if (e.key === 'Backspace') {
          setDimensionInput(dimensionInput.slice(0, -1));
          return;
        } else if (e.key === 'Enter' && dimensionInput) {
          submitDimension();
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
        setSelectedDimensionId(null);
        state.setSelectedAttachmentId(null);
        state.setSelectedBeamId(null);
        state.setPendingFurniture(null);
        setMode('select');
        return;
      }

      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'v': setMode('select'); break;
          case 'r': 
            setMode('draw-room'); 
            setSelectedId(null);
            setSelectedRoomId(null);
            setSelectedDimensionId(null);
            break;
          case 'b': 
            setMode('add-box'); 
            setSelectedId(null);
            setSelectedRoomId(null);
            setSelectedDimensionId(null);
            break;
          case 'f': 
            if (activeLayer === 'room' && selectedAttachmentId) {
              flipSelectedAttachment();
            } else {
              setMode('draw-furniture'); 
              setSelectedId(null);
              setSelectedRoomId(null);
              setSelectedDimensionId(null);
            }
            break;
          case 'c': 
            setMode('calibrate'); 
            setSelectedId(null);
            setSelectedRoomId(null);
            setSelectedDimensionId(null);
            break;
          case 'm': 
            setMode('measure'); 
            setSelectedId(null);
            setSelectedRoomId(null);
            setSelectedDimensionId(null);
            break;
          case 'd': 
            setMode('dimension'); 
            setSelectedId(null);
            setSelectedRoomId(null);
            setSelectedDimensionId(null);
            break;
          case 'o': 
            setMode('draw-circle'); 
            setSelectedId(null);
            setSelectedRoomId(null);
            setSelectedDimensionId(null);
            break;
          case 'h': setOrthoMode(!orthoMode); break;
          case 's': 
            if (activeLayer === 'furniture') {
              setSnapToObjects(!snapToObjects);
            } else {
              setSnapToGrid(!snapToGrid);
            }
            break;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!dimensionInput) {
          state.deleteSelected();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelected();
        } else {
          groupSelected();
        }
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'c') {
          state.copySelected();
        } else if (e.key.toLowerCase() === 'v') {
          state.paste();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(false);
      if (e.key === 'Alt') useStore.getState().setIsAltPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setIsCtrlPressed]);
};
