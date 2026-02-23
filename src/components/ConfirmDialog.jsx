import { useState, useEffect } from 'react';

/**
 * 自定义确认弹窗，替代 window.confirm 避免闪屏
 */
export default function ConfirmDialog({ isOpen, title, message, confirmText = '确认', cancelText = '取消', onConfirm, onCancel, danger = false }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Small delay to trigger animation
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onCancel();
    };

    return (
        <div
            className={`confirm-overlay ${visible ? 'visible' : ''}`}
            onClick={handleOverlayClick}
        >
            <div className={`confirm-dialog ${visible ? 'visible' : ''}`}>
                {title && <h3 className="confirm-title">{title}</h3>}
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                        id="confirm-dialog-btn"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
