import { useEffect } from 'react';
import { useStore } from '../store';

const MAX_IMAGE_DIMENSION = 1200;

const resizeImage = (dataUrl: string, maxDimension: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width <= maxDimension && height <= maxDimension) {
        resolve(dataUrl);
        return;
      }

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      // Using jpeg with high quality to reduce data URL size while maintaining visual fidelity
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
  });
};

export const useClipboardPaste = () => {
  const { 
    activeLayer, 
    setBackgroundImage, 
    selectedId, 
    furniture, 
    updateFurniture,
    pasteImageTargetId,
    setPasteImageTargetId,
    pixelsPerCm
  } = useStore();

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      // Target selection: explicit target mode OR current selected picture
      const targetId = pasteImageTargetId || (furniture.find(f => f.id === selectedId)?.furnitureType === 'picture' ? selectedId : null);
      const targetItem = furniture.find(f => f.id === targetId);

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = async (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
              const resizedResult = await resizeImage(result, MAX_IMAGE_DIMENSION);
              
              if (targetId && targetItem) {
                // Determine aspect ratio to adjust picture object size
                const img = new Image();
                img.onload = () => {
                  const aspectRatio = img.width / img.height;
                  
                  // For a picture:
                  // width = width on wall
                  // height3d = vertical height (Z)
                  // height = depth into room (Y) -> small for pictures
                  
                  const newHeight3d = targetItem.width / aspectRatio;
                  updateFurniture(targetId, { 
                    imageUrl: resizedResult,
                    height: 2.5 * pixelsPerCm, // 2.5cm depth
                    height3d: newHeight3d
                  });
                  
                  if (pasteImageTargetId) setPasteImageTargetId(null);
                };
                img.src = resizedResult;
              } else if (activeLayer === 'blueprint') {
                setBackgroundImage(resizedResult);
              }
            }
          };
          reader.readAsDataURL(blob);
          
          // We found an image, no need to check other items
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeLayer, setBackgroundImage, selectedId, furniture, updateFurniture, pasteImageTargetId, setPasteImageTargetId]);
};
