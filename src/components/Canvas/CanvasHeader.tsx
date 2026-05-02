import React, { useState } from 'react';
import { useFileOperations } from '@/src/hooks';
import { UserManualModal } from '@/src/components/UserManualModal';
import { CloudLoadModal, SaveModal } from '@/src/components/Sidebar';
import { ConfirmModal } from '@/src/components/Dialogs';
import { ProjectTitle } from './HeaderComponents/ProjectTitle';
import { ToolbarGroups } from './HeaderComponents/ToolbarGroups';
import { QuickActions } from './HeaderComponents/QuickActions';
import { FileMenu } from './HeaderComponents/FileMenu';

interface CanvasHeaderProps {
  onExport: () => void;
  onExportDXF: () => void;
  onExportOBJ: () => void;
  onExportGLB: () => void;
  onPrint: () => void;
  getThumbnail?: () => Promise<string | null>;
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({ 
  onExport, 
  onExportDXF, 
  onExportOBJ, 
  onExportGLB, 
  onPrint, 
  getThumbnail 
}) => {
  const [showManual, setShowManual] = useState(false);
  
  const {
    handleLoad,
    handleSave,
    handleSaveAs,
    handleNewProject,
    confirmNewProject,
    showNewConfirm,
    setShowNewConfirm,
    isCloudLoadOpen,
    setIsCloudLoadOpen,
    isSaveModalOpen,
    setIsSaveModalOpen,
    pendingThumbnail,
    setPendingThumbnail,
    isSaving,
    currentUser
  } = useFileOperations({ getThumbnail });

  return (
    <header className="bg-white border-b border-slate-200 flex flex-col lg:flex-row items-center justify-between px-4 z-20 shadow-sm py-2 gap-3 w-full">
      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 w-full lg:w-auto">
        <ProjectTitle />
        <ToolbarGroups onShowManual={() => setShowManual(true)} />
      </div>

      <div className="flex items-center justify-center lg:justify-end gap-2 md:gap-3 w-full lg:w-auto">
        <QuickActions 
          onLoad={handleLoad} 
          onSave={handleSave} 
          isSaving={isSaving} 
          currentUser={currentUser} 
        />

        <div className="h-6 w-px bg-slate-200 hidden lg:block" />
        
        <FileMenu 
          onNew={handleNewProject}
          onLoad={handleLoad}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onExport={onExport}
          onExportDXF={onExportDXF}
          onExportOBJ={onExportOBJ}
          onExportGLB={onExportGLB}
          onPrint={onPrint}
          isSaving={isSaving}
          currentUser={currentUser}
        />
      </div>

      {/* Modals Section */}
      <UserManualModal isOpen={showManual} onClose={() => setShowManual(false)} />
      <CloudLoadModal isOpen={isCloudLoadOpen} onClose={() => setIsCloudLoadOpen(false)} />
      <SaveModal 
        isOpen={isSaveModalOpen} 
        onClose={() => {
          setIsSaveModalOpen(false);
          setPendingThumbnail(null);
        }} 
        thumbnail={pendingThumbnail}
      />
      <ConfirmModal
        isOpen={showNewConfirm}
        title="New Project"
        message="This will clear your current plan and start fresh. Any unsaved changes will be lost. Are you sure?"
        confirmLabel="Reset Everything"
        cancelLabel="Cancel"
        onConfirm={confirmNewProject}
        onCancel={() => setShowNewConfirm(false)}
        variant="danger"
      />
    </header>
  );
};
