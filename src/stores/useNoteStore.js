import { create } from 'zustand';
import {
    getNotesByProject,
    saveNote as saveNoteToDB,
    deleteNote as deleteNoteFromDB,
} from '../services/storage';
import { generateId, formatTime } from '../utils/formatTime';

const useNoteStore = create((set, get) => ({
    // State
    notes: [],
    isLoading: false,
    filterMode: 'all', // 'all' | 'highlights'
    searchQuery: '',

    // AI Summary
    summary: '',
    isSummarizing: false,
    summaryError: '',

    // Actions
    setFilterMode: (mode) => set({ filterMode: mode }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    // Computed
    getFilteredNotes: () => {
        const { notes, filterMode, searchQuery } = get();
        let filtered = [...notes];

        if (filterMode === 'highlights') {
            filtered = filtered.filter((n) => n.isHighlight);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter((n) => n.content.toLowerCase().includes(q));
        }

        return filtered;
    },

    // Note actions
    loadNotes: async (projectId) => {
        set({ isLoading: true });
        try {
            const notes = await getNotesByProject(projectId);
            set({ notes, isLoading: false });
        } catch (err) {
            console.error('Failed to load notes:', err);
            set({ isLoading: false });
        }
    },

    addNote: async (projectId, content, timestamp) => {
        const note = {
            id: generateId(),
            projectId,
            content,
            timestamp,
            formattedTime: formatTime(timestamp),
            isHighlight: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await saveNoteToDB(note);
        const notes = await getNotesByProject(projectId);
        set({ notes });
        return note;
    },

    updateNote: async (noteId, updates) => {
        const { notes } = get();
        const note = notes.find((n) => n.id === noteId);
        if (!note) return;

        const updated = { ...note, ...updates, updatedAt: Date.now() };
        await saveNoteToDB(updated);
        const refreshed = await getNotesByProject(note.projectId);
        set({ notes: refreshed });
    },

    toggleHighlight: async (noteId) => {
        const { notes } = get();
        const note = notes.find((n) => n.id === noteId);
        if (!note) return;

        const updated = { ...note, isHighlight: !note.isHighlight, updatedAt: Date.now() };
        await saveNoteToDB(updated);
        const refreshed = await getNotesByProject(note.projectId);
        set({ notes: refreshed });
    },

    removeNote: async (noteId) => {
        const { notes } = get();
        const note = notes.find((n) => n.id === noteId);
        if (!note) return;

        await deleteNoteFromDB(noteId);
        const refreshed = await getNotesByProject(note.projectId);
        set({ notes: refreshed });
    },

    // AI Summary
    setSummary: (summary) => set({ summary }),
    setIsSummarizing: (val) => set({ isSummarizing: val }),
    setSummaryError: (err) => set({ summaryError: err }),

    clearNotes: () =>
        set({
            notes: [],
            summary: '',
            summaryError: '',
            filterMode: 'all',
            searchQuery: '',
        }),

    // Export notes as Markdown
    exportAsMarkdown: (projectTitle) => {
        const { notes } = get();
        const highlightNotes = notes.filter((n) => n.isHighlight);

        let md = `# ${projectTitle || '视频笔记'}\n\n`;
        md += `> 导出时间：${new Date().toLocaleString('zh-CN')}\n\n`;

        if (highlightNotes.length > 0) {
            md += `## ⭐ 高光时刻\n\n`;
            highlightNotes.forEach((n) => {
                md += `- **[${n.formattedTime}]** ${n.content}\n`;
            });
            md += '\n';
        }

        md += `## 📝 全部笔记\n\n`;
        notes.forEach((n) => {
            const star = n.isHighlight ? ' ⭐' : '';
            md += `- **[${n.formattedTime}]** ${n.content}${star}\n`;
        });

        // Trigger download
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectTitle || 'vidnote'}-笔记.md`;
        a.click();
        URL.revokeObjectURL(url);
    },
}));

export default useNoteStore;
