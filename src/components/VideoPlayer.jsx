import { useRef, useCallback, useState } from 'react';
import ReactPlayer from 'react-player';
import useVideoStore from '../stores/useVideoStore';

export default function VideoPlayer({ videoUrl, onSetVideo }) {
    const playerRef = useRef(null);
    const fileInputRef = useRef(null);
    const [localVideoUrl, setLocalVideoUrl] = useState(null);
    const { setPlayerRef, setCurrentTime, setDuration, setIsPlaying } = useVideoStore();

    const actualUrl = localVideoUrl || videoUrl;

    const handleReady = useCallback(() => {
        if (playerRef.current) {
            setPlayerRef(playerRef.current);
        }
    }, [setPlayerRef]);

    const handleProgress = useCallback(
        (state) => {
            setCurrentTime(state.playedSeconds);
        },
        [setCurrentTime]
    );

    const handleDuration = useCallback(
        (d) => {
            setDuration(d);
        },
        [setDuration]
    );

    const handlePlay = useCallback(() => setIsPlaying(true), [setIsPlaying]);
    const handlePause = useCallback(() => setIsPlaying(false), [setIsPlaying]);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setLocalVideoUrl(url);
            if (onSetVideo) {
                onSetVideo({ type: 'local', fileName: file.name, url });
            }
        }
    };

    if (!actualUrl) {
        return (
            <div className="video-player-empty" onClick={() => onSetVideo && onSetVideo(null)}>
                <div className="video-player-empty-icon">🎬</div>
                <p>点击设置视频源</p>
                <p style={{ fontSize: '0.75rem' }}>支持 YouTube 链接或本地视频文件</p>
            </div>
        );
    }

    return (
        <div className="video-player-wrapper">
            <ReactPlayer
                ref={playerRef}
                url={actualUrl}
                width="100%"
                height="100%"
                controls
                playing={false}
                onReady={handleReady}
                onProgress={handleProgress}
                onDuration={handleDuration}
                onPlay={handlePlay}
                onPause={handlePause}
                progressInterval={200}
                config={{
                    youtube: {
                        playerVars: {
                            modestbranding: 1,
                            rel: 0,
                        },
                    },
                }}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />
        </div>
    );
}
