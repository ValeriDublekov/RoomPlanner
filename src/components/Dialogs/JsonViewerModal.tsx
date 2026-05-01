import React from 'react';
import { X, Copy } from 'lucide-react';
import { useStore } from '@/src/store';

interface JsonViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JsonViewerModal: React.FC<JsonViewerModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const state = useStore.getState();
  
  const projectData = {
    rooms: state.rooms,
    furniture: state.furniture,
    beams: state.beams,
    wallAttachments: state.wallAttachments,
    dimensions: state.dimensions,
  };

  const jsonString = JSON.stringify(projectData, null, 2);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-900">Project Source</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full">
                <X size={18} />
            </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-auto">
            <pre className="text-xs text-slate-800 bg-slate-100 p-4 rounded-xl">{jsonString}</pre>
        </div>
        <div className="p-4 bg-slate-50 flex gap-2">
           <button
            onClick={() => {
                navigator.clipboard.writeText(jsonString);
            }}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all"
           >
             <Copy size={16} className="inline mr-2"/> Copy JSON
           </button>
        </div>
      </div>
    </div>
  );
};
