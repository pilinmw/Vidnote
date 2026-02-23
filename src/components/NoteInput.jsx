import { useState, useRef, useEffect } from 'react';
import useVideoStore from '../stores/useVideoStore';
import { formatTime } from '../utils/formatTime';

export default function NoteInput({ onSubmit }) {
    const [content, setContent] = useState('');
    const textareaRef = useRef(null);
    const { currentTime } = useVideoStore();

    const handleSubmit = () => {
        const trimmed = content.trim();
        if (!trimmed) return;

        onSubmit(trimmed, currentTime);
        setContent('');

        // Re-focus textarea
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
        }
    }, [content]);

    return (
        <div className="note-input-wrapper">
            <div className="note-input-container">
                <textarea
                    ref={textareaRef}
                    className="note-input-field"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="记录你的想法..."
                    rows={1}
                    id="note-input"
                />
                <button
                    className="note-input-submit"
                    onClick={handleSubmit}
                    disabled={!content.trim()}
                    title="添加笔记"
                    id="add-note-btn"
                >
                    ↵
                </button>
            </div>
            <div className="note-input-hint">
                <span className="note-input-timestamp">⏱ {formatTime(currentTime)}</span>
                <span>⌘+Enter 快速添加</span>
            </div>
        </div>
    );
}
