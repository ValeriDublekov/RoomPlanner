import { AppMode } from '../../types';
import { ToolHandler } from './types';
import { SelectTool } from './SelectTool';
import { CalibrationTool } from './CalibrationTool';
import { MeasurementTool } from './MeasurementTool';
import { DrawTool } from './DrawTool';
import { PrimitiveTool } from './PrimitiveTool';
import { PlaceFurnitureTool } from './PlaceFurnitureTool';
import { AttachmentTool } from './AttachmentTool';

export const TOOL_REGISTRY: Record<AppMode, ToolHandler> = {
  'select': SelectTool,
  'calibrate': CalibrationTool,
  'measure': MeasurementTool,
  'dimension': MeasurementTool,
  'draw-room': DrawTool,
  'draw-furniture': DrawTool,
  'add-box': PrimitiveTool,
  'draw-circle': PrimitiveTool,
  'place-furniture': PlaceFurnitureTool,
  'add-door': AttachmentTool,
  'add-window': AttachmentTool
};

export const getToolHandler = (mode: AppMode): ToolHandler => {
  return TOOL_REGISTRY[mode] || SelectTool;
};
