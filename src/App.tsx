/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { CalibrationModal } from './components/CalibrationModal';
import { ThreeDPreview } from './components/ThreeDPreview';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from './store';

export default function App() {
  const show3d = useStore(state => state.show3d);

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans antialiased text-slate-900">
      <CalibrationModal />
      {show3d && (
        <ErrorBoundary>
          <ThreeDPreview />
        </ErrorBoundary>
      )}
      <Sidebar />
      <main className="flex-1 flex flex-col relative">
        {/* Main Canvas Area */}
        <Canvas />
      </main>
    </div>
  );
}

