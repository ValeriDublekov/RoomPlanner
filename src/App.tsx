/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { Canvas } from './components/Canvas';
import { CalibrationModal } from './components/CalibrationModal';
import { ThreeDPreview } from './components/ThreeD/ThreeDPreview';
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
      <main className="flex-1 min-w-0 flex flex-col relative">
        {/* Main Canvas Area */}
        <Canvas />
      </main>
      <RightSidebar />
    </div>
  );
}

