import React, { useRef } from 'react';
import { Download, Upload, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

interface FileActionsProps {
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  backgroundImage: string | null;
  backgroundVisible: boolean;
  setBackgroundVisible: (visible: boolean) => void;
  backgroundOpacity: number;
  setBackgroundOpacity: (opacity: number) => void;
  removeBackgroundImage: () => void;
  hideImageActions?: boolean;
}

export const FileActions: React.FC<FileActionsProps> = ({
  onImageUpload,
  backgroundImage,
  backgroundVisible,
  setBackgroundVisible,
  backgroundOpacity,
  setBackgroundOpacity,
  removeBackgroundImage,
  hideImageActions,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      {!hideImageActions && (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all group"
          >
            <ImageIcon size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">{backgroundImage ? 'Change Image' : 'Upload Blueprint'}</span>
          </button>

          {backgroundImage && (
            <div className="px-3 py-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visibility</span>
                <button
                  onClick={() => setBackgroundVisible(!backgroundVisible)}
                  className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600"
                  title={backgroundVisible ? "Hide Background" : "Show Background"}
                >
                  {backgroundVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opacity</span>
                <span className="text-[10px] font-mono font-bold text-slate-600">{Math.round(backgroundOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={backgroundOpacity}
                onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <button 
                onClick={removeBackgroundImage}
                className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors"
              >
                Remove Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
