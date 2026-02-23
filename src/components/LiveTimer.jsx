import { useState, useEffect, useRef, useCallback } from 'react';
import { formatTime } from '../utils/formatTime';
import useVideoStore from '../stores/useVideoStore';

/**
 * 直播/会议模式的计时器组件
 * 替代视频播放器，提供自运行的时间戳
 */
export default function LiveTimer({ mode = 'live', projectId }) {
    const [elapsed, setElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [startedAt, setStartedAt] = useState(null);
    const intervalRef = useRef(null);
    const { setCurrentTime } = useVideoStore();

    // Sync elapsed time to store
    useEffect(() => {
        setCurrentTime(elapsed);
    }, [elapsed, setCurrentTime]);

    const start = useCallback(() => {
        if (isRunning) return;
        const now = Date.now();
        setStartedAt(now - elapsed * 1000);
        setIsRunning(true);
    }, [isRunning, elapsed]);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const reset = useCallback(() => {
        if (window.confirm('确定重置计时器吗？笔记不会被删除。')) {
            setIsRunning(false);
            setElapsed(0);
            setStartedAt(null);
            setCurrentTime(0);
        }
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

    return (
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
                        onClick={reset}
                        id="timer-reset-btn"
                    >
                        ↺ 重置
                    </button>
                )}
            </div>

            {/* Hint */}
            {!isRunning && elapsed === 0 && (
                <p className="live-timer-hint">
                    点击"开始记录"启动计时器，然后在右侧面板添加笔记
                </p>
            )}
        </div>
    );
}
