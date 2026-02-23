import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import VideoPlayer from '../components/VideoPlayer';
import LiveTimer from '../components/LiveTimer';
import NotePanel from '../components/NotePanel';
import useVideoStore from '../stores/useVideoStore';
import useNoteStore from '../stores/useNoteStore';

export default function WorkspacePage() {
    const { id } = useParams();
    const { currentProject, loadProject, updateProject, clearCurrentProject } = useVideoStore();
    const { loadNotes, clearNotes } = useNoteStore();
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [videoUrlInput, setVideoUrlInput] = useState('');
    const [localVideoUrl, setLocalVideoUrl] = useState(null);
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        loadProject(id);
        loadNotes(id);

        return () => {
            clearCurrentProject();
            clearNotes();
        };
    }, [id, loadProject, loadNotes, clearCurrentProject, clearNotes]);

    const handleSetVideo = (videoData) => {
        if (videoData === null) {
            setShowVideoModal(true);
            return;
        }

        if (videoData.type === 'local') {
            setLocalVideoUrl(videoData.url);
            updateProject(id, {
                videoType: 'local',
                localFileName: videoData.fileName,
            });
        }
    };

    const handleSetVideoUrl = () => {
        const url = videoUrlInput.trim();
        if (!url) return;

        updateProject(id, { videoUrl: url, videoType: 'url' });
        setShowVideoModal(false);
        setVideoUrlInput('');
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            setLocalVideoUrl(url);
            updateProject(id, {
                videoType: 'local',
                localFileName: file.name,
            });
            setShowVideoModal(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setLocalVideoUrl(url);
            updateProject(id, {
                videoType: 'local',
                localFileName: file.name,
            });
            setShowVideoModal(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    if (!currentProject) {
        return (
            <div>
                <Header showBack />
                <div className="empty-state" style={{ paddingTop: '20vh' }}>
                    <div style={{ animation: 'pulse 1.5s ease infinite' }}>⏳</div>
                    <p>加载中...</p>
                </div>
            </div>
        );
    }

    const projectType = currentProject.projectType || 'video';
    const isLiveOrMeeting = projectType === 'live' || projectType === 'meeting';
    const videoSrc = localVideoUrl || currentProject.videoUrl;

    // Header title with mode badge
    const modeIcons = { video: '🎬', live: '📡', meeting: '🎙️' };
    const headerTitle = `${modeIcons[projectType] || '🎬'} ${currentProject.title}`;

    return (
        <div>
            <Header showBack title={headerTitle} />

            <div className="workspace-page">
                {/* Left: Video / Timer Area */}
                <div className="workspace-main">
                    <div className="workspace-video-area">
                        {isLiveOrMeeting ? (
                            <LiveTimer mode={projectType} projectId={id} />
                        ) : (
                            <VideoPlayer
                                videoUrl={videoSrc}
                                onSetVideo={handleSetVideo}
                            />
                        )}
                    </div>
                </div>

                {/* Right: Note Panel */}
                <div className="workspace-sidebar">
                    <NotePanel
                        projectId={id}
                        projectTitle={currentProject.title}
                    />
                </div>
            </div>

            {/* Video URL Modal (video mode only) */}
            {showVideoModal && !isLiveOrMeeting && (
                <div
                    className="video-url-modal"
                    onClick={(e) => e.target === e.currentTarget && setShowVideoModal(false)}
                >
                    <div className="video-url-modal-content">
                        <h3>🎬 设置视频源</h3>

                        <div className="input-group">
                            <label>YouTube 或在线视频链接</label>
                            <input
                                className="input"
                                type="url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={videoUrlInput}
                                onChange={(e) => setVideoUrlInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSetVideoUrl()}
                                autoFocus
                                id="workspace-video-url-input"
                            />
                        </div>

                        <div className="divider-text">或</div>

                        <div
                            className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleFileDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <span style={{ fontSize: '2rem' }}>📁</span>
                            <p>拖拽视频文件到这里，或点击选择</p>
                            <p style={{ fontSize: '0.75rem' }}>支持 MP4, WebM, MOV 等格式</p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />

                        <div className="btn-group">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowVideoModal(false)}
                            >
                                取消
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSetVideoUrl}
                                disabled={!videoUrlInput.trim()}
                                id="set-video-btn"
                            >
                                确认
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
