# Export And 3D

## Export Surfaces

The project exposes multiple export mechanisms:

- 2D image export from the Konva stage
- DXF export from project state
- OBJ export from a generated Three.js scene
- GLB export from a generated Three.js scene
- 3D preview image export from the WebGL canvas

## Main Files

- `src/hooks/useCanvasExport.ts`
- `src/lib/dxfExport.ts`
- `src/lib/objExport.ts`
- `src/lib/glbExport.ts`
- `src/lib/threeSceneGenerator.ts`
- `src/components/ThreeD/ThreeDPreview.tsx`

## Current Design Characteristic

Export helpers are not purely computational. Some of them directly trigger browser downloads using:

- `Blob`
- `URL.createObjectURL`
- `document.createElement('a')`

This means export code changes often affect both generation logic and browser-side delivery behavior.

## 3D Scene Source Of Truth

The 3D view is not a separate data model. It is derived from the same store-backed project state used by the 2D editor.

Key inputs include:

- rooms
- furniture
- wall attachments
- `pixelsPerCm`
- wall thickness and height

## Furniture Rendering Notes

`ThreeDPreview.tsx` renders many furniture types by switching on `furnitureType` and, in fallback cases, infers behavior from `catalogId` content.

This means catalog naming conventions can affect runtime 3D rendering.

## Testing Notes

There is already export-related test coverage in `src/lib/export.test.ts`.

Those tests:

- mock Blob, URL, and DOM download behavior
- exercise DXF, OBJ, GLB, and scene generation at a basic level

If export changes are made, start by extending these tests rather than inventing a separate test style.
