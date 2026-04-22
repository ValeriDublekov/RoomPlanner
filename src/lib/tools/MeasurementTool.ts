import { ToolHandler } from './types';

export const MeasurementTool: ToolHandler = {
  onClick: (e, { state, getSnappedMousePos }) => {
    state.addMeasurePoint(getSnappedMousePos());
  }
};
