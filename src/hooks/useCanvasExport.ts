import Konva from 'konva';
import { useStore } from '../store';
import { getFurnitureVertices } from '../lib/geometry';

export const useCanvasExport = (stageRef: React.RefObject<Konva.Stage>) => {
  const handleExport = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    const wasGridVisible = useStore.getState().gridVisible;
    const selectedId = useStore.getState().selectedId;
    const selectedIds = useStore.getState().selectedIds;
    const selectedRoomId = useStore.getState().selectedRoomId;
    const selectedDimensionId = useStore.getState().selectedDimensionId;
    const selectedAttachmentId = useStore.getState().selectedAttachmentId;

    useStore.getState().setGridVisible(false);
    useStore.getState().setSelectedId(null);
    useStore.getState().setSelectedIds([]);
    useStore.getState().setSelectedRoomId(null);
    useStore.getState().setSelectedDimensionId(null);
    useStore.getState().setSelectedAttachmentId(null);

    const { rooms, furniture, dimensions: savedDimensions } = useStore.getState();
    const allPoints: { x: number; y: number }[] = [];
    rooms.forEach(r => allPoints.push(...r.points));
    furniture.forEach(f => allPoints.push(...getFurnitureVertices(f)));
    savedDimensions.forEach(d => { allPoints.push(d.p1); allPoints.push(d.p2); });

    if (allPoints.length === 0) {
      useStore.getState().setGridVisible(wasGridVisible);
      return;
    }

    const minX = Math.min(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const maxY = Math.max(...allPoints.map(p => p.y));

    const padding = 50;
    const exportArea = {
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + padding * 2,
      height: (maxY - minY) + padding * 2
    };

    const bgLayer = stage.findOne('#background-layer') as Konva.Layer;
    const whiteRect = new Konva.Rect({
      x: exportArea.x,
      y: exportArea.y,
      width: exportArea.width,
      height: exportArea.height,
      fill: 'white',
      listening: false,
    });
    
    if (bgLayer) {
      bgLayer.add(whiteRect);
      whiteRect.moveToBottom();
    }

    await new Promise(resolve => setTimeout(resolve, 60));

    const currentScale = stage.scaleX();
    const currentPos = stage.position();

    const dataURL = stage.toDataURL({
      x: exportArea.x * currentScale + currentPos.x,
      y: exportArea.y * currentScale + currentPos.y,
      width: exportArea.width * currentScale,
      height: exportArea.height * currentScale,
      pixelRatio: Math.max(1, 3 / currentScale),
    });

    whiteRect.destroy();
    useStore.getState().setGridVisible(wasGridVisible);
    useStore.getState().setSelectedId(selectedId);
    useStore.getState().setSelectedIds(selectedIds);
    useStore.getState().setSelectedRoomId(selectedRoomId);
    useStore.getState().setSelectedDimensionId(selectedDimensionId);
    useStore.getState().setSelectedAttachmentId(selectedAttachmentId);

    const link = document.createElement('a');
    const projectName = useStore.getState().projectName || 'project';
    link.download = `${projectName.trim().replace(/\s+/g, '-')}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    const wasGridVisible = useStore.getState().gridVisible;
    const selectedId = useStore.getState().selectedId;
    const selectedIds = useStore.getState().selectedIds;
    const selectedRoomId = useStore.getState().selectedRoomId;
    const selectedDimensionId = useStore.getState().selectedDimensionId;
    const selectedAttachmentId = useStore.getState().selectedAttachmentId;

    useStore.getState().setGridVisible(false);
    useStore.getState().setSelectedId(null);
    useStore.getState().setSelectedIds([]);
    useStore.getState().setSelectedRoomId(null);
    useStore.getState().setSelectedDimensionId(null);
    useStore.getState().setSelectedAttachmentId(null);

    const { rooms, furniture, dimensions: savedDimensions } = useStore.getState();
    const allPoints: { x: number; y: number }[] = [];
    rooms.forEach(r => allPoints.push(...r.points));
    furniture.forEach(f => allPoints.push(...getFurnitureVertices(f)));
    savedDimensions.forEach(d => { allPoints.push(d.p1); allPoints.push(d.p2); });

    if (allPoints.length === 0) {
      useStore.getState().setGridVisible(wasGridVisible);
      return;
    }

    const minX = Math.min(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const maxY = Math.max(...allPoints.map(p => p.y));

    const padding = 50;
    const exportArea = {
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + padding * 2,
      height: (maxY - minY) + padding * 2
    };

    const bgLayer = stage.findOne('#background-layer') as Konva.Layer;
    const whiteRect = new Konva.Rect({
      x: exportArea.x,
      y: exportArea.y,
      width: exportArea.width,
      height: exportArea.height,
      fill: 'white',
      listening: false,
    });
    
    if (bgLayer) {
      bgLayer.add(whiteRect);
      whiteRect.moveToBottom();
    }

    await new Promise(resolve => setTimeout(resolve, 60));

    const currentScale = stage.scaleX();
    const currentPos = stage.position();

    const dataURL = stage.toDataURL({
      x: exportArea.x * currentScale + currentPos.x,
      y: exportArea.y * currentScale + currentPos.y,
      width: exportArea.width * currentScale,
      height: exportArea.height * currentScale,
      pixelRatio: Math.max(1, 3 / currentScale),
    });

    whiteRect.destroy();
    useStore.getState().setGridVisible(wasGridVisible);
    useStore.getState().setSelectedId(selectedId);
    useStore.getState().setSelectedIds(selectedIds);
    useStore.getState().setSelectedRoomId(selectedRoomId);
    useStore.getState().setSelectedDimensionId(selectedDimensionId);
    useStore.getState().setSelectedAttachmentId(selectedAttachmentId);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print Plan - ${useStore.getState().projectName}</title>
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: white; }
            img { width: 100%; height: auto; display: block; max-width: 100%; }
            @page { margin: 1cm; size: landscape; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <img src="${dataURL}" />
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => {
                window.frameElement.remove();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  return { handleExport, handlePrint };
};
