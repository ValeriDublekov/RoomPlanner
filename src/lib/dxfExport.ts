import Drawing from 'dxf-writer';
import { RoomObject, FurnitureObject, WallAttachment, DimensionObject } from '../types';

export interface DXFRoomData {
  rooms: RoomObject[];
  furniture: FurnitureObject[];
  attachments: WallAttachment[];
  dimensions: DimensionObject[];
  pixelsPerCm: number;
}

export const exportToDXF = (data: DXFRoomData) => {
  const { rooms, furniture, attachments, dimensions, pixelsPerCm } = data;
  const drawing = new Drawing();
  drawing.setUnits('Centimeters');

  // Helper to transform Y coordinate (Invert Y for CAD) and Scale pixels to cm
  const sc = (val: number) => val / pixelsPerCm;
  const txY = (y: number) => -sc(y);
  const txX = (x: number) => sc(x);

  // 1. Define Layers
  drawing.addLayer('Walls', Drawing.ACI.WHITE, 'CONTINUOUS');
  drawing.addLayer('Furniture', Drawing.ACI.CYAN, 'CONTINUOUS');
  drawing.addLayer('Dimensions', Drawing.ACI.MAGENTA, 'CONTINUOUS');
  drawing.addLayer('Windows', Drawing.ACI.BLUE, 'CONTINUOUS');
  drawing.addLayer('Doors', Drawing.ACI.YELLOW, 'CONTINUOUS');

  // 2. Draw Rooms (Walls)
  rooms.forEach(room => {
    const points = room.points;
    drawing.setActiveLayer('Walls');
    
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const nextIndex = (i + 1) % points.length;
      if (!room.isClosed && nextIndex === 0) continue;
      const p2 = points[nextIndex];
      
      drawing.drawLine(txX(p1.x), txY(p1.y), txX(p2.x), txY(p2.y));

      // Add Dimension Text
      drawing.setActiveLayer('Dimensions');
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const pixelLength = Math.sqrt(dx * dx + dy * dy);
      const cmLength = pixelLength / pixelsPerCm;

      if (cmLength > 10) { // Only label segments longer than 10cm
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        
        // Offset normal direction (outward-ish)
        const nx = -dy / pixelLength;
        const ny = dx / pixelLength;
        const offset = 15; // 15cm offset for label
        
        const labelX = midX + nx * offset * pixelsPerCm;
        const labelY = midY + ny * offset * pixelsPerCm;
        
        // Calculate text rotation (in degrees)
        // In web: Math.atan2(dy, dx)
        // In CAD: Math.atan2(-dy, dx)
        let angle = Math.atan2(-dy, dx) * (180 / Math.PI);
        
        // Normalize angle to be readable (not upside down)
        if (angle > 90) angle -= 180;
        if (angle < -90) angle += 180;
        
        drawing.drawText(
          txX(labelX), 
          txY(labelY), 
          10, // text height in units (cm)
          angle, // DXF rotation is CCW
          `${cmLength.toFixed(1)} cm`,
          'center',
          'middle'
        );
      }
      drawing.setActiveLayer('Walls');
    }
  });

  // 3. Draw Furniture (with nesting support)
  drawing.setActiveLayer('Furniture');

  const drawPiece = (item: FurnitureObject, parentPX = 0, parentPY = 0, parentRot = 0) => {
    // Rotation is in degrees (clockwise in web)
    const rad = (parentRot * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // item.x/y are relative to parent group's center in Konva
    // BUT in our store structure, for top level items, x/y are TOP-LEFT world pixels.
    // For CHILDREN in a group, they are TOP-LEFT relative to the parent's boundaries.
    
    // In Konva groups, children are often placed relative to something.
    // Let's assume item.x/y are relative to the parent's TOP-LEFT if it's a child.
    
    // Position of current item's center RELATIVE to parent's top-left
    const localCX = item.x + item.width / 2;
    const localCY = item.y + item.height / 2;

    // World pixel coordinates of center
    const worldCX = parentPX + (localCX * cos - localCY * sin);
    const worldCY = parentPY + (localCX * sin + localCY * cos);
    const worldRot = parentRot + item.rotation;

    if (item.type === 'group' && item.children) {
      // For groups, children's coordinates are relative to the group's internal (0,0) position.
      // The group's (0,0) was at worldCX - w/2, worldCY - h/2 before parent rotation.
      // After parent rotation, we need to find that world point:
      const pRad = (parentRot * Math.PI) / 180;
      const pCos = Math.cos(pRad);
      const pSin = Math.sin(pRad);
      
      const pivotX = worldCX + ((-item.width/2) * pCos - (-item.height/2) * pSin);
      const pivotY = worldCY + ((-item.width/2) * pSin + (-item.height/2) * pCos);
      
      item.children.forEach(child => drawPiece(child, pivotX, pivotY, worldRot));
      return;
    }

    if (item.type === 'circle') {
      drawing.drawCircle(txX(worldCX), txY(worldCY), sc(item.width / 2));
      return;
    }

    // Rectangle piece
    const halfW = item.width / 2;
    const halfH = item.height / 2;
    
    const worldRad = (worldRot * Math.PI) / 180;
    const wCos = Math.cos(worldRad);
    const wSin = Math.sin(worldRad);

    const corners = [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: -halfW, y: halfH }
    ];

    const rotatedCorners: [number, number][] = corners.map(p => {
      const wx = worldCX + (p.x * wCos - p.y * wSin);
      const wy = worldCY + (p.x * wSin + p.y * wCos);
      return [txX(wx), txY(wy)];
    });

    drawing.drawPolyline(rotatedCorners, true);
  };

  furniture.forEach(item => drawPiece(item));

  // 3. Draw Attachments (Doors/Windows)
  attachments.forEach(att => {
    const room = rooms.find(r => r.id === att.roomId);
    if (!room) return;

    const p1 = room.points[att.wallSegmentIndex];
    const p2 = room.points[(att.wallSegmentIndex + 1) % room.points.length];
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return;

    const posX = p1.x + dx * att.positionAlongWall;
    const posY = p1.y + dy * att.positionAlongWall;

    const tx_unit = dx / length;
    const ty_unit = dy / length;
    
    const widthPx = att.width * pixelsPerCm;
    const halfWPx = widthPx / 2;
    
    const startX = posX - tx_unit * halfWPx;
    const startY = posY - ty_unit * halfWPx;
    const endX = posX + tx_unit * halfWPx;
    const endY = posY + ty_unit * halfWPx;

    if (att.type === 'window') {
      drawing.setActiveLayer('Windows');
      
      const nx = -ty_unit * 4 * pixelsPerCm;
      const ny = tx_unit * 4 * pixelsPerCm;
      
      drawing.drawLine(txX(startX), txY(startY), txX(endX), txY(endY));
      drawing.drawLine(txX(startX + nx), txY(startY + ny), txX(endX + nx), txY(endY + ny));
      drawing.drawLine(txX(startX), txY(startY), txX(startX + nx), txY(startY + ny));
      drawing.drawLine(txX(endX), txY(endY), txX(endX + nx), txY(endY + ny));
      
    } else if (att.type === 'door') {
      drawing.setActiveLayer('Doors');
      
      drawing.drawLine(txX(startX), txY(startY), txX(endX), txY(endY));
      
      const flipFactor = att.flipY ? 1 : -1;
      const sideFactor = att.flipX ? -1 : 1;
      
      const nx = -ty_unit * widthPx * flipFactor;
      const ny = tx_unit * widthPx * flipFactor;
      
      const leafStartX = sideFactor === 1 ? startX : endX;
      const leafStartY = sideFactor === 1 ? startY : endY;
      
      const leafEndX = leafStartX + nx;
      const leafEndY = leafStartY + ny;
      
      drawing.drawLine(txX(leafStartX), txY(leafStartY), txX(leafEndX), txY(leafEndY));

      const radiusCm = att.width;
      const wallAngleWeb = Math.atan2(dy, dx) * (180 / Math.PI);
      
      let hingeAngleWeb = wallAngleWeb;
      if (sideFactor === -1) hingeAngleWeb += 180;
      
      const hingeAngleCAD = -hingeAngleWeb;
      const sweepAngle = 90 * flipFactor * sideFactor;
      const cadSweep = -sweepAngle; 

      const a1 = hingeAngleCAD;
      const a2 = hingeAngleCAD + cadSweep;
      
      drawing.drawArc(
        txX(leafStartX),
        txY(leafStartY),
        radiusCm,
        Math.min(a1, a2),
        Math.max(a1, a2)
      );
    }
  });

  // 4. Draw Manual Dimensions
  drawing.setActiveLayer('Dimensions');
  dimensions.forEach(dim => {
    const { p1, p2 } = dim;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelLength = Math.sqrt(dx * dx + dy * dy);
    const cmLength = pixelLength / pixelsPerCm;

    // Line
    drawing.drawLine(txX(p1.x), txY(p1.y), txX(p2.x), txY(p2.y));

    // Tick marks (small cross lines at ends)
    const tx_unit = dx / pixelLength;
    const ty_unit = dy / pixelLength;
    const nx = -ty_unit * 5; // 5px tick
    const ny = tx_unit * 5;

    drawing.drawLine(txX(p1.x + nx), txY(p1.y + ny), txX(p1.x - nx), txY(p1.y - ny));
    drawing.drawLine(txX(p2.x + nx), txY(p2.y + ny), txX(p2.x - nx), txY(p2.y - ny));

    // Label
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    
    const labelX = midX + nx * 3; // Offset label slightly from line
    const labelY = midY + ny * 3;
    
    let angle = Math.atan2(-dy, dx) * (180 / Math.PI);
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;
    
    drawing.drawText(
      txX(labelX), 
      txY(labelY), 
      8, // slightly smaller text for manual dimensions
      angle,
      `${cmLength.toFixed(1)} cm`,
      'center',
      'middle'
    );
  });

  const dxfString = drawing.toDxfString();
  const blob = new Blob([dxfString], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plan.dxf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
