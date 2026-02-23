/**
 * VidNote Extension — Content Script
 * 注入到 YouTube 页面，负责：
 * 1. 获取视频播放器引用
 * 2. 监听播放进度
 * 3. 响应时间戳跳转指令
 * 4. 在视频播放器上显示 VidNote 快捷按钮
 */

(function () {
    'use strict';

    let videoElement = null;
    let timeUpdateInterval = null;
    let lastUrl = location.href;

    // ====== 初始化 ======

    function init() {
        waitForVideo();
        observeUrlChange();
        injectFloatingButton();
    }

    // ====== 查找 YouTube 视频元素 ======

    function waitForVideo() {
        const check = () => {
            videoElement = document.querySelector('video.html5-main-video');
            if (videoElement) {
                setupVideoListeners();
                sendVideoInfo();
            } else {
                setTimeout(check, 500);
            }
        };
        check();
    }

    // ====== 视频事件监听 ======

    function setupVideoListeners() {
        // 清除旧的定时器
        if (timeUpdateInterval) {
            clearInterval(timeUpdateInterval);
        }

        // 定期发送播放时间（每500ms）
        timeUpdateInterval = setInterval(() => {
            if (videoElement && !videoElement.paused) {
                chrome.runtime.sendMessage({
                    source: 'vidnote-content',
                    type: 'TIME_UPDATE',
                    data: {
                        currentTime: videoElement.currentTime,
                        duration: videoElement.duration,
                        paused: videoElement.paused,
                    },
                }).catch(() => { });
            }
        }, 500);

        // 播放/暂停事件
        videoElement.addEventListener('play', sendPlayState);
        videoElement.addEventListener('pause', sendPlayState);
        videoElement.addEventListener('seeked', sendPlayState);
    }

    function sendPlayState() {
        if (!videoElement) return;
        chrome.runtime.sendMessage({
            source: 'vidnote-content',
            type: 'TIME_UPDATE',
            data: {
                currentTime: videoElement.currentTime,
                duration: videoElement.duration,
                paused: videoElement.paused,
            },
        }).catch(() => { });
    }

    // ====== 发送视频信息 ======

    function sendVideoInfo() {
        const title = document.querySelector(
            '#above-the-fold #title h1 yt-formatted-string, ' +
            'h1.ytd-watch-metadata yt-formatted-string'
        )?.textContent?.trim() || document.title.replace(' - YouTube', '');

        const url = location.href;
        const videoId = extractVideoId(url);

        chrome.runtime.sendMessage({
            source: 'vidnote-content',
            type: 'VIDEO_INFO',
            data: {
                title,
                url,
                videoId,
                duration: videoElement?.duration || 0,
            },
        }).catch(() => { });
    }

    function extractVideoId(url) {
        const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    // ====== 监听 URL 变化（YouTube SPA 导航）======

    function observeUrlChange() {
        const observer = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                if (location.href.includes('youtube.com/watch')) {
                    // 新视频页面，重新初始化
                    setTimeout(() => {
                        waitForVideo();
                    }, 1000);
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ====== 注入浮动按钮 ======

    function injectFloatingButton() {
        // 等待播放器容器加载
        const waitForPlayer = () => {
            const playerContainer = document.querySelector('#movie_player');
            if (!playerContainer) {
                setTimeout(waitForPlayer, 1000);
                return;
            }

            // 检查是否已经注入
            if (document.getElementById('vidnote-fab')) return;

            const fab = document.createElement('button');
            fab.id = 'vidnote-fab';
            fab.title = 'VidNote — 添加笔记';
            fab.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
          <polygon points="24,18 24,46 48,32" fill="white" opacity="0.95"/>
          <rect x="12" y="48" width="28" height="3" rx="1.5" fill="white" opacity="0.7"/>
          <rect x="12" y="53" width="20" height="3" rx="1.5" fill="white" opacity="0.5"/>
        </svg>
      `;

            fab.addEventListener('click', (e) => {
                e.stopPropagation();
                // 打开侧边栏
                chrome.runtime.sendMessage({
                    source: 'vidnote-content',
                    type: 'VIDEO_INFO',
                    data: {
                        title: document.querySelector(
                            '#above-the-fold #title h1 yt-formatted-string'
                        )?.textContent?.trim() || document.title.replace(' - YouTube', ''),
                        url: location.href,
                        videoId: extractVideoId(location.href),
                        duration: videoElement?.duration || 0,
                        currentTime: videoElement?.currentTime || 0,
                        requestPanel: true,
                    },
                }).catch(() => { });
            });

            playerContainer.appendChild(fab);
        };

        waitForPlayer();
    }

    // ====== 接收来自 Background 的消息 ======

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.source !== 'vidnote-bg') return;

        switch (message.type) {
            case 'SEEK_TO': {
                if (videoElement) {
                    videoElement.currentTime = message.data.time;
                    sendResponse({ ok: true });
                } else {
                    sendResponse({ ok: false, error: 'No video element' });
                }
                break;
            }

            case 'GET_VIDEO_INFO': {
                sendVideoInfo();
                sendResponse({
                    title: document.querySelector(
                        '#above-the-fold #title h1 yt-formatted-string'
                    )?.textContent?.trim() || document.title.replace(' - YouTube', ''),
                    url: location.href,
                    videoId: extractVideoId(location.href),
                    duration: videoElement?.duration || 0,
                });
                break;
            }

            case 'GET_CURRENT_TIME': {
                sendResponse({
                    currentTime: videoElement?.currentTime || 0,
                    duration: videoElement?.duration || 0,
                    paused: videoElement?.paused ?? true,
                });
                break;
            }
        }

        return true;
    });

    // ====== 启动 ======
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
