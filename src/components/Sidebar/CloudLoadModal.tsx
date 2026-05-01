import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useStore } from '../../store';
import { X, Cloud, FileText, Calendar, Loader2, Upload, Monitor, Trash2, Edit2 } from 'lucide-react';
import { ConfirmModal } from '../Dialogs/ConfirmModal';
import { PromptModal } from '../Dialogs/PromptModal';
import { AlertModal } from '../Dialogs/AlertModal';

interface CloudLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: any;
  data: string;
  thumbnail?: string;
}

export const CloudLoadModal: React.FC<CloudLoadModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, loadState, fitToScreen } = useStore();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<ProjectSummary | null>(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; project: ProjectSummary | null }>({ isOpen: false, project: null });
  const [renamePrompt, setRenamePrompt] = useState<{ isOpen: boolean; project: ProjectSummary | null }>({ isOpen: false, project: null });
  const [alertInfo, setAlertInfo] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = React.useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedProjects: ProjectSummary[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedProjects.push({
          id: doc.id,
          name: data.name,
          updatedAt: data.updatedAt,
          data: data.data,
          thumbnail: data.thumbnail,
        });
      });
      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && currentUser) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      fetchProjects();
    }
  }, [isOpen, currentUser, fetchProjects]);

  const handleSelectProject = (project: ProjectSummary) => {
    try {
      const json = JSON.parse(project.data);
      loadState(json);
      // Explicitly set the projectId and cloudName 
      // loadState already sets projectName from the JSON data
      useStore.setState({ projectId: project.id, cloudName: project.name });
      
      // Auto-fit after load
      setTimeout(() => {
        const canvas = document.querySelector('.flex-1.relative');
        if (canvas) {
          fitToScreen(canvas.clientWidth, canvas.clientHeight);
        }
      }, 100);
      
      onClose();
    } catch (error) {
      console.error('Error parsing project data:', error);
      setAlertInfo({ isOpen: true, title: 'Error', message: 'Failed to load project data.' });
    }
  };

  const handleLocalLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        loadState(json);
        
        // Auto-fit after load
        setTimeout(() => {
          const canvas = document.querySelector('.flex-1.relative');
          if (canvas) {
            fitToScreen(canvas.clientWidth, canvas.clientHeight);
          }
        }, 100);
        onClose();
      } catch (err) {
        console.error('Failed to load room plan:', err);
        setAlertInfo({ isOpen: true, title: 'Error', message: 'Invalid room plan file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDelete = async (e: React.MouseEvent, project: ProjectSummary) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, project });
  };

  const confirmDelete = async () => {
    const project = deleteConfirm.project;
    if (!project) return;
    
    try {
      await deleteDoc(doc(db, 'projects', project.id));
      if (useStore.getState().projectId === project.id) {
        useStore.setState({ projectId: null });
      }
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      setAlertInfo({ isOpen: true, title: 'Error', message: 'Failed to delete project.' });
    } finally {
      setDeleteConfirm({ isOpen: false, project: null });
    }
  };

  const handleRename = async (e: React.MouseEvent, project: ProjectSummary) => {
    e.stopPropagation();
    setRenamePrompt({ isOpen: true, project });
  };

  const confirmRename = async (newName: string) => {
    const project = renamePrompt.project;
    if (!project || !newName || newName.trim() === '' || newName === project.name) {
      setRenamePrompt({ isOpen: false, project: null });
      return;
    }

    try {
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', currentUser!.uid),
        where('name', '==', newName.trim())
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setAlertInfo({ isOpen: true, title: 'Name Taken', message: 'A project with this name already exists!' });
        return;
      }

      await updateDoc(doc(db, 'projects', project.id), {
        name: newName.trim(),
        updatedAt: serverTimestamp()
      });

      if (useStore.getState().projectId === project.id) {
        useStore.setState({ projectName: newName.trim() });
      }
      fetchProjects();
      setRenamePrompt({ isOpen: false, project: null });
    } catch (error) {
      console.error('Error renaming project:', error);
      setAlertInfo({ isOpen: true, title: 'Error', message: 'Failed to rename project.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Load Project</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Choose source</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleLocalLoad}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm border border-slate-100">
              <Monitor size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700 group-hover:text-indigo-900">From Computer</h3>
              <p className="text-[10px] text-slate-400 font-medium">Upload a .json file</p>
            </div>
            <Upload size={16} className="ml-auto text-slate-300 group-hover:text-indigo-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Cloud Projects</div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-sm font-medium text-slate-500">Fetching projects...</p>
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setPreviewPos({ x: rect.right + 20, y: rect.top });
                    setHoveredProject(project);
                  }}
                  onMouseLeave={() => setHoveredProject(null)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group cursor-pointer relative"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-900">{project.name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                      <Calendar size={12} />
                      <span>
                        {project.updatedAt?.toDate 
                          ? project.updatedAt.toDate().toLocaleDateString() + ' ' + project.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Just now'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleRename(e, project)}
                      className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
                      title="Rename"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, project)}
                      className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-40">
              <Cloud size={48} className="text-slate-300" />
              <p className="text-sm font-medium text-slate-400">No projects found in the cloud.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteConfirm.project?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, project: null })}
      />

      <PromptModal
        isOpen={renamePrompt.isOpen}
        title="Rename Project"
        message="Enter a new name for your project:"
        defaultValue={renamePrompt.project?.name}
        onConfirm={confirmRename}
        onCancel={() => setRenamePrompt({ isOpen: false, project: null })}
      />

      <AlertModal
        isOpen={alertInfo.isOpen}
        title={alertInfo.title}
        message={alertInfo.message}
        onClose={() => setAlertInfo({ ...alertInfo, isOpen: false })}
      />

      {/* Floating Preview */}
      {hoveredProject && (
        <div 
          className="fixed z-[150] w-64 p-2 bg-white rounded-2xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
          style={{ 
            left: `${previewPos.x}px`, 
            top: `${Math.min(previewPos.y, window.innerHeight - 300)}px` 
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="aspect-video w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
              {hoveredProject.thumbnail ? (
                <img 
                  src={hoveredProject.thumbnail} 
                  alt={hoveredProject.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-30">
                  <Monitor size={32} className="text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">No Preview</span>
                </div>
              )}
            </div>
            <div className="px-1">
              <h4 className="text-xs font-bold text-slate-800 tracking-tight">{hoveredProject.name}</h4>
              <p className="text-[9px] text-slate-400 font-medium">
                Last modified: {hoveredProject.updatedAt?.toDate()?.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
