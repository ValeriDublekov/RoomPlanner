/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Sidebar, ThreeDPreview } from './components';
import { RightSidebar } from './components/RightSidebar';
import { Canvas } from './components/Canvas';
import { CalibrationModal } from './components/CalibrationModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from '@/src/store';

export default function App() {
  const show3d = useStore(state => state.show3d);
  const setCurrentUser = useStore(state => state.setCurrentUser);
  const setIsAuthLoading = useStore(state => state.setIsAuthLoading);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        // Prevent undo if user is typing in an input/textarea
        const activeElement = document.activeElement;
        const isTyping = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
        
        if (!isTyping) {
          e.preventDefault();
          useStore.getState().undo();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [setCurrentUser, setIsAuthLoading]);

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans antialiased text-slate-900">
      <CalibrationModal />
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

