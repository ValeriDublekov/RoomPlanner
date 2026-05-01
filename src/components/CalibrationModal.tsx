import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Ruler, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CalibrationModal: React.FC = () => {
  const { tempCalibrationDist, setTempCalibrationDist, setPixelsPerCm, setMode } = useStore();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus when mounting
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cm = parseFloat(value);
    if (cm > 0 && tempCalibrationDist) {
      setPixelsPerCm(tempCalibrationDist / cm);
      setTempCalibrationDist(null);
      setMode('select');
    }
  };

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-80"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <Ruler size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Set Real Length</h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Calibration</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Length in Centimeters (cm)
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="number"
                  step="0.1"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">cm</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTempCalibrationDist(null)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                type="submit"
                disabled={!value || parseFloat(value) <= 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
              >
                <Check size={14} />
                Confirm
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
