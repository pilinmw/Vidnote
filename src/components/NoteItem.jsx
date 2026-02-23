import { useState } from 'react';
import useVideoStore from '../stores/useVideoStore';

export default function NoteItem({ note, onToggleHighlight, onDelete, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(note.content);
    const { seekTo } = useVideoStore();

    const handleTimestampClick = () => {
        seekTo(note.timestamp);
    };

    const handleStartEdit = () => {
        setEditText(note.content);
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        if (editText.trim() && editText.trim() !== note.content) {
            onUpdate(note.id, { content: editText.trim() });
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            setEditText(note.content);
        }
    };

    return (
        <div className={`note-item ${note.isHighlight ? 'highlight' : ''}`}>
            <button
                className="note-item-timestamp"
                onClick={handleTimestampClick}
                title="跳转到此时刻"
            >
                {note.formattedTime}
            </button>

            <div className="note-item-content">
                {isEditing ? (
                    <textarea
                        className="note-item-text editing"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                ) : (
                    <p className="note-item-text" onDoubleClick={handleStartEdit}>
                        {note.content}
                    </p>
                )}
            </div>

            <div className="note-item-actions">
                <button
                    className={`star-btn ${note.isHighlight ? 'active' : ''}`}
                    onClick={() => onToggleHighlight(note.id)}
                    title={note.isHighlight ? '取消高光' : '标记高光'}
                >
                    {note.isHighlight ? '★' : '☆'}
                </button>
                <button
                    className="delete-btn"
                    onClick={() => onDelete(note.id)}
                    title="删除笔记"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
