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
    // Initial fit to screen
    const timer = setTimeout(() => {
      fitToScreen();
    }, 500);
    return () => clearTimeout(timer);
  }, [projectId, fitToScreen]);

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate('/mobile')}
          className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-slate-800 active:scale-90 transition-transform pointer-events-auto"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-white/20 flex items-center gap-2 pointer-events-auto">
          <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
            {projectName}
          </span>
          <div className="w-1 h-1 rounded-full bg-slate-300 mx-1" />
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
            {viewMode}
          </span>
        </div>

        <button 
          className="w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-slate-800 active:scale-90 transition-transform pointer-events-auto"
          onClick={() => fitToScreen()}
        >
          <Maximize size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {viewMode === '2d' ? (
          <div className="w-full h-full bg-slate-100">
            <Canvas />
            {/* Simple Instruction Overlay for 2D */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/40 backdrop-blur border border-white/10 rounded-full text-[10px] text-white/80 font-medium flex items-center gap-2 pointer-events-none">
              <Info size={12} />
              Use two fingers to zoom and pan the plan
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-slate-900">
            <ErrorBoundary>
              <ThreeDPreview />
            </ErrorBoundary>
            {/* Simple Instruction Overlay for 3D */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur border border-white/10 rounded-full text-[10px] text-white/80 font-medium flex items-center gap-2 pointer-events-none">
              <RotateCw size={12} />
              Drag to rotate • Pinch to zoom
            </div>
          </div>
        )}
      </div>

      {/* Bottom Mode Switcher */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-slate-900/80 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-1">
          <button
            onClick={() => setViewMode('2d')}
            className={`
              flex items-center gap-2 px-5 py-3 rounded-xl transition-all active:scale-95
              ${viewMode === '2d' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <MapIcon size={18} />
            <span className="text-sm font-bold">2D Plan</span>
          </button>
          
          <button
            onClick={() => setViewMode('3d')}
            className={`
              flex items-center gap-2 px-5 py-3 rounded-xl transition-all active:scale-95
              ${viewMode === '3d' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <Box size={18} />
            <span className="text-sm font-bold">3D View</span>
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
