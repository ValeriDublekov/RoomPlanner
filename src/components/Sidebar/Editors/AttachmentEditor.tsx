import React from 'react';
import { X, FlipHorizontal, FlipVertical } from 'lucide-react';
import { WallAttachment } from '../../../types';
import { cn } from '../../../lib/utils';

interface AttachmentEditorProps {
  selectedAttachment: WallAttachment;
  updateAttachment: (id: string, updates: Partial<WallAttachment>) => void;
  deleteAttachment: (id: string) => void;
  saveHistory: () => void;
}

export const AttachmentEditor: React.FC<AttachmentEditorProps> = ({
  selectedAttachment,
  updateAttachment,
  deleteAttachment,
  saveHistory,
}) => {
  return (
    <>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        {selectedAttachment.type === 'door' ? 'Door' : 'Window'} Properties
      </div>
      
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Width (cm)</label>
        <input
          type="number"
          value={Math.round(selectedAttachment.width)}
          onFocus={saveHistory}
          onChange={(e) => updateAttachment(selectedAttachment.id, { width: parseFloat(e.target.value) })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            saveHistory();
            updateAttachment(selectedAttachment.id, { flipX: !selectedAttachment.flipX });
          }}
          className={cn(
            "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
            selectedAttachment.flipX ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          )}
          title="Flip Hinge Side"
        >
          <FlipHorizontal size={14} />
          Hinge
        </button>
        <button
          onClick={() => {
            saveHistory();
            updateAttachment(selectedAttachment.id, { flipY: !selectedAttachment.flipY });
          }}
          className={cn(
            "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
            selectedAttachment.flipY ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          )}
          title="Flip Opening Side (In/Out)"
        >
          <FlipVertical size={14} />
          Side
        </button>
      </div>

      {selectedAttachment.type === 'window' && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Curtains</label>
            <div className="grid grid-cols-2 gap-2">
              {(['none', 'thin', 'thick', 'both'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => { saveHistory(); updateAttachment(selectedAttachment.id, { curtainType: type }); }}
                  className={cn(
                    "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border text-center",
                    (selectedAttachment.curtainType || 'none') === type
                      ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {selectedAttachment.curtainType && selectedAttachment.curtainType !== 'none' && (
            <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {(selectedAttachment.curtainType === 'thin' || selectedAttachment.curtainType === 'both') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Thin Curtain Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#fff7ed', '#fef2f2', '#f0fdf4'].map(color => (
                      <button
                        key={color}
                        onClick={() => { saveHistory(); updateAttachment(selectedAttachment.id, { thinCurtainColor: color }); }}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 transition-all",
                          (selectedAttachment.thinCurtainColor || '#ffffff') === color ? "border-indigo-500 scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={selectedAttachment.thinCurtainColor || '#ffffff'} 
                      onChange={(e) => { saveHistory(); updateAttachment(selectedAttachment.id, { thinCurtainColor: e.target.value }); }}
                      className="w-5 h-5 rounded-full border-none p-0 overflow-hidden cursor-pointer"
                    />
                  </div>
                </div>
              )}
              {(selectedAttachment.curtainType === 'thick' || selectedAttachment.curtainType === 'both') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Thick Curtain Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {['#f1f5f9', '#94a3b8', '#475569', '#334155', '#1e293b', '#4338ca', '#b91c1c', '#15803d'].map(color => (
                      <button
                        key={color}
                        onClick={() => { saveHistory(); updateAttachment(selectedAttachment.id, { thickCurtainColor: color }); }}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 transition-all",
                          (selectedAttachment.thickCurtainColor || '#f1f5f9') === color ? "border-indigo-500 scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={selectedAttachment.thickCurtainColor || '#f1f5f9'} 
                      onChange={(e) => { saveHistory(); updateAttachment(selectedAttachment.id, { thickCurtainColor: e.target.value }); }}
                      className="w-5 h-5 rounded-full border-none p-0 overflow-hidden cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Frame Color</label>
        <div className="flex gap-2 flex-wrap">
          {['#ffffff', '#f1f5f9', '#cbd5e1', '#94a3b8', '#475569', '#334155', '#1e293b', '#000000'].map(color => (
            <button
              key={color}
              onClick={() => { saveHistory(); updateAttachment(selectedAttachment.id, { frameColor: color }); }}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-all",
                (selectedAttachment.frameColor || '#ffffff') === color ? "border-indigo-500 scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <input 
            type="color" 
            value={selectedAttachment.frameColor || '#ffffff'} 
            onChange={(e) => { saveHistory(); updateAttachment(selectedAttachment.id, { frameColor: e.target.value }); }}
            className="w-6 h-6 rounded-full border-none p-0 overflow-hidden cursor-pointer"
          />
        </div>
      </div>

      <button
        onClick={() => deleteAttachment(selectedAttachment.id)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100 uppercase tracking-wider"
      >
        <X size={12} />
        Delete {selectedAttachment.type === 'door' ? 'Door' : 'Window'}
      </button>
    </>
  );
};
