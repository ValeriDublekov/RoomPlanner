/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/src/store';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { DesktopLayout } from './components/DesktopLayout';
import { MobileDashboard } from './components/Mobile/MobileDashboard';
import { MobileViewer } from './components/Mobile/MobileViewer';

// Helper to detect mobile devices
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export default function App() {
  const setCurrentUser = useStore(state => state.setCurrentUser);
  const setIsAuthLoading = useStore(state => state.setIsAuthLoading);
  const isReadOnly = useStore(state => state.isReadOnly);

  // Centralized keyboard shortcuts entry point
  useKeyboardShortcuts();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [setCurrentUser, setIsAuthLoading]);

  // Route guarding for read-only mode if needed
  // This can be expanded based on specific requirements

  return (
    <BrowserRouter>
      <Routes>
        {/* Desktop Route */}
        <Route 
          path="/" 
          element={isMobileDevice() ? <Navigate to="/mobile" replace /> : <DesktopLayout />} 
        />

        {/* Mobile Routes */}
        <Route path="/mobile" element={<MobileDashboard />} />
        <Route path="/mobile/view/:projectId" element={<MobileViewer />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

