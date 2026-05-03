import { ToolHandler } from './types';

export const SelectTool: ToolHandler = {
  onClick: (e, { state }) => {
    // If this onClick is triggered at the stage level, it means no other object handled the click
    // because objects use e.cancelBubble = true.
    // So we can safely reset all selections.
    console.log('SelectTool: resetting selection.');
    state.setSelectedIds([]);
    // Some slices might need explicit nulling if their combined effect is not enough, 
    // but looking at the slices, setSelectedIds([]) clears almost everything.
    // We add setSelectRoomId(null) just in case although setSelectedIds handles it.
    state.setSelectedRoomId(null);
  }
};
