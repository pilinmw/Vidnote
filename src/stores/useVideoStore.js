import { create } from 'zustand';
import {
    getAllProjects,
    getProject,
    saveProject as saveProjectToDB,
    deleteProject as deleteProjectFromDB,
} from '../services/storage';
import { generateId } from '../utils/formatTime';

const useVideoStore = create((set, get) => ({
    // State
    projects: [],
    currentProject: null,
    isLoading: false,

    // Player state
    playerRef: null,
    currentTime: 0,
    duration: 0,
    isPlaying: false,

    // Actions
    setPlayerRef: (ref) => set({ playerRef: ref }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setDuration: (duration) => set({ duration }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),

    seekTo: (time) => {
        const { playerRef } = get();
        if (playerRef) {
            playerRef.seekTo(time, 'seconds');
            set({ currentTime: time });
        }
    },

    // Project actions
    loadProjects: async () => {
        set({ isLoading: true });
        try {
            const projects = await getAllProjects();
            set({ projects, isLoading: false });
        } catch (err) {
            console.error('Failed to load projects:', err);
            set({ isLoading: false });
        }
    },

    loadProject: async (id) => {
        set({ isLoading: true });
        try {
            const project = await getProject(id);
            set({ currentProject: project, isLoading: false });
        } catch (err) {
            console.error('Failed to load project:', err);
            set({ isLoading: false });
        }
    },

    createProject: async (data) => {
        const project = {
            id: generateId(),
            title: data.title || '未命名视频',
            videoUrl: data.videoUrl || '',
            videoType: data.videoType || 'url', // 'url' | 'local'
            projectType: data.projectType || 'video', // 'video' | 'live' | 'meeting'
            localFileName: data.localFileName || '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            noteCount: 0,
        };

        await saveProjectToDB(project);
        const projects = await getAllProjects();
        set({ projects });
        return project;
    },

    updateProject: async (id, updates) => {
        const project = await getProject(id);
        if (!project) return;

        const updated = { ...project, ...updates, updatedAt: Date.now() };
        await saveProjectToDB(updated);

        const { currentProject } = get();
        if (currentProject?.id === id) {
            set({ currentProject: updated });
        }

        const projects = await getAllProjects();
        set({ projects });
    },

    removeProject: async (id) => {
        await deleteProjectFromDB(id);
        const projects = await getAllProjects();
        set({ projects, currentProject: null });
    },

    clearCurrentProject: () => set({ currentProject: null, currentTime: 0, duration: 0 }),
}));

export default useVideoStore;
