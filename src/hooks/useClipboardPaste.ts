import { useEffect } from 'react';
import { useStore } from '../store';

export const useClipboardPaste = () => {
  const { activeLayer, setBackgroundImage } = useStore();

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      // Only allow pasting images in blueprint layer
      if (activeLayer !== 'blueprint') return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
              setBackgroundImage(result);
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
  }, [activeLayer, setBackgroundImage]);
};
