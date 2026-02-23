import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import SettingsModal from './SettingsModal';

export default function Header({ title, showBack = false }) {
    const [showSettings, setShowSettings] = useState(false);
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <>
            <header className="header">
                <div className="header-left">
                    {showBack ? (
                        <>
                            <Link to="/" className="header-back">
                                ← 返回
                            </Link>
                            <span className="header-title">{title}</span>
                        </>
                    ) : (
                        <Link to="/" className="header-logo">
                            <img src="/favicon.svg" alt="VidNote" />
                            <span className="gradient-text">VidNote</span>
                        </Link>
                    )}
                </div>

                <div className="header-right">
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => setShowSettings(true)}
                        title="设置"
                        id="settings-btn"
                    >
                        ⚙️
                    </button>
                </div>
            </header>

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </>
    );
}
