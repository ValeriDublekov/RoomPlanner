import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Crop, RotateCw, Check, AlertTriangle, CheckCircle2, Sparkles, RotateCcw } from 'lucide-react';
import {
  CropRect,
  cropAndCompressImage,
  clampCropRect,
  formatBytes,
  ProcessedImageResult,
} from '../../lib/imageUtils';

export interface BlueprintApplyMeta {
  crop: CropRect;
  rotationDeg: 0 | 90 | 180 | 270;
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
}

export interface BlueprintUploadModalProps {
  isOpen: boolean;
  imageDataUrl: string | null;
  fileName?: string;
  originalBytes?: number;
  onConfirm: (processedDataUrl: string, meta: BlueprintApplyMeta) => void;
  onCancel: () => void;
}

type DragHandle =
  | 'move'
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

const FULL_CROP: CropRect = { x: 0, y: 0, width: 1, height: 1 };

const RESOLUTION_PRESETS: Array<{ label: string; value: number | null }> = [
  { label: '1000 px', value: 1000 },
  { label: '1400 px', value: 1400 },
  { label: '1800 px', value: 1800 },
  { label: 'Original', value: null },
];

// Leave headroom inside Firestore's 1 MB document limit for rooms/furniture JSON
const CLOUD_SAFE_BYTES = 750 * 1024;
const CLOUD_MAX_BYTES = 920 * 1024;

export const BlueprintUploadModal: React.FC<BlueprintUploadModalProps> = ({
  isOpen,
  imageDataUrl,
  fileName = 'Blueprint Image',
  originalBytes,
  onConfirm,
  onCancel,
}) => {
  const [crop, setCrop] = useState<CropRect>(FULL_CROP);
  const [rotationDeg, setRotationDeg] = useState<0 | 90 | 180 | 270>(0);
  const [maxDimension, setMaxDimension] = useState<number | null>(1400);
  const [quality, setQuality] = useState<number>(0.82);
  const [previewResult, setPreviewResult] = useState<ProcessedImageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [rotatedPreviewUrl, setRotatedPreviewUrl] = useState<string | null>(null);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    handle: DragHandle;
    startX: number;
    startY: number;
    startCrop: CropRect;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !imageDataUrl) return;

    let cancelled = false;

    if (rotationDeg === 0) {
      const img = new Image();
      img.onload = () => {
        if (!cancelled) {
          setNaturalSize({ width: img.width, height: img.height });
        }
      };
      img.src = imageDataUrl;
      return () => {
        cancelled = true;
      };
    }

    cropAndCompressImage(imageDataUrl, {
      crop: FULL_CROP,
      maxDimension: 1800,
      quality: 0.92,
      rotationDeg,
    })
      .then((res) => {
        if (!cancelled) {
          setRotatedPreviewUrl(res.dataUrl);
          setNaturalSize({ width: res.width, height: res.height });
        }
      })
      .catch(() => {
        if (!cancelled) setRotatedPreviewUrl(imageDataUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, imageDataUrl, rotationDeg]);

  // Debounced live calculation of output size & dimensions
  useEffect(() => {
    if (!isOpen || !imageDataUrl) return;
    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;
      setIsProcessing(true);
      cropAndCompressImage(imageDataUrl, {
        crop,
        maxDimension,
        quality,
        rotationDeg,
      })
        .then((res) => {
          if (!cancelled) {
            setPreviewResult(res);
          }
        })
        .catch(() => {
          // Keep previous preview on transient error
        })
        .finally(() => {
          if (!cancelled) setIsProcessing(false);
        });
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, imageDataUrl, crop, maxDimension, quality, rotationDeg]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const drag = dragStateRef.current;
    const container = imageContainerRef.current;
    if (!drag || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dx = (e.clientX - drag.startX) / rect.width;
    const dy = (e.clientY - drag.startY) / rect.height;
    const s = drag.startCrop;
    const minSize = 0.08;

    let next: CropRect = { ...s };

    if (drag.handle === 'move') {
      next.x = Math.max(0, Math.min(1 - s.width, s.x + dx));
      next.y = Math.max(0, Math.min(1 - s.height, s.y + dy));
    } else {
      let left = s.x;
      let top = s.y;
      let right = s.x + s.width;
      let bottom = s.y + s.height;

      if (drag.handle.includes('w')) {
        left = Math.max(0, Math.min(right - minSize, s.x + dx));
      }
      if (drag.handle.includes('e')) {
        right = Math.min(1, Math.max(left + minSize, s.x + s.width + dx));
      }
      if (drag.handle.includes('n')) {
        top = Math.max(0, Math.min(bottom - minSize, s.y + dy));
      }
      if (drag.handle.includes('s')) {
        bottom = Math.min(1, Math.max(top + minSize, s.y + s.height + dy));
      }

      next = {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      };
    }

    setCrop(clampCropRect(next, minSize));
  }, []);

  const handlePointerUp = useCallback(() => {
    dragStateRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onCancel]);

  if (!isOpen || !imageDataUrl) return null;

  const displayPreviewUrl = rotationDeg === 0 ? imageDataUrl : (rotatedPreviewUrl ?? imageDataUrl);

  const handleDragStart = (handle: DragHandle, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragStateRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: crop,
    };
  };

  const handleRotate = () => {
    setRotationDeg((prev) => (((prev + 90) % 360) as 0 | 90 | 180 | 270));
    setCrop(FULL_CROP);
  };

  const handleAutoOptimize = async () => {
    if (!imageDataUrl) return;
    const candidates: Array<{ maxDim: number; q: number }> = [
      { maxDim: 1400, q: 0.78 },
      { maxDim: 1200, q: 0.72 },
      { maxDim: 1000, q: 0.65 },
      { maxDim: 800, q: 0.55 },
    ];
    for (const preset of candidates) {
      const res = await cropAndCompressImage(imageDataUrl, {
        crop,
        maxDimension: preset.maxDim,
        quality: preset.q,
        rotationDeg,
      });
      if (res.byteSize <= CLOUD_SAFE_BYTES || preset.maxDim === 800) {
        setMaxDimension(preset.maxDim);
        setQuality(preset.q);
        setPreviewResult(res);
        break;
      }
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const finalResult = await cropAndCompressImage(imageDataUrl, {
        crop,
        maxDimension,
        quality,
        rotationDeg,
      });
      onConfirm(finalResult.dataUrl, {
        crop,
        rotationDeg,
        sourceWidth: finalResult.sourceWidth ?? naturalSize?.width ?? finalResult.width,
        sourceHeight: finalResult.sourceHeight ?? naturalSize?.height ?? finalResult.height,
        outputWidth: finalResult.width,
        outputHeight: finalResult.height,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const estimatedBytes = previewResult?.byteSize ?? originalBytes ?? 0;
  const isCloudSafe = estimatedBytes <= CLOUD_SAFE_BYTES;
  const isCloudWarning = estimatedBytes > CLOUD_SAFE_BYTES && estimatedBytes <= CLOUD_MAX_BYTES;
  const isCloudTooLarge = estimatedBytes > CLOUD_MAX_BYTES;
  const isCropped =
    crop.x > 0.005 || crop.y > 0.005 || crop.width < 0.995 || crop.height < 0.995;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Prepare Blueprint Image"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Crop size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 truncate">
                Prepare Blueprint Image
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                <span className="truncate max-w-[240px] font-medium text-slate-600">{fileName}</span>
                {originalBytes ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Original: {formatBytes(originalBytes)}
                    </span>
                  </>
                ) : null}
                {naturalSize ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {naturalSize.width} × {naturalSize.height} px
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Interactive Crop Viewport */}
          <div className="flex-1 bg-slate-900 p-5 flex flex-col gap-3 min-h-[320px] lg:min-h-[460px] relative overflow-hidden select-none">
            <div className="flex items-center justify-between gap-3 w-full text-xs text-slate-300 shrink-0">
              <span className="flex items-center gap-1.5 text-slate-300 truncate">
                <Crop size={14} className="text-indigo-400 shrink-0" />
                <span className="truncate">Drag corners or edges to crop unused margins</span>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-100 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCw size={13} />
                  Rotate 90°
                </button>
                {isCropped && (
                  <button
                    type="button"
                    onClick={() => setCrop(FULL_CROP)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-100 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    <RotateCcw size={13} />
                    Reset Crop
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 w-full flex items-center justify-center p-3">
              <div
                ref={imageContainerRef}
                className="relative inline-block max-w-full max-h-[54vh] shadow-2xl ring-1 ring-white/15 touch-none"
              >
                <img
                  src={displayPreviewUrl}
                  alt={fileName}
                  draggable={false}
                  className="block max-w-full max-h-[54vh] object-contain pointer-events-none select-none"
                />

                {/* Dimmed Outside Overlay (4 panels around crop box) */}
                <div
                  className="absolute inset-x-0 top-0 bg-slate-950/65 pointer-events-none"
                  style={{ height: `${crop.y * 100}%` }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 bg-slate-950/65 pointer-events-none"
                  style={{ height: `${(1 - crop.y - crop.height) * 100}%` }}
                />
                <div
                  className="absolute left-0 bg-slate-950/65 pointer-events-none"
                  style={{
                    top: `${crop.y * 100}%`,
                    height: `${crop.height * 100}%`,
                    width: `${crop.x * 100}%`,
                  }}
                />
                <div
                  className="absolute right-0 bg-slate-950/65 pointer-events-none"
                  style={{
                    top: `${crop.y * 100}%`,
                    height: `${crop.height * 100}%`,
                    width: `${(1 - crop.x - crop.width) * 100}%`,
                  }}
                />

                {/* Active Crop Frame */}
                <div
                  onPointerDown={(e) => handleDragStart('move', e)}
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.width * 100}%`,
                    height: `${crop.height * 100}%`,
                  }}
                  className="absolute border-2 border-indigo-400 shadow-[0_0_0_1px_rgba(255,255,255,0.35)] cursor-move"
                >
                  {/* Rule-of-thirds alignment guides */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                  </div>

                  {/* Corner Handles */}
                  <div
                    onPointerDown={(e) => handleDragStart('nw', e)}
                    className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm shadow-md cursor-nwse-resize"
                  />
                  <div
                    onPointerDown={(e) => handleDragStart('ne', e)}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm shadow-md cursor-nesw-resize"
                  />
                  <div
                    onPointerDown={(e) => handleDragStart('sw', e)}
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm shadow-md cursor-nesw-resize"
                  />
                  <div
                    onPointerDown={(e) => handleDragStart('se', e)}
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm shadow-md cursor-nwse-resize"
                  />

                  {/* Edge Handles */}
                  <div
                    onPointerDown={(e) => handleDragStart('n', e)}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border border-indigo-600 rounded-sm shadow-md cursor-ns-resize"
                  />
                  <div
                    onPointerDown={(e) => handleDragStart('s', e)}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border border-indigo-600 rounded-sm shadow-md cursor-ns-resize"
                  />
                  <div
                    onPointerDown={(e) => handleDragStart('w', e)}
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-white border border-indigo-600 rounded-sm shadow-md cursor-ew-resize"
                  />
                  <div
                    onPointerDown={(e) => handleDragStart('e', e)}
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-white border border-indigo-600 rounded-sm shadow-md cursor-ew-resize"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls Column */}
          <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between gap-6 overflow-y-auto bg-white">
            <div className="space-y-6">
              {/* Max Resolution */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Max Resolution
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
                  {RESOLUTION_PRESETS.map((preset) => {
                    const active = maxDimension === preset.value;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setMaxDimension(preset.value)}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                          active
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compression Quality */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="blueprint-quality-slider"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Compression Quality
                  </label>
                  <span className="text-xs font-mono tabular-nums font-semibold text-slate-900">
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <input
                  id="blueprint-quality-slider"
                  type="range"
                  min={0.4}
                  max={0.95}
                  step={0.01}
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>Smaller file</span>
                  <span>Sharper lines</span>
                </div>
              </div>

              {/* Output Summary */}
              <div className="pt-5 border-t border-slate-200 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-slate-500">Output Dimensions</span>
                  <span className="text-xs font-mono tabular-nums font-semibold text-slate-900">
                    {previewResult
                      ? `${previewResult.width} × ${previewResult.height} px`
                      : 'Calculating...'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-slate-500">Estimated Size</span>
                  <span className="text-sm font-mono tabular-nums font-bold text-slate-900">
                    {previewResult ? formatBytes(previewResult.byteSize) : '—'}
                  </span>
                </div>

                {/* Explicit Cloud Fit Status */}
                <div className="pt-1">
                  {isCloudSafe && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-800">
                      <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600" />
                      <span>Fits comfortably within Cloud Save (1 MB project limit).</span>
                    </div>
                  )}
                  {isCloudWarning && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-800">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                      <span>Near Cloud limit. Cropping or lowering quality leaves room for walls and furniture.</span>
                    </div>
                  )}
                  {isCloudTooLarge && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50/80 border border-red-200/80 text-xs text-red-800">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-600" />
                      <span>Exceeds 1 MB Cloud limit. Crop margins or reduce resolution/quality to save in Cloud.</span>
                    </div>
                  )}
                </div>

                {(isCloudWarning || isCloudTooLarge) && (
                  <button
                    type="button"
                    onClick={handleAutoOptimize}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <Sparkles size={14} className="text-indigo-600" />
                    Auto-Optimize for Cloud
                  </button>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Check size={14} />
                Apply Blueprint
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
