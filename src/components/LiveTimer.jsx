import { useState, useEffect, useRef, useCallback } from 'react';
import { formatTime } from '../utils/formatTime';
import useVideoStore from '../stores/useVideoStore';
import useNoteStore from '../stores/useNoteStore';
import ConfirmDialog from './ConfirmDialog';
import { isSpeechSupported, createSpeechRecognizer } from '../services/speech';

/**
 * 直播/会议模式的计时器组件
 * 集成实时语音识别，自动生成时间戳笔记
 */
export default function LiveTimer({ mode = 'live', projectId }) {
    const [elapsed, setElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [startedAt, setStartedAt] = useState(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Speech recognition state
    const [speechStatus, setSpeechStatus] = useState('stopped'); // 'stopped' | 'listening' | 'error'
    const [interimText, setInterimText] = useState('');
    const [speechLang, setSpeechLang] = useState('zh-CN');
    const [speechEnabled, setSpeechEnabled] = useState(false);
    const recognizerRef = useRef(null);

    const intervalRef = useRef(null);
    const { setCurrentTime } = useVideoStore();
    const { addNote } = useNoteStore();

    // Sync elapsed time to store
    useEffect(() => {
        setCurrentTime(elapsed);
    }, [elapsed, setCurrentTime]);

    // ========== Timer Logic ==========
    const start = useCallback(() => {
        if (isRunning) return;
        const now = Date.now();
        setStartedAt(now - elapsed * 1000);
        setIsRunning(true);
    }, [isRunning, elapsed]);

    const pause = useCallback(() => {
        setIsRunning(false);
        // Also pause speech recognition
        if (recognizerRef.current) {
            recognizerRef.current.stop();
        }
    }, []);

    const handleResetClick = useCallback(() => {
        setShowResetConfirm(true);
    }, []);

    const handleConfirmReset = useCallback(() => {
        setShowResetConfirm(false);
        setIsRunning(false);
        setElapsed(0);
        setStartedAt(null);
        setCurrentTime(0);
        // Stop speech recognition
        if (recognizerRef.current) {
            recognizerRef.current.stop();
        }
        setSpeechEnabled(false);
        setInterimText('');
    }, [setCurrentTime]);

    // Timer tick
    useEffect(() => {
        if (isRunning && startedAt) {
            intervalRef.current = setInterval(() => {
                const now = Date.now();
                setElapsed(Math.floor((now - startedAt) / 1000));
            }, 200);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning, startedAt]);

    // ========== Speech Recognition Logic ==========
    const handleSpeechResult = useCallback(
        (text, isFinal) => {
            if (isFinal && text.length > 0) {
                // Auto-create a timestamped note from recognized speech
                addNote(projectId, `🎤 ${text}`, elapsed);
                setInterimText('');
            } else {
                setInterimText(text);
            }
        },
        [projectId, elapsed, addNote]
    );

    const handleSpeechError = useCallback((error) => {
        console.error('Speech error:', error);
        if (error === 'not-allowed') {
            setSpeechStatus('error');
        }
    }, []);

    const handleSpeechStatusChange = useCallback((status) => {
        setSpeechStatus(status);
    }, []);

    const toggleSpeech = useCallback(() => {
        if (!isSpeechSupported()) {
            alert('你的浏览器不支持语音识别，请使用 Chrome 浏览器。');
            return;
        }

        if (speechEnabled) {
            // Stop speech
            if (recognizerRef.current) {
                recognizerRef.current.stop();
                recognizerRef.current = null;
            }
            setSpeechEnabled(false);
            setInterimText('');
        } else {
            // Start speech
            const recognizer = createSpeechRecognizer({
                onResult: handleSpeechResult,
                onError: handleSpeechError,
                onStatusChange: handleSpeechStatusChange,
                lang: speechLang,
            });

            if (recognizer) {
                recognizerRef.current = recognizer;
                recognizer.start();
                setSpeechEnabled(true);
            }
        }
    }, [speechEnabled, speechLang, handleSpeechResult, handleSpeechError, handleSpeechStatusChange]);

    // Update recognizer callback refs when elapsed changes
    useEffect(() => {
        if (recognizerRef.current && speechEnabled && !isRunning) {
            // Pause speech when timer is paused
            recognizerRef.current.stop();
        }
    }, [isRunning, speechEnabled]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognizerRef.current) {
                recognizerRef.current.stop();
            }
        };
    }, []);

    // Recreate recognizer when language changes
    useEffect(() => {
        if (recognizerRef.current && speechEnabled) {
            recognizerRef.current.stop();
            recognizerRef.current = null;

            const recognizer = createSpeechRecognizer({
                onResult: handleSpeechResult,
                onError: handleSpeechError,
                onStatusChange: handleSpeechStatusChange,
                lang: speechLang,
            });
            if (recognizer) {
                recognizerRef.current = recognizer;
                if (isRunning) {
                    recognizer.start();
                }
            }
        }
    }, [speechLang]);

    // ========== Mode Config ==========
    const modeConfig = {
        live: {
            icon: '📡',
            title: '直播模式',
            subtitle: '正在记录直播内容',
            color: '#EF4444',
            bgGradient: 'linear-gradient(135deg, #1a0505 0%, #0f0f14 50%, #150520 100%)',
            pulseColor: 'rgba(239, 68, 68, 0.4)',
        },
        meeting: {
            icon: '🎙️',
            title: '会议模式',
            subtitle: '正在记录会议内容',
            color: '#10B981',
            bgGradient: 'linear-gradient(135deg, #051a10 0%, #0f0f14 50%, #051520 100%)',
            pulseColor: 'rgba(16, 185, 129, 0.4)',
        },
    };

    const config = modeConfig[mode] || modeConfig.live;
    const hasSpeechSupport = isSpeechSupported();

    const LANG_OPTIONS = [
        { value: 'zh-CN', label: '中文' },
        { value: 'en-US', label: 'English' },
        { value: 'ja-JP', label: '日本語' },
        { value: 'ko-KR', label: '한국어' },
    ];

    return (
        <>
            <div className="live-timer-wrapper" style={{ background: config.bgGradient }}>
                {/* Status Indicator */}
                <div className="live-timer-status">
                    <div
                        className={`live-timer-dot ${isRunning ? 'active' : ''}`}
                        style={{
                            background: config.color,
                            boxShadow: isRunning ? `0 0 12px ${config.pulseColor}` : 'none',
                        }}
                    />
                    <span style={{ color: config.color, fontWeight: 600 }}>
                        {config.icon} {config.title}
                    </span>
                    <span className="live-timer-subtitle">{config.subtitle}</span>
                </div>

                {/* Timer Display */}
                <div className="live-timer-display">
                    <span className="live-timer-time">{formatTime(elapsed)}</span>
                </div>

                {/* Controls */}
                <div className="live-timer-controls">
                    {!isRunning ? (
                        <button
                            className="btn btn-primary live-timer-btn"
                            onClick={start}
                            id="timer-start-btn"
                            style={{
                                background: config.color,
                                boxShadow: `0 4px 16px ${config.pulseColor}`,
                            }}
                        >
                            {elapsed > 0 ? '▶ 继续' : '▶ 开始记录'}
                        </button>
                    ) : (
                        <button
                            className="btn btn-secondary live-timer-btn"
                            onClick={pause}
                            id="timer-pause-btn"
                        >
                            ⏸ 暂停
                        </button>
                    )}
                    {elapsed > 0 && (
                        <button
                            className="btn btn-ghost live-timer-btn"
                            onClick={handleResetClick}
                            id="timer-reset-btn"
                        >
                            ↺ 重置
                        </button>
                    )}
                </div>

                {/* Speech Recognition Controls */}
                {isRunning && hasSpeechSupport && (
                    <div className="speech-controls animate-fadeIn">
                        <button
                            className={`btn speech-toggle-btn ${speechEnabled ? 'active' : ''}`}
                            onClick={toggleSpeech}
                            id="speech-toggle-btn"
                            style={
                                speechEnabled
                                    ? { background: config.color, color: 'white', boxShadow: `0 0 16px ${config.pulseColor}` }
                                    : {}
                            }
                        >
                            <span className={`speech-mic-icon ${speechEnabled ? 'pulsing' : ''}`}>
                                🎤
                            </span>
                            {speechEnabled ? '语音识别中...' : '开启语音识别'}
                        </button>

                        {speechEnabled && (
                            <select
                                className="speech-lang-select"
                                value={speechLang}
                                onChange={(e) => setSpeechLang(e.target.value)}
                                id="speech-lang-select"
                            >
                                {LANG_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                {/* Interim transcript preview */}
                {interimText && (
                    <div className="speech-interim animate-fadeIn">
                        <span className="speech-interim-label">识别中:</span>
                        <span className="speech-interim-text">{interimText}</span>
                    </div>
                )}

                {/* Hint */}
                {!isRunning && elapsed === 0 && (
                    <p className="live-timer-hint">
                        点击"开始记录"启动计时器
                        {hasSpeechSupport && '，可开启语音识别自动记录笔记'}
                    </p>
                )}

                {/* Speech not supported warning */}
                {!hasSpeechSupport && isRunning && (
                    <p className="live-timer-hint" style={{ color: 'var(--color-warning)' }}>
                        ⚠️ 当前浏览器不支持语音识别，推荐使用 Chrome
                    </p>
                )}
            </div>

            <ConfirmDialog
                isOpen={showResetConfirm}
                title="↺ 重置计时器"
                message="确定重置计时器吗？计时将归零，语音识别将停止，但已有的笔记不会被删除。"
                confirmText="重置"
                onConfirm={handleConfirmReset}
                onCancel={() => setShowResetConfirm(false)}
            />
        </>
    );
}
