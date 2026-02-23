/**
 * VidNote Extension — 存储服务
 * 使用 chrome.storage.local 存储数据
 * API 接口与 Web App 的 storage.js 保持一致
 */

const KEYS = {
    PROJECTS: 'vidnote_projects',
    NOTES: 'vidnote_notes',
    SETTINGS: 'vidnote_settings',
};

// ====== 内部工具 ======

async function getData(key) {
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
}

async function setData(key, value) {
    await chrome.storage.local.set({ [key]: value });
}

// ====== Project CRUD ======

export async function getAllProjects() {
    const projects = await getData(KEYS.PROJECTS);
    if (!projects) return [];
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id) {
    const projects = await getData(KEYS.PROJECTS);
    if (!projects) return null;
    return projects.find((p) => p.id === id) || null;
}

export async function saveProject(project) {
    const projects = (await getData(KEYS.PROJECTS)) || [];
    const index = projects.findIndex((p) => p.id === project.id);

    const updated = { ...project, updatedAt: Date.now() };

    if (index >= 0) {
        projects[index] = updated;
    } else {
        projects.push(updated);
    }

    await setData(KEYS.PROJECTS, projects);
}

export async function deleteProject(id) {
    let projects = (await getData(KEYS.PROJECTS)) || [];
    projects = projects.filter((p) => p.id !== id);
    await setData(KEYS.PROJECTS, projects);

    // 同时删除该项目的所有笔记
    let notes = (await getData(KEYS.NOTES)) || [];
    notes = notes.filter((n) => n.projectId !== id);
    await setData(KEYS.NOTES, notes);
}

// ====== Notes CRUD ======

export async function getNotesByProject(projectId) {
    const notes = (await getData(KEYS.NOTES)) || [];
    return notes
        .filter((n) => n.projectId === projectId)
        .sort((a, b) => a.timestamp - b.timestamp);
}

export async function saveNote(note) {
    const notes = (await getData(KEYS.NOTES)) || [];
    const index = notes.findIndex((n) => n.id === note.id);

    if (index >= 0) {
        notes[index] = note;
    } else {
        notes.push(note);
    }

    await setData(KEYS.NOTES, notes);
}

export async function deleteNote(id) {
    let notes = (await getData(KEYS.NOTES)) || [];
    notes = notes.filter((n) => n.id !== id);
    await setData(KEYS.NOTES, notes);
}

// ====== Settings ======

export async function getSetting(key) {
    const settings = (await getData(KEYS.SETTINGS)) || {};
    return settings[key] || null;
}

export async function saveSetting(key, value) {
    const settings = (await getData(KEYS.SETTINGS)) || {};
    settings[key] = value;
    await setData(KEYS.SETTINGS, settings);
}
