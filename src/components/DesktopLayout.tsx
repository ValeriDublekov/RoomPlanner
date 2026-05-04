/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sidebar, ThreeDPreview, CatalogModal } from '@/src/components';
import { RightSidebar } from '@/src/components/RightSidebar';
import { Canvas } from '@/src/components/Canvas';
import { CalibrationModal } from '@/src/components/CalibrationModal';
import { JsonViewerModal } from '@/src/components/Dialogs';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { useStore } from '@/src/store';

export const DesktopLayout = () => {
  const show3d = useStore(state => state.show3d);
  const showJsonViewer = useStore(state => state.showJsonViewer);
  const toggleJsonViewer = useStore(state => state.toggleJsonViewer);
  const tempCalibrationDist = useStore(state => state.tempCalibrationDist);
  const isCatalogOpen = useStore(state => state.isCatalogOpen);
  const setIsCatalogOpen = useStore(state => state.setIsCatalogOpen);

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
        <Canvas />
      </main>
      <RightSidebar />
    </div>
  );
};
