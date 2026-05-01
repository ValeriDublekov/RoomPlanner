import React from 'react';
import { BeamObject } from '@/src/types';
import { Trash2 } from 'lucide-react';

interface BeamEditorProps {
  selectedBeam: BeamObject;
  updateBeam: (id: string, updates: Partial<BeamObject>) => void;
  deleteBeam: (id: string) => void;
  saveHistory: () => void;
}

export const BeamEditor: React.FC<BeamEditorProps> = ({
  selectedBeam,
  updateBeam,
  deleteBeam,
  saveHistory,
}) => {
  const handleInputChange = (field: keyof BeamObject, value: any) => {
    saveHistory();
    updateBeam(selectedBeam.id, { [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Beam Properties</h3>
        <button
          onClick={() => deleteBeam(selectedBeam.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete Beam"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Width (cm)</label>
          <input
            type="number"
            value={Math.round(selectedBeam.width)}
            onChange={(e) => handleInputChange('width', parseFloat(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Height (cm)</label>
          <input
            type="number"
            value={Math.round(selectedBeam.height)}
            onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Elevation (cm)</label>
          <input
            type="number"
            value={Math.round(selectedBeam.elevation)}
            onChange={(e) => handleInputChange('elevation', parseFloat(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Alignment</label>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => handleInputChange('alignment', align)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                  selectedBeam.alignment === align
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {align.charAt(0).toUpperCase() + align.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Color Type</label>
          <select
            value={selectedBeam.colorType}
            onChange={(e) => handleInputChange('colorType', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          >
            <option value="manual">Manual</option>
            <option value="wall">Same as Wall</option>
            <option value="ceiling">Same as Ceiling</option>
          </select>
        </div>
        {selectedBeam.colorType === 'manual' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={selectedBeam.color}
                  onChange={(e) => {
                      handleInputChange('color', e.target.value);
                      handleInputChange('manualColor', e.target.value);
                  }}
                  className="w-full h-9 p-1 bg-white border border-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
        )}
      </div>
    </div>
  );
};
