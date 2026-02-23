/**
 * VidNote Extension — Background Service Worker
 * 负责：
 * 1. 扩展图标点击 → 打开侧边栏
 * 2. 消息中转（Content Script ↔ Side Panel）
 * 3. 上下文菜单
 */

// 设置侧边栏行为：点击扩展图标时自动打开侧边栏
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.warn('Side panel not supported:', err));

// 消息路由：在 Content Script 和 Side Panel 之间中转消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 来自 Content Script 的消息
    if (message.source === 'vidnote-content') {
        handleContentMessage(message, sender, sendResponse);
        return true; // 异步响应
    }

    // 来自 Side Panel 的消息
    if (message.source === 'vidnote-panel') {
        handlePanelMessage(message, sender, sendResponse);
        return true;
    }
});

/**
 * 处理来自 Content Script 的消息
 */
async function handleContentMessage(message, sender, sendResponse) {
    switch (message.type) {
        case 'VIDEO_INFO': {
            // 将视频信息转发给侧边栏
            try {
                await chrome.runtime.sendMessage({
                    source: 'vidnote-bg',
                    type: 'VIDEO_INFO',
                    data: message.data,
                });
            } catch {
                // 侧边栏可能未打开，忽略
            }
            sendResponse({ ok: true });
            break;
        }

        case 'TIME_UPDATE': {
            // 将播放时间转发给侧边栏
            try {
                await chrome.runtime.sendMessage({
                    source: 'vidnote-bg',
                    type: 'TIME_UPDATE',
                    data: message.data,
                });
            } catch {
                // 忽略
            }
            sendResponse({ ok: true });
            break;
        }

        default:
            sendResponse({ ok: false, error: 'Unknown message type' });
    }
}

/**
 * 处理来自 Side Panel 的消息
 */
async function handlePanelMessage(message, sender, sendResponse) {
    switch (message.type) {
        case 'SEEK_TO': {
            // 发送跳转指令给 Content Script
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        source: 'vidnote-bg',
                        type: 'SEEK_TO',
                        data: { time: message.data.time },
                    });
                } catch {
                    // Content Script 可能未加载
                }
            }
            sendResponse({ ok: true });
            break;
        }

        case 'GET_VIDEO_INFO': {
            // 请求 Content Script 发送当前视频信息
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        source: 'vidnote-bg',
                        type: 'GET_VIDEO_INFO',
                    });
                    sendResponse({ ok: true, data: response });
                } catch {
                    sendResponse({ ok: false, error: 'Content script not ready' });
                }
            } else {
                sendResponse({ ok: false, error: 'No active tab' });
            }
            break;
        }

        case 'GET_CURRENT_TIME': {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        source: 'vidnote-bg',
                        type: 'GET_CURRENT_TIME',
                    });
                    sendResponse({ ok: true, data: response });
                } catch {
                    sendResponse({ ok: false, error: 'Content script not ready' });
                }
            } else {
                sendResponse({ ok: false, error: 'No active tab' });
            }
            break;
        }

        default:
            sendResponse({ ok: false, error: 'Unknown message type' });
    }
}

// 监听标签页更新，检测 YouTube 页面导航
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com/watch')) {
        // YouTube 视频页面加载完成，通知侧边栏
        chrome.runtime.sendMessage({
            source: 'vidnote-bg',
            type: 'TAB_UPDATED',
            data: { tabId, url: tab.url },
        }).catch(() => { });
    }
});
