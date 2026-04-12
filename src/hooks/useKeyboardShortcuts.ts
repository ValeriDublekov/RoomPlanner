import { useEffect } from 'react';
import { useStore } from '../store';

export const useKeyboardShortcuts = (
  setIsCtrlPressed: (pressed: boolean) => void,
  handleDimensionSubmit: () => void
) => {
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
    deleteRoom,
    selectedDimensionId,
    deleteDimension,
    undo,
    orthoMode,
    setOrthoMode,
    snapToGrid,
    setSnapToGrid,
    moveView
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Control') setIsCtrlPressed(true);
      if (e.key === 'Alt') {
        e.preventDefault();
        useStore.getState().setIsAltPressed(true);
      }
      
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
          case 'o': setMode('draw-circle'); break;
          case 'h': setOrthoMode(!orthoMode); break;
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
      if (e.key === 'Alt') useStore.getState().setIsAltPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, roomPoints, dimensionInput, selectedId, selectedRoomId, orthoMode, snapToGrid, setIsCtrlPressed, handleDimensionSubmit, setDimensionInput, setSelectedId, setSelectedRoomId, setMode, setOrthoMode, setSnapToGrid, moveView, deleteRoom, selectedDimensionId, deleteDimension, undo]);
};
