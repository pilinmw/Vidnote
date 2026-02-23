import { useState, useEffect } from 'react';
import { getSetting, saveSetting } from '../services/storage';

export default function SettingsModal({ onClose }) {
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        getSetting('openai_api_key').then((key) => {
            if (key) setApiKey(key);
        });
    }, []);

    const handleSave = async () => {
        await saveSetting('openai_api_key', apiKey.trim());
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onClose();
        }, 1000);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="settings-overlay" onClick={handleOverlayClick}>
            <div className="settings-modal animate-slideUp">
                <h2>⚙️ 设置</h2>

                <div className="settings-group">
                    <label htmlFor="api-key-input">OpenAI API Key</label>
                    <input
                        id="api-key-input"
                        type="password"
                        className="input"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                    />
                    <p className="hint">
                        用于 AI 自动总结功能。密钥仅保存在本地浏览器中。
                    </p>
                </div>

                <div className="settings-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        取消
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} id="save-settings-btn">
                        {saved ? '✓ 已保存' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}
