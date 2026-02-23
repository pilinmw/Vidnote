import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/formatTime';
import { extractYouTubeId } from '../utils/formatTime';

const TYPE_CONFIG = {
    video: { icon: '🎬', label: '视频' },
    live: { icon: '📡', label: '直播' },
    meeting: { icon: '🎙️', label: '会议' },
};

export default function VideoCard({ project, onDelete }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/video/${project.id}`);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm(`确定删除"${project.title}"吗？所有笔记也将被删除。`)) {
            onDelete(project.id);
        }
    };

    const projectType = project.projectType || 'video';
    const typeConfig = TYPE_CONFIG[projectType] || TYPE_CONFIG.video;

    // Get YouTube thumbnail if available (video mode only)
    const ytId = projectType === 'video' ? extractYouTubeId(project.videoUrl) : null;
    const thumbnailUrl = ytId
        ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
        : null;

    return (
        <div className="video-card" onClick={handleClick} id={`video-card-${project.id}`}>
            <div className="video-card-thumbnail">
                {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={project.title} />
                ) : (
                    <span>{typeConfig.icon}</span>
                )}
                <button
                    className="video-card-delete"
                    onClick={handleDelete}
                    title="删除"
                >
                    🗑
                </button>
            </div>

            <div className="video-card-info">
                <h3 className="video-card-title">{project.title}</h3>
                <div className="video-card-meta">
                    <span className="badge badge-accent">{typeConfig.icon} {typeConfig.label}</span>
                    <span>📝 {project.noteCount || 0} 条笔记</span>
                    <span>{formatDate(project.updatedAt)}</span>
                </div>
            </div>
        </div>
    );
}
