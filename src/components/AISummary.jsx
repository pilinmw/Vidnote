import { useState } from 'react';
import useNoteStore from '../stores/useNoteStore';
import { generateSummary } from '../services/ai';

export default function AISummary({ projectTitle }) {
    const [isOpen, setIsOpen] = useState(false);
    const {
        notes,
        summary,
        setSummary,
        isSummarizing,
        setIsSummarizing,
        summaryError,
        setSummaryError,
    } = useNoteStore();

    const handleGenerate = async (mode = 'full') => {
        if (notes.length === 0) {
            setSummaryError('请先添加一些笔记再生成总结');
            return;
        }

        setIsSummarizing(true);
        setSummaryError('');

        try {
            const result = await generateSummary(notes, {
                mode,
                projectTitle,
            });
            setSummary(result);
        } catch (err) {
            setSummaryError(err.message);
        } finally {
            setIsSummarizing(false);
        }
    };

    return (
        <div className="ai-summary-section">
            <button
                className="ai-summary-toggle"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>🤖 AI 总结</span>
                <span className={`ai-summary-toggle-icon ${isOpen ? 'open' : ''}`}>
                    ▾
                </span>
            </button>

            {isOpen && (
                <div className="ai-summary-content">
                    <div className="ai-summary-actions">
                        <button
                            className="btn btn-primary"
                            onClick={() => handleGenerate('full')}
                            disabled={isSummarizing || notes.length === 0}
                            id="ai-summary-full-btn"
                        >
                            {isSummarizing ? '⏳ 生成中...' : '📄 全量总结'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleGenerate('highlights')}
                            disabled={isSummarizing || notes.filter((n) => n.isHighlight).length === 0}
                            id="ai-summary-highlights-btn"
                        >
                            ⭐ 高光摘要
                        </button>
                    </div>

                    {isSummarizing && (
                        <div className="ai-summary-loading">
                            <span>🤖</span>
                            <span>AI 正在分析你的笔记...</span>
                        </div>
                    )}

                    {summaryError && (
                        <p className="ai-summary-error">⚠️ {summaryError}</p>
                    )}

                    {summary && !isSummarizing && (
                        <div className="ai-summary-text">{summary}</div>
                    )}

                    {!summary && !isSummarizing && !summaryError && (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            添加笔记后，点击上方按钮让 AI 自动总结视频内容
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
