/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/src/store';
import { Canvas } from '../Canvas';
import { ThreeDPreview } from '../ThreeD';
import { ErrorBoundary } from '../ErrorBoundary';
import { 
  Box, 
  Map as MapIcon, 
  ChevronLeft, 
  Info,
  Maximize,
  RotateCw,
  Eye
} from 'lucide-react';

export const MobileViewer: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const { projectName, fitToScreen } = useStore();
  
  // Force Read-Only and appropriate UI states
  useEffect(() => {
    const originalShow3d = useStore.getState().show3d;
    const originalMode = useStore.getState().mode;
    const originalReadOnly = useStore.getState().isReadOnly;
    
    // Set to select mode and disable any drawing
    useStore.setState({ 
      mode: 'select',
      show3d: viewMode === '3d',
      isReadOnly: true
    });

    return () => {
      useStore.setState({ 
        show3d: originalShow3d,
        mode: originalMode,
        isReadOnly: originalReadOnly
      });
    };
  }, [viewMode]);

  useEffect(() => {
    // Force fit to screen when project loads or view mode changes to 2D
    if (viewMode === '2d') {
      const timer = setTimeout(() => {
        fitToScreen();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [viewMode, projectId, fitToScreen]);

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-[60] p-4 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate('/mobile')}
          className="w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center text-slate-800 active:scale-90 transition-transform pointer-events-auto"
        >
          <ChevronLeft size={28} />
        </button>
        
        <div className="bg-white px-5 py-2.5 rounded-full shadow-xl border border-slate-100 flex items-center gap-2 pointer-events-auto">
          <span className="text-sm font-bold text-slate-900 truncate max-w-[120px]">
            {projectName || "Loading..."}
          </span>
          <div className="w-1 h-1 rounded-full bg-slate-300 mx-1" />
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
            {viewMode} Mode
          </span>
        </div>

        <button 
          className="w-12 h-12 bg-indigo-600 shadow-xl rounded-full flex items-center justify-center text-white active:scale-90 transition-transform pointer-events-auto"
          onClick={() => fitToScreen()}
          title="Fit to screen"
        >
          <Maximize size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {viewMode === '2d' ? (
          <div className="absolute inset-0 bg-slate-100 flex flex-col">
            <ErrorBoundary>
              <Canvas />
            </ErrorBoundary>
            {/* Simple Instruction Overlay for 2D */}
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] text-white font-bold flex items-center gap-2 pointer-events-none shadow-lg z-10">
              <Info size={14} className="text-indigo-400" />
              DRAG TO PAN • PINCH TO ZOOM
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-slate-900 flex flex-col">
            <ErrorBoundary>
              <ThreeDPreview />
            </ErrorBoundary>
            {/* Simple Instruction Overlay for 3D */}
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] text-white font-bold flex items-center gap-2 pointer-events-none shadow-lg z-10">
              <RotateCw size={14} className="text-indigo-400" />
              DRAG TO ROTATE • PINCH TO ZOOM
            </div>
          </div>
        )}
      </div>

      {/* Bottom Mode Switcher */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full px-6 max-w-sm">
        <div className="bg-slate-900/95 backdrop-blur-2xl p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/20 flex items-center gap-1">
          <button
            onClick={() => setViewMode('2d')}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl transition-all active:scale-95
              ${viewMode === '2d' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' 
                : 'text-slate-400 hover:text-white'}
            `}
          >
            <MapIcon size={20} />
            <span className="text-sm font-bold uppercase tracking-tight">2D Plan</span>
          </button>
          
          <button
            onClick={() => setViewMode('3d')}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl transition-all active:scale-95
              ${viewMode === '3d' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' 
                : 'text-slate-400 hover:text-white'}
            `}
          >
            <Box size={20} />
            <span className="text-sm font-bold uppercase tracking-tight">3D View</span>
          </button>
        </div>
      </div>

      {/* Viewport Lock Overlay (Optional - to prevent some scrolls) */}
      <div className="hidden">
        <style>{`
          body { overflow: hidden; position: fixed; width: 100%; height: 100%; }
          #root { height: 100%; }
        `}</style>
      </div>
    </div>
  );
};
