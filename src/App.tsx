/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Sidebar, ThreeDPreview, CatalogModal } from './components';
import { RightSidebar } from './components/RightSidebar';
import { Canvas } from './components/Canvas';
import { CalibrationModal } from './components/CalibrationModal';
import { JsonViewerModal } from './components/Dialogs';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from '@/src/store';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  const show3d = useStore(state => state.show3d);
  const showJsonViewer = useStore(state => state.showJsonViewer);
  const toggleJsonViewer = useStore(state => state.toggleJsonViewer);
  const setCurrentUser = useStore(state => state.setCurrentUser);
  const setIsAuthLoading = useStore(state => state.setIsAuthLoading);
  const tempCalibrationDist = useStore(state => state.tempCalibrationDist);
  const isCatalogOpen = useStore(state => state.isCatalogOpen);
  const setIsCatalogOpen = useStore(state => state.setIsCatalogOpen);

  // Centralized keyboard shortcuts entry point
  useKeyboardShortcuts();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [setCurrentUser, setIsAuthLoading]);

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans antialiased text-slate-900">
      {tempCalibrationDist !== null && <CalibrationModal />}
      <JsonViewerModal isOpen={showJsonViewer} onClose={() => toggleJsonViewer(false)} />
      <CatalogModal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} />
      {show3d && (
        <ErrorBoundary>
          <ThreeDPreview />
        </ErrorBoundary>
      )}
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col relative">
        {/* Main Canvas Area */}
        <Canvas />
      </main>
      <RightSidebar />
    </div>
  );
}

