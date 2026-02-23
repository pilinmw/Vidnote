import { useState } from 'react';
import useNoteStore from '../stores/useNoteStore';
import NoteItem from './NoteItem';
import NoteInput from './NoteInput';
import AISummary from './AISummary';

export default function NotePanel({ projectId, projectTitle }) {
    const {
        filterMode,
        setFilterMode,
        searchQuery,
        setSearchQuery,
        getFilteredNotes,
        addNote,
        updateNote,
        toggleHighlight,
        removeNote,
        exportAsMarkdown,
        notes,
    } = useNoteStore();

    const filteredNotes = getFilteredNotes();
    const highlightCount = notes.filter((n) => n.isHighlight).length;

    const handleAddNote = async (content, timestamp) => {
        await addNote(projectId, content, timestamp);
    };

    return (
        <div className="note-panel">
            {/* Header */}
            <div className="note-panel-header">
                <div className="note-panel-toolbar">
                    <h3>
                        📝 笔记{' '}
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>
                            ({notes.length})
                        </span>
                    </h3>
                    <div className="note-panel-toolbar-actions">
                        <button
                            className="btn btn-ghost"
                            onClick={() => exportAsMarkdown(projectTitle)}
                            title="导出 Markdown"
                            disabled={notes.length === 0}
                            id="export-btn"
                        >
                            📥
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="note-filter-tabs">
                    <button
                        className={`note-filter-tab ${filterMode === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterMode('all')}
                    >
                        全部
                    </button>
                    <button
                        className={`note-filter-tab ${filterMode === 'highlights' ? 'active' : ''}`}
                        onClick={() => setFilterMode('highlights')}
                    >
                        ⭐ 高光 ({highlightCount})
                    </button>
                </div>

                {/* Search */}
                {notes.length > 3 && (
                    <div className="note-search">
                        <input
                            className="input"
                            type="text"
                            placeholder="搜索笔记..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            id="search-notes"
                        />
                    </div>
                )}
            </div>

            {/* Note List */}
            <div className="note-list">
                {filteredNotes.length === 0 ? (
                    <div className="note-list-empty">
                        <div className="note-list-empty-icon">
                            {filterMode === 'highlights' ? '⭐' : '📝'}
                        </div>
                        <p>
                            {filterMode === 'highlights'
                                ? '暂无高光笔记\n点击 ☆ 将笔记标记为高光'
                                : searchQuery
                                    ? '没有找到匹配的笔记'
                                    : '还没有笔记\n播放视频时添加你的第一条笔记吧'}
                        </p>
                    </div>
                ) : (
                    filteredNotes.map((note) => (
                        <NoteItem
                            key={note.id}
                            note={note}
                            onToggleHighlight={toggleHighlight}
                            onDelete={removeNote}
                            onUpdate={updateNote}
                        />
                    ))
                )}
            </div>

            {/* Note Input */}
            <NoteInput onSubmit={handleAddNote} />

            {/* AI Summary */}
            <AISummary projectTitle={projectTitle} />
        </div>
    );
}
