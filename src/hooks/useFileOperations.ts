import { useState } from 'react';
import { useStore } from '../store';

interface FileOperationsProps {
  getThumbnail?: () => Promise<string | null>;
}

export const useFileOperations = ({ getThumbnail }: FileOperationsProps) => {
  const { 
    currentUser, 
    saveProject, 
    loadState, 
    fitToScreen, 
    newProject,
    isSaving,
    projectId
  } = useStore();

  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [isCloudLoadOpen, setIsCloudLoadOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [pendingThumbnail, setPendingThumbnail] = useState<string | null>(null);

  const handleLoad = () => {
    if (currentUser) {
      setIsCloudLoadOpen(true);
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            loadState(json);
            
            // Auto-fit after load
            setTimeout(() => {
              fitToScreen();
            }, 100);
          } catch (err) {
            console.error('Failed to load:', err);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }
  };

  const handleSave = async () => {
    const thumbnail = getThumbnail ? await getThumbnail() : null;
    setPendingThumbnail(thumbnail);
    
    if (currentUser) {
      if (projectId) {
        // Already in cloud, save directly
        saveProject(undefined, undefined, thumbnail || undefined);
      } else {
        // New project, show options
        setIsSaveModalOpen(true);
      }
    } else {
      saveProject();
    }
  };

  const handleSaveAs = async () => {
    const thumbnail = getThumbnail ? await getThumbnail() : null;
    setPendingThumbnail(thumbnail);
    if (currentUser) {
      setIsSaveModalOpen(true);
    } else {
      saveProject();
    }
  };

  const handleNewProject = () => {
    setShowNewConfirm(true);
  };

  const confirmNewProject = () => {
    newProject();
    setShowNewConfirm(false);
  };

  return {
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
  };
};
