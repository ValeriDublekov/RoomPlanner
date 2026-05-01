import React from 'react';
import { Layer, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { useStore } from '../../../store';

interface BackgroundLayerProps {
  bgImage: HTMLImageElement | undefined;
  bgRef: React.RefObject<Konva.Image | null>;
  bgTrRef: React.RefObject<Konva.Transformer | null>;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  bgImage,
  bgRef,
  bgTrRef,
}) => {
  const {
    backgroundPosition,
    backgroundScale,
    backgroundRotation,
    backgroundOpacity,
    backgroundVisible,
    setBackgroundTransform,
    activeLayer
  } = useStore();

  return (
    <Layer id="background-layer" visible={backgroundVisible}>
      {bgImage && (
        <>
          <KonvaImage
            ref={bgRef}
            image={bgImage}
            x={backgroundPosition.x}
            y={backgroundPosition.y}
            scaleX={backgroundScale}
            scaleY={backgroundScale}
            rotation={backgroundRotation}
            opacity={backgroundOpacity}
            draggable={activeLayer === 'blueprint'}
            onDragEnd={(e) => {
              setBackgroundTransform({ x: e.target.x(), y: e.target.y() });
            }}
            onTransformEnd={() => {
              const node = bgRef.current;
              if (node) {
                setBackgroundTransform({
                  x: node.x(),
                  y: node.y(),
                  scale: node.scaleX(),
                  rotation: node.rotation(),
                });
              }
            }}
          />
          {activeLayer === 'blueprint' && (
            <Transformer
              ref={bgTrRef}
              rotateEnabled={true}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
            />
          )}
        </>
      )}
    </Layer>
  );
};
