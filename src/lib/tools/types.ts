import Konva from 'konva';
import { AppState } from '../../store';

export interface ToolContext {
  state: AppState;
  getSnappedMousePos: (isInputRef?: boolean) => { x: number; y: number; suggestedRotation?: number };
  mousePos: { x: number; y: number };
  stage: Konva.Stage;
  scale: number;
}

export interface ToolHandler {
  onMouseDown?: (e: Konva.KonvaEventObject<MouseEvent>, context: ToolContext) => void;
  onMouseMove?: (e: Konva.KonvaEventObject<MouseEvent>, context: ToolContext) => void;
  onMouseUp?: (e: Konva.KonvaEventObject<MouseEvent>, context: ToolContext) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>, context: ToolContext) => void;
  onDblClick?: (e: Konva.KonvaEventObject<MouseEvent>, context: ToolContext) => void;
  onSubmitDimension?: (context: ToolContext) => void;
}
