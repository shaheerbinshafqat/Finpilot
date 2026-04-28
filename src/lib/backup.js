const BACKUP_CHECK_KEY = 'psx_last_backup';
const BACKUP_INTERVAL_DAYS = 7;

export function shouldPromptBackup() {
  const last = Number(localStorage.getItem(BACKUP_CHECK_KEY) || 0);
  const daysSince = (Date.now() - last) / 86400000;
  return daysSince >= BACKUP_INTERVAL_DAYS;
}

export function markBackupDone() {
  localStorage.setItem(BACKUP_CHECK_KEY, String(Date.now()));
}

export function downloadBackup(state, label = 'manual') {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `psx-backup-${label}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  markBackupDone();
}

// File System Access API — let user pick a folder, save directly
let folderHandle = null;

export async function pickBackupFolder() {
  if (!window.showDirectoryPicker) {
    throw new Error('Your browser does not support folder access. Use Chrome/Edge.');
  }
  folderHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
  // Persist the handle using IndexedDB
  await storeFolderHandle(folderHandle);
  return folderHandle.name;
}

export async function autoSaveToFolder(state) {
  const handle = folderHandle || await loadFolderHandle();
  if (!handle) return false;
  const perm = await handle.queryPermission({ mode: 'readwrite' });
  if (perm !== 'granted') {
    const req = await handle.requestPermission({ mode: 'readwrite' });
    if (req !== 'granted') return false;
  }
  const filename = `psx-auto-${new Date().toISOString().slice(0, 10)}.json`;
  const file = await handle.getFileHandle(filename, { create: true });
  const writable = await file.createWritable();
  await writable.write(JSON.stringify(state, null, 2));
  await writable.close();
  markBackupDone();
  return true;
}

// IndexedDB wrapper for folder handle persistence
async function storeFolderHandle(handle) {
  const db = await openDB();
  const tx = db.transaction('handles', 'readwrite');
  await tx.objectStore('handles').put(handle, 'backupFolder');
  await tx.done;
}

async function loadFolderHandle() {
  try {
    const db = await openDB();
    const tx = db.transaction('handles', 'readonly');
    return await tx.objectStore('handles').get('backupFolder');
  } catch { return null; }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('psx_backup', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => {
      const db = req.result;
      // Wrap with promise-friendly `.done`
      const origTx = db.transaction.bind(db);
      db.transaction = (...args) => {
        const tx = origTx(...args);
        tx.done = new Promise((res, rej) => {
          tx.oncomplete = res; tx.onerror = () => rej(tx.error);
        });
        tx.objectStore = (name) => {
          const store = Object.getPrototypeOf(tx).objectStore.call(tx, name);
          ['get', 'put', 'delete'].forEach(m => {
            const orig = store[m].bind(store);
            store[m] = (...a) => new Promise((r, e) => {
              const req = orig(...a);
              req.onsuccess = () => r(req.result);
              req.onerror = () => e(req.error);
            });
          });
          return store;
        };
        return tx;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
}