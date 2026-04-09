/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { CalibrationModal } from './components/CalibrationModal';
import { useStore } from './store';

export default function App() {
  const { mode, pixelsPerCm } = useStore();
  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans antialiased text-slate-900">
      <CalibrationModal />
      <Sidebar />
      <main className="flex-1 flex flex-col relative">
        {/* Top Bar / Status */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Canvas Ready</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scale</span>
              <span className="text-xs font-mono font-medium">1cm = {pixelsPerCm.toFixed(2)}px</span>
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mode</span>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-tight">{mode.replace('-', ' ')}</span>
            </div>
          </div>
        </header>

        {/* Main Canvas Area */}
        <Canvas />
      </main>
    </div>
  );
}

