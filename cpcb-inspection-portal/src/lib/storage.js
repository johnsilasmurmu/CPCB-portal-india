/** Device-local persistence helpers (localStorage + IndexedDB) with an offline sync queue. */

const NS = 'cpcb.textile.v1'

export const KEYS = {
  drafts: `${NS}.drafts`,
  current: `${NS}.current`,
  officer: `${NS}.officer`,
  ocEmsVault: `${NS}.ocemsVault`,
  syncQueue: `${NS}.syncQueue`,
  lastSync: `${NS}.lastSync`,
  session: `${NS}.session`,
  seeded: `${NS}.seeded`,
}

export function storageAvailable() {
  try {
    const probe = `${NS}.probe`
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    if (error && error.name === 'QuotaExceededError') {
      window.dispatchEvent(new CustomEvent('cpcb:quota-exceeded'))
    }
    return false
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/* ---------------- Offline sync queue ---------------- */

export function enqueueSync(entry) {
  const queue = readJSON(KEYS.syncQueue, [])
  queue.push({ ...entry, queuedAt: new Date().toISOString() })
  writeJSON(KEYS.syncQueue, queue.slice(-200))
  return queue.length
}

export function queueSize() {
  return readJSON(KEYS.syncQueue, []).length
}

/**
 * Flush queued changes. There is no remote endpoint configured in this build,
 * so a flush checkpoints the queue locally and records the sync time; when a
 * server is configured, POST the entries here before clearing them.
 */
export async function flushSyncQueue() {
  const queue = readJSON(KEYS.syncQueue, [])
  if (!queue.length) return { flushed: 0, at: readJSON(KEYS.lastSync, null) }
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { flushed: 0, at: readJSON(KEYS.lastSync, null) }
  await new Promise((resolve) => setTimeout(resolve, 350))
  const at = new Date().toISOString()
  writeJSON(KEYS.syncQueue, [])
  writeJSON(KEYS.lastSync, at)
  return { flushed: queue.length, at }
}

/* ---------------- IndexedDB photo store ---------------- */

const DB_NAME = 'cpcb-textile-photos'
const STORE = 'photos'

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    const request = fn(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export const photoKey = (inspectionId, figId) => `${inspectionId}:${figId}`

export async function savePhoto(inspectionId, figId, dataUrl) {
  try {
    await withStore('readwrite', (store) => store.put(dataUrl, photoKey(inspectionId, figId)))
    return true
  } catch {
    return false
  }
}

export async function loadPhoto(inspectionId, figId) {
  try {
    return await withStore('readonly', (store) => store.get(photoKey(inspectionId, figId)))
  } catch {
    return null
  }
}

export async function deletePhoto(inspectionId, figId) {
  try {
    await withStore('readwrite', (store) => store.delete(photoKey(inspectionId, figId)))
    return true
  } catch {
    return false
  }
}

export async function photoKeysFor(inspectionId) {
  try {
    const keys = await withStore('readonly', (store) => store.getAllKeys())
    return keys.filter((k) => k.startsWith(`${inspectionId}:`))
  } catch {
    return []
  }
}
