import React from 'react';
import { X } from 'lucide-react';
import { DimensionObject } from '../../../types';

interface DimensionEditorProps {
  selectedDimension: DimensionObject;
  deleteDimension: (id: string) => void;
}

export const DimensionEditor: React.FC<DimensionEditorProps> = ({
  selectedDimension,
  deleteDimension,
}) => {
  return (
    <>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dimension Properties</div>
      <div className="text-[10px] text-slate-500">ID: {selectedDimension.id}</div>
      <button
        onClick={() => deleteDimension(selectedDimension.id)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold hover:bg-red-100 transition-colors border border-red-100 uppercase tracking-wider"
      >
        <X size={12} />
        Delete Dimension
      </button>
    </>
  );
};
