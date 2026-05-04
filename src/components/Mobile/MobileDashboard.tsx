/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '@/src/firebase';
import { useStore } from '@/src/store';
import { 
  Cloud, 
  FileText, 
  Calendar, 
  Loader2, 
  LogOut, 
  User,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: any;
  thumbnail?: string;
  data: string;
}

export const MobileDashboard: React.FC = () => {
  const { currentUser, loadState, fitToScreen } = useStore();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
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
    if (currentUser) {
      fetchProjects();
    }
  }, [currentUser, fetchProjects]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/mobile');
  };

  const handleSelectProject = (project: ProjectSummary) => {
    try {
      const json = JSON.parse(project.data);
      loadState(json);
      useStore.setState({ projectId: project.id, cloudName: project.name });
      navigate(`/mobile/view/${project.id}`);
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl mb-6">
          <LayoutGrid size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Floor Plan Viewer</h1>
        <p className="text-slate-500 mb-8 max-w-xs">Log in to access your saved architectural projects and view them in 2D or 3D.</p>
        <button 
          onClick={handleLogin}
          className="w-full max-w-sm flex items-center justify-center gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:bg-slate-50 transition-all font-semibold active:scale-95"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span>Sign in with Google</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <LayoutGrid size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">My Projects</h2>
            <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
              <Cloud size={10} />
              <span>Cloud Storage</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 flex items-center gap-3 bg-white/50 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
          {currentUser.photoURL ? (
            <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500">
              <User size={16} />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{currentUser.displayName || 'Architect'}</p>
          <p className="text-[10px] text-slate-400 font-medium">{currentUser.email}</p>
        </div>
        <div className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase tracking-wider">
          Viewer Mode
        </div>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-sm font-medium text-slate-500">Loading your designs...</p>
          </div>
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleSelectProject(project)}
              className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm active:scale-[0.98] transition-all text-left group"
            >
              <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {project.thumbnail ? (
                  <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText size={24} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate pr-2">{project.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
                  <Calendar size={12} />
                  <span>
                    {project.updatedAt?.toDate 
                      ? project.updatedAt.toDate().toLocaleDateString()
                      : 'Just now'}
                  </span>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 mr-1" />
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
              <Cloud size={40} />
            </div>
            <div>
              <p className="text-slate-900 font-bold">No projects found</p>
              <p className="text-sm text-slate-500 px-10">Create a project on your desktop to view it here.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
        Design Intelligence &copy; 2026
      </div>
    </div>
  );
};
