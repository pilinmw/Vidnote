import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import VideoCard from '../components/VideoCard';
import useVideoStore from '../stores/useVideoStore';

const PROJECT_TYPES = [
    { key: 'video', icon: '🎬', label: '视频笔记', desc: 'YouTube / 本地视频' },
    { key: 'live', icon: '📡', label: '直播记录', desc: '实时直播内容' },
    { key: 'meeting', icon: '🎙️', label: '会议记录', desc: '会议 / 讲座笔记' },
];

export default function HomePage() {
    const navigate = useNavigate();
    const { projects, isLoading, loadProjects, createProject, removeProject } = useVideoStore();
    const [showNewModal, setShowNewModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [projectType, setProjectType] = useState('video');

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const handleCreateProject = async () => {
        const title = newTitle.trim() || getDefaultTitle(projectType);
        const project = await createProject({
            title,
            videoUrl: projectType === 'video' ? newUrl.trim() : '',
            videoType: projectType === 'video' ? (newUrl.trim() ? 'url' : 'local') : projectType,
            projectType,
        });
        setShowNewModal(false);
        setNewTitle('');
        setNewUrl('');
        setProjectType('video');
        navigate(`/video/${project.id}`);
    };

    const getDefaultTitle = (type) => {
        const now = new Date().toLocaleDateString('zh-CN');
        switch (type) {
            case 'live': return `直播记录 - ${now}`;
            case 'meeting': return `会议记录 - ${now}`;
            default: return '未命名视频';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleCreateProject();
        if (e.key === 'Escape') setShowNewModal(false);
    };

    return (
        <div>
            <Header />

            <main className="home-page">
                {/* Hero */}
                <section className="home-hero animate-fadeIn">
                    <h1>
                        <span className="gradient-text">VidNote</span>
                    </h1>
                    <p>智能视频笔记工具 — 边看边记，AI 自动总结</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                        支持视频、直播、会议等多种场景
                    </p>
                </section>

                {/* Actions */}
                <div className="home-actions">
                    <h2>我的项目</h2>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowNewModal(true)}
                        id="new-project-btn"
                    >
                        + 新建项目
                    </button>
                </div>

                {/* Video Grid */}
                <div className="video-grid">
                    <div
                        className="new-video-card"
                        onClick={() => setShowNewModal(true)}
                    >
                        <div className="new-video-card-icon">+</div>
                        <span>新建笔记项目</span>
                    </div>

                    {projects.map((project) => (
                        <VideoCard
                            key={project.id}
                            project={project}
                            onDelete={removeProject}
                        />
                    ))}
                </div>

                {projects.length === 0 && !isLoading && (
                    <div className="empty-state" style={{ marginTop: '2rem' }}>
                        <div className="empty-state-icon">🎬</div>
                        <p>还没有任何项目</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            点击"新建项目"开始记录你的第一个视频、直播或会议笔记
                        </p>
                    </div>
                )}
            </main>

            {/* New Project Modal */}
            {showNewModal && (
                <div
                    className="video-url-modal"
                    onClick={(e) => e.target === e.currentTarget && setShowNewModal(false)}
                >
                    <div className="video-url-modal-content">
                        <h3>📋 新建笔记项目</h3>

                        {/* Project Type Selector */}
                        <div className="project-type-selector">
                            {PROJECT_TYPES.map((t) => (
                                <button
                                    key={t.key}
                                    className={`project-type-option ${projectType === t.key ? 'active' : ''}`}
                                    onClick={() => setProjectType(t.key)}
                                >
                                    <span className="project-type-option-icon">{t.icon}</span>
                                    <span className="project-type-option-label">{t.label}</span>
                                    <span className="project-type-option-desc">{t.desc}</span>
                                </button>
                            ))}
                        </div>

                        <div className="input-group">
                            <label>项目标题</label>
                            <input
                                className="input"
                                type="text"
                                placeholder={
                                    projectType === 'video'
                                        ? '例如：React 教程学习笔记'
                                        : projectType === 'live'
                                            ? '例如：某某直播回顾'
                                            : '例如：产品评审会议'
                                }
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                id="project-title-input"
                            />
                        </div>

                        {/* Only show URL input for video mode */}
                        {projectType === 'video' && (
                            <div className="input-group">
                                <label>视频链接（可选，稍后也可以设置）</label>
                                <input
                                    className="input"
                                    type="url"
                                    placeholder="粘贴 YouTube 链接..."
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    id="video-url-input"
                                />
                            </div>
                        )}

                        {/* Mode hint */}
                        {projectType !== 'video' && (
                            <p style={{
                                fontSize: '0.8rem',
                                color: 'var(--color-text-muted)',
                                marginBottom: 'var(--space-lg)',
                                padding: '8px 12px',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-sm)',
                            }}>
                                💡 {projectType === 'live' ? '直播' : '会议'}模式将使用计时器替代视频播放器，
                                你可以在计时器运行时随时添加带时间戳的笔记。
                            </p>
                        )}

                        <div className="btn-group">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowNewModal(false)}
                            >
                                取消
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateProject}
                                id="create-project-btn"
                            >
                                创建项目
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
