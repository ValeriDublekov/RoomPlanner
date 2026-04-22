import { ToolHandler } from './types';

export const SelectTool: ToolHandler = {
  onClick: (e, { state }) => {
    if (e.target === e.target.getStage()) {
      state.setSelectedId(null);
      state.setSelectedRoomId(null);
      state.setSelectedDimensionId(null);
      state.setSelectedAttachmentId(null);
      state.setSelectedIds([]);
    }
  }
};
