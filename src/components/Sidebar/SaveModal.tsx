import React, { useState } from 'react';
import { X, Download, Monitor, Cloud, Save } from 'lucide-react';
import { useStore } from '../../store';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { ConfirmModal } from '../Dialogs/ConfirmModal';
import { PromptModal } from '../Dialogs/PromptModal';
import { AlertModal } from '../Dialogs/AlertModal';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveModal: React.FC<SaveModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, saveProject, saveProjectAs, isSaving, projectName, cloudName, projectId, setProjectName } = useStore();
  const [overwriteConfirm, setOverwriteConfirm] = useState<{ isOpen: boolean; existingId: string | null; pendingName?: string }>({ isOpen: false, existingId: null });
  const [namePrompt, setNamePrompt] = useState<{ isOpen: boolean; mode: 'cloud' | 'local' | 'cloud-as' }>({ isOpen: false, mode: 'cloud' });
  const [alertInfo, setAlertInfo] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });

  if (!isOpen) return null;

  const handleSaveLocal = () => {
    setNamePrompt({ isOpen: true, mode: 'local' });
  };

  const handleSaveCloud = () => {
    // If we already have a projectId, just save (update)
    if (projectId) {
      saveProject();
      onClose();
      return;
    }
    setNamePrompt({ isOpen: true, mode: 'cloud' });
  };

  const handleSaveAsCloud = () => {
    setNamePrompt({ isOpen: true, mode: 'cloud-as' });
  };

  const onNameConfirm = async (newName: string) => {
    setNamePrompt({ isOpen: false, mode: namePrompt.mode });

    if (namePrompt.mode === 'local') {
      await saveProject(undefined, newName);
      onClose();
      return;
    }

    // Cloud logic (Save or Save As)
    if (currentUser) {
      try {
        const q = query(
          collection(db, 'projects'),
          where('userId', '==', currentUser.uid),
          where('name', '==', newName)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const existingDoc = querySnapshot.docs[0];
          // If it's the SAME project we are already working on, just save
          if (projectId === existingDoc.id && namePrompt.mode === 'cloud') {
            await saveProject(undefined, newName);
            onClose();
          } else {
            // Collision with another project
            setOverwriteConfirm({ isOpen: true, existingId: existingDoc.id, pendingName: newName });
          }
        } else {
          if (namePrompt.mode === 'cloud-as') {
            await saveProjectAs(newName);
          } else {
            await saveProject(undefined, newName);
          }
          onClose();
        }
      } catch (error) {
        console.error('Error checking for existing project:', error);
        setAlertInfo({ isOpen: true, title: 'Error', message: 'Failed to check project name.' });
      }
    }
  };

  const confirmOverwrite = async () => {
    if (overwriteConfirm.existingId) {
      await saveProject(overwriteConfirm.existingId, overwriteConfirm.pendingName);
    }
    setOverwriteConfirm({ isOpen: false, existingId: null });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <Save size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Save Project</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Choose destination</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {currentUser && (
            <>
              <button
                onClick={handleSaveCloud}
                disabled={isSaving}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  <Cloud size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-900">Save to Cloud</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Update existing or save new</p>
                </div>
              </button>

              <button
                onClick={handleSaveAsCloud}
                disabled={isSaving}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                  <Save size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-900">Save As...</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Save as a new cloud project</p>
                </div>
              </button>
            </>
          )}

          <button
            onClick={handleSaveLocal}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-600 group-hover:text-white transition-all shadow-sm">
              <Monitor size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-900">Save to Computer</h3>
              <p className="text-[10px] text-slate-500 font-medium">Download as .json file</p>
            </div>
            <Download size={18} className="text-slate-300 group-hover:text-indigo-400" />
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={overwriteConfirm.isOpen}
        title="Project Already Exists"
        message={`A project with the name "${overwriteConfirm.pendingName || projectName}" already exists in your cloud storage. Do you want to overwrite it?`}
        confirmLabel="Overwrite"
        onConfirm={confirmOverwrite}
        onCancel={() => setOverwriteConfirm({ isOpen: false, existingId: null })}
      />

      <PromptModal
        isOpen={namePrompt.isOpen}
        title={namePrompt.mode === 'local' ? 'Save to Computer' : 'Save to Cloud'}
        message="Enter a name for your project file:"
        defaultValue={cloudName || projectName}
        onConfirm={onNameConfirm}
        onCancel={() => setNamePrompt({ ...namePrompt, isOpen: false })}
      />

      <AlertModal
        isOpen={alertInfo.isOpen}
        title={alertInfo.title}
        message={alertInfo.message}
        onClose={() => setAlertInfo({ ...alertInfo, isOpen: false })}
      />
    </div>
  );
};
