import { openDB } from 'idb';

const DB_NAME = 'vidnote-db';
const DB_VERSION = 1;

const STORES = {
    PROJECTS: 'projects',
    NOTES: 'notes',
    SETTINGS: 'settings',
};

async function getDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Projects store
            if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
                const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
                projectStore.createIndex('updatedAt', 'updatedAt');
            }
            // Notes store
            if (!db.objectStoreNames.contains(STORES.NOTES)) {
                const noteStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
                noteStore.createIndex('projectId', 'projectId');
                noteStore.createIndex('timestamp', 'timestamp');
            }
            // Settings store
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }
        },
    });
}

// ====== Project CRUD ======

export async function getAllProjects() {
    const db = await getDB();
    const projects = await db.getAll(STORES.PROJECTS);
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id) {
    const db = await getDB();
    return db.get(STORES.PROJECTS, id);
}

export async function saveProject(project) {
    const db = await getDB();
    await db.put(STORES.PROJECTS, {
        ...project,
        updatedAt: Date.now(),
    });
}

export async function deleteProject(id) {
    const db = await getDB();
    // Delete project
    await db.delete(STORES.PROJECTS, id);
    // Delete all notes of this project
    const tx = db.transaction(STORES.NOTES, 'readwrite');
    const index = tx.store.index('projectId');
    let cursor = await index.openCursor(id);
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
}

// ====== Notes CRUD ======

export async function getNotesByProject(projectId) {
    const db = await getDB();
    const tx = db.transaction(STORES.NOTES, 'readonly');
    const index = tx.store.index('projectId');
    const notes = await index.getAll(projectId);
    return notes.sort((a, b) => a.timestamp - b.timestamp);
}

export async function saveNote(note) {
    const db = await getDB();
    await db.put(STORES.NOTES, note);
}

export async function deleteNote(id) {
    const db = await getDB();
    await db.delete(STORES.NOTES, id);
}

// ====== Settings ======

export async function getSetting(key) {
    const db = await getDB();
    const result = await db.get(STORES.SETTINGS, key);
    return result ? result.value : null;
}

export async function saveSetting(key, value) {
    const db = await getDB();
    await db.put(STORES.SETTINGS, { key, value });
}
