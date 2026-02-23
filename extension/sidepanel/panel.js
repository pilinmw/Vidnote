/**
 * VidNote Extension — Side Panel 主逻辑
 * 纯 JavaScript，无框架依赖
 */

import {
    getAllProjects,
    getProject,
    saveProject,
    getNotesByProject,
    saveNote,
    deleteNote,
    getSetting,
    saveSetting,
} from '../shared/storage.js';
import { formatTime, generateId, extractYouTubeId } from '../shared/utils.js';
import { generateSummary } from '../shared/ai.js';

// ====== 状态 ======

const state = {
    currentProjectId: null,
    currentVideoId: null,
    videoTitle: '',
    currentTime: 0,
    duration: 0,
    notes: [],
    filterMode: 'all', // 'all' | 'highlights'
    searchQuery: '',
};

// ====== DOM 引用 ======

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
    videoInfo: $('#video-info'),
    videoTitle: $('#video-title'),
    currentTime: $('#current-time'),
    duration: $('#duration'),
    statusBanner: $('#status-banner'),
    notesList: $('#notes-list'),
    noteCount: $('#note-count'),
    noteInput: $('#note-input'),
    btnAddNote: $('#btn-add-note'),
    inputTimestamp: $('#input-timestamp'),
    searchInput: $('#search-input'),
    filterTabs: $$('.filter-tab'),

    // AI
    aiPanel: $('#ai-panel'),
    aiToggle: $('#ai-toggle'),
    aiBody: $('#ai-body'),
    btnAiFull: $('#btn-ai-full'),
    btnAiHighlights: $('#btn-ai-highlights'),
    aiResult: $('#ai-result'),
    aiLoading: $('#ai-loading'),
    aiError: $('#ai-error'),

    // Settings
    btnSettings: $('#btn-settings'),
    btnExport: $('#btn-export'),
    settingsModal: $('#settings-modal'),
    apiKeyInput: $('#api-key-input'),
    btnSettingsSave: $('#btn-settings-save'),
    btnSettingsCancel: $('#btn-settings-cancel'),
};

// ====== 初始化 ======

async function init() {
    bindEvents();
    await loadApiKey();
    // 请求当前标签页的视频信息
    requestVideoInfo();
}

// ====== 事件绑定 ======

function bindEvents() {
    // 添加笔记
    dom.btnAddNote.addEventListener('click', addNote);
    dom.noteInput.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            addNote();
        }
    });

    // 搜索
    dom.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderNotes();
    });

    // 筛选标签
    dom.filterTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            dom.filterTabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            state.filterMode = tab.dataset.filter;
            renderNotes();
        });
    });

    // AI 面板
    dom.aiToggle.addEventListener('click', () => {
        dom.aiBody.classList.toggle('hidden');
        const arrow = dom.aiToggle.querySelector('.ai-panel-arrow');
        arrow.textContent = dom.aiBody.classList.contains('hidden') ? '▼' : '▲';
    });

    dom.btnAiFull.addEventListener('click', () => runAiSummary('full'));
    dom.btnAiHighlights.addEventListener('click', () => runAiSummary('highlights'));

    // 设置
    dom.btnSettings.addEventListener('click', openSettings);
    dom.btnSettingsSave.addEventListener('click', saveSettings);
    dom.btnSettingsCancel.addEventListener('click', closeSettings);
    $('.modal-backdrop')?.addEventListener('click', closeSettings);

    // 导出
    dom.btnExport.addEventListener('click', exportMarkdown);

    // 接收来自 Background 的消息
    chrome.runtime.onMessage.addListener(handleBgMessage);
}

// ====== 消息处理 ======

function handleBgMessage(message) {
    if (message.source !== 'vidnote-bg') return;

    switch (message.type) {
        case 'VIDEO_INFO':
            handleVideoInfo(message.data);
            break;

        case 'TIME_UPDATE':
            handleTimeUpdate(message.data);
            break;

        case 'TAB_UPDATED':
            // 新的 YouTube 页面，请求视频信息
            setTimeout(requestVideoInfo, 1500);
            break;
    }
}

function requestVideoInfo() {
    chrome.runtime.sendMessage({
        source: 'vidnote-panel',
        type: 'GET_VIDEO_INFO',
    }).catch(() => { });
}

async function handleVideoInfo(data) {
    if (!data || !data.videoId) return;

    // 检测视频是否发生变化
    if (data.videoId !== state.currentVideoId) {
        state.currentVideoId = data.videoId;
        state.videoTitle = data.title || '未知视频';
        state.duration = data.duration || 0;

        // 查找或创建项目
        await findOrCreateProject(data);
    }

    // 更新 UI
    dom.videoInfo.classList.remove('hidden');
    dom.statusBanner.classList.add('hidden');
    dom.aiPanel.classList.remove('hidden');
    dom.videoTitle.textContent = state.videoTitle;
    dom.duration.textContent = formatTime(state.duration);

    // 如果是从浮动按钮点击来的
    if (data.requestPanel && data.currentTime !== undefined) {
        state.currentTime = data.currentTime;
        dom.inputTimestamp.textContent = formatTime(state.currentTime);
        dom.noteInput.focus();
    }
}

function handleTimeUpdate(data) {
    state.currentTime = data.currentTime;
    state.duration = data.duration || state.duration;

    dom.currentTime.textContent = formatTime(data.currentTime);
    dom.duration.textContent = formatTime(state.duration);
    dom.inputTimestamp.textContent = formatTime(data.currentTime);
}

// ====== 项目管理 ======

async function findOrCreateProject(videoData) {
    const projects = await getAllProjects();
    let project = projects.find(
        (p) => p.videoId === videoData.videoId || p.videoUrl === videoData.url
    );

    if (!project) {
        project = {
            id: generateId(),
            title: videoData.title || '未命名视频',
            videoUrl: videoData.url,
            videoId: videoData.videoId,
            videoType: 'url',
            projectType: 'video',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            noteCount: 0,
        };
        await saveProject(project);
    }

    state.currentProjectId = project.id;

    // 加载该项目的笔记
    state.notes = await getNotesByProject(project.id);
    renderNotes();
}

// ====== 笔记操作 ======

async function addNote() {
    const content = dom.noteInput.value.trim();
    if (!content || !state.currentProjectId) return;

    // 请求最新播放时间
    let timestamp = state.currentTime;
    try {
        const resp = await chrome.runtime.sendMessage({
            source: 'vidnote-panel',
            type: 'GET_CURRENT_TIME',
        });
        if (resp?.ok && resp.data) {
            timestamp = resp.data.currentTime;
        }
    } catch {
        // 使用缓存的时间
    }

    const note = {
        id: generateId(),
        projectId: state.currentProjectId,
        content,
        timestamp,
        formattedTime: formatTime(timestamp),
        isHighlight: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    await saveNote(note);
    state.notes.push(note);
    state.notes.sort((a, b) => a.timestamp - b.timestamp);

    dom.noteInput.value = '';
    renderNotes();

    // 滚动到新笔记
    setTimeout(() => {
        const noteEl = document.getElementById(`note-${note.id}`);
        noteEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
}

async function toggleHighlight(noteId) {
    const note = state.notes.find((n) => n.id === noteId);
    if (!note) return;

    note.isHighlight = !note.isHighlight;
    note.updatedAt = Date.now();
    await saveNote(note);
    renderNotes();
}

async function removeNote(noteId) {
    await deleteNote(noteId);
    state.notes = state.notes.filter((n) => n.id !== noteId);
    renderNotes();
}

async function editNote(noteId, newContent) {
    const note = state.notes.find((n) => n.id === noteId);
    if (!note) return;

    note.content = newContent;
    note.updatedAt = Date.now();
    await saveNote(note);
    renderNotes();
}

function seekToTimestamp(time) {
    chrome.runtime.sendMessage({
        source: 'vidnote-panel',
        type: 'SEEK_TO',
        data: { time },
    }).catch(() => { });
}

// ====== 渲染笔记列表 ======

function renderNotes() {
    let filtered = [...state.notes];

    // 筛选模式
    if (state.filterMode === 'highlights') {
        filtered = filtered.filter((n) => n.isHighlight);
    }

    // 搜索
    if (state.searchQuery.trim()) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter((n) => n.content.toLowerCase().includes(q));
    }

    dom.noteCount.textContent = filtered.length;

    if (filtered.length === 0) {
        dom.notesList.innerHTML = `
      <div class="empty-notes">
        <div class="empty-notes-icon">📝</div>
        <p>暂无笔记</p>
        <p class="empty-notes-hint">${state.filterMode === 'highlights'
                ? '还没有标记高光的笔记'
                : '播放视频时，在下方输入内容添加笔记'
            }</p>
      </div>
    `;
        return;
    }

    dom.notesList.innerHTML = filtered.map((note) => `
    <div class="note-item ${note.isHighlight ? 'highlight' : ''}" id="note-${note.id}">
      <button class="note-timestamp" data-time="${note.timestamp}" title="跳转到 ${note.formattedTime}">
        ${note.formattedTime}
      </button>
      <div class="note-content" data-id="${note.id}">
        <span class="note-text">${escapeHtml(note.content)}</span>
      </div>
      <div class="note-actions">
        <button class="note-action-btn star-btn ${note.isHighlight ? 'active' : ''}"
                data-action="highlight" data-id="${note.id}" title="高光标记">
          ${note.isHighlight ? '★' : '☆'}
        </button>
        <button class="note-action-btn delete-btn"
                data-action="delete" data-id="${note.id}" title="删除">
          🗑
        </button>
      </div>
    </div>
  `).join('');

    // 绑定笔记事件
    dom.notesList.querySelectorAll('.note-timestamp').forEach((btn) => {
        btn.addEventListener('click', () => {
            seekToTimestamp(parseFloat(btn.dataset.time));
        });
    });

    dom.notesList.querySelectorAll('.note-action-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === 'highlight') toggleHighlight(id);
            if (action === 'delete') removeNote(id);
        });
    });

    // 双击编辑
    dom.notesList.querySelectorAll('.note-content').forEach((el) => {
        el.addEventListener('dblclick', () => {
            const id = el.dataset.id;
            const note = state.notes.find((n) => n.id === id);
            if (!note) return;

            const textEl = el.querySelector('.note-text');
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'note-edit-input';
            input.value = note.content;
            textEl.replaceWith(input);
            input.focus();
            input.select();

            const save = () => {
                const newContent = input.value.trim();
                if (newContent && newContent !== note.content) {
                    editNote(id, newContent);
                } else {
                    renderNotes();
                }
            };

            input.addEventListener('blur', save);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') renderNotes();
            });
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====== AI 总结 ======

async function runAiSummary(mode) {
    if (state.notes.length === 0) {
        showAiError('没有笔记可供分析');
        return;
    }

    dom.aiResult.classList.add('hidden');
    dom.aiError.classList.add('hidden');
    dom.aiLoading.classList.remove('hidden');

    try {
        const result = await generateSummary(state.notes, {
            mode,
            projectTitle: state.videoTitle,
            projectType: 'video',
        });

        dom.aiResult.innerHTML = renderMarkdown(result);
        dom.aiResult.classList.remove('hidden');
    } catch (err) {
        showAiError(err.message);
    } finally {
        dom.aiLoading.classList.add('hidden');
    }
}

function showAiError(message) {
    dom.aiError.textContent = `❌ ${message}`;
    dom.aiError.classList.remove('hidden');
}

function renderMarkdown(text) {
    // 简单的 Markdown 渲染
    return text
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^\- (.+)$/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
        .replace(/\n/g, '<br>');
}

// ====== 导出 ======

function exportMarkdown() {
    if (state.notes.length === 0) return;

    const highlightNotes = state.notes.filter((n) => n.isHighlight);
    let md = `# ${state.videoTitle || '视频笔记'}\n\n`;
    md += `> 导出时间：${new Date().toLocaleString('zh-CN')}\n\n`;

    if (highlightNotes.length > 0) {
        md += `## ⭐ 高光时刻\n\n`;
        highlightNotes.forEach((n) => {
            md += `- **[${n.formattedTime}]** ${n.content}\n`;
        });
        md += '\n';
    }

    md += `## 📝 全部笔记\n\n`;
    state.notes.forEach((n) => {
        const star = n.isHighlight ? ' ⭐' : '';
        md += `- **[${n.formattedTime}]** ${n.content}${star}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.videoTitle || 'vidnote'}-笔记.md`;
    a.click();
    URL.revokeObjectURL(url);
}

// ====== 设置 ======

async function loadApiKey() {
    const key = await getSetting('openai_api_key');
    if (key) {
        dom.apiKeyInput.value = key;
    }
}

function openSettings() {
    dom.settingsModal.classList.remove('hidden');
}

function closeSettings() {
    dom.settingsModal.classList.add('hidden');
}

async function saveSettings() {
    const key = dom.apiKeyInput.value.trim();
    await saveSetting('openai_api_key', key);
    closeSettings();
}

// ====== 启动 ======
init();
