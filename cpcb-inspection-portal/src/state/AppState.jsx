import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { blankInspection, DEMO_INSPECTION } from '../lib/defaults'
import {
  KEYS,
  enqueueSync,
  flushSyncQueue,
  loadPhoto,
  queueSize,
  readJSON,
  removeKey,
  savePhoto,
  deletePhoto,
  storageAvailable,
  writeJSON,
} from '../lib/storage'
import { decryptJSON, deriveKey, encryptJSON, hashPassword, randomSalt, verifyPassword } from '../lib/crypto'

const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

export function AppProvider({ children }) {
  const storageOk = useMemo(() => storageAvailable(), [])
  const [officer, setOfficer] = useState(() => readJSON(KEYS.officer, null))
  const [session, setSession] = useState(() => readJSON(KEYS.session, null))
  const [vaultKey, setVaultKey] = useState(null)
  const [inspections, setInspections] = useState(() => readJSON(KEYS.drafts, {}))
  const [currentId, setCurrentId] = useState(() => readJSON(KEYS.current, null))
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [pending, setPending] = useState(() => queueSize())
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState(null)
  const [quotaWarning, setQuotaWarning] = useState(false)
  const toastTimer = useRef(null)
  const saveTimer = useRef(null)
  const firstRender = useRef(true)

  /* ---------------- toasts ---------------- */

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone, id: Date.now() })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  /* ---------------- seeding ---------------- */

  useEffect(() => {
    if (!storageOk) return
    if (Object.keys(inspections).length === 0 && !readJSON(KEYS.seeded, false)) {
      const demo = DEMO_INSPECTION()
      const seeded = { [demo.id]: demo }
      setInspections(seeded)
      setCurrentId(demo.id)
      writeJSON(KEYS.drafts, seeded)
      writeJSON(KEYS.current, demo.id)
      writeJSON(KEYS.seeded, true)
    }
    // Only ever run on mount – later edits must not be overwritten by seeding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageOk])

  /* ---------------- connectivity & sync ---------------- */

  const runSync = useCallback(
    async (silent = false) => {
      setSyncing(true)
      const result = await flushSyncQueue()
      setPending(queueSize())
      setSyncing(false)
      if (result.flushed && !silent) showToast(`Synced ${result.flushed} local change${result.flushed > 1 ? 's' : ''}`)
      return result
    },
    [showToast],
  )

  /* ---------------- persistence / autosave ---------------- */

  const persistNow = useCallback(
    (nextInspections, nextId) => {
      if (!storageOk) return false
      const saved = writeJSON(KEYS.drafts, nextInspections)
      writeJSON(KEYS.current, nextId)
      enqueueSync({ inspectionId: nextId, at: new Date().toISOString() })
      setPending(queueSize())
      if (saved) setLastSavedAt(new Date().toISOString())
      return saved
    },
    [storageOk],
  )

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (!storageOk) return
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      persistNow(inspections, currentId)
      if (typeof navigator === 'undefined' || navigator.onLine) runSync(true)
    }, 700)
    return () => window.clearTimeout(saveTimer.current)
  }, [inspections, currentId, persistNow, runSync, storageOk])

  const saveNow = useCallback(() => {
    window.clearTimeout(saveTimer.current)
    const ok = persistNow(inspections, currentId)
    showToast(ok ? 'Draft saved on this device' : 'Could not save – device storage is full', ok ? 'success' : 'error')
    if (ok && (typeof navigator === 'undefined' || navigator.onLine)) runSync(true)
    return ok
  }, [inspections, currentId, persistNow, runSync, showToast])

  useEffect(() => {
    const onQuota = () => setQuotaWarning(true)
    window.addEventListener('cpcb:quota-exceeded', onQuota)
    return () => window.removeEventListener('cpcb:quota-exceeded', onQuota)
  }, [])

  useEffect(() => {
    const goOnline = () => {
      setOnline(true)
      runSync()
    }
    const goOffline = () => {
      setOnline(false)
      showToast('You are offline – work is saved on this device', 'offline')
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [runSync, showToast])

  /* ---------------- officer authentication ---------------- */

  const register = useCallback(
    async ({ name, email, designation, password }) => {
      if (!name?.trim() || !email?.trim()) throw new Error('Name and official email are required')
      if (!password || password.length < 8) throw new Error('Password must be at least 8 characters')
      const salt = randomSalt()
      const verifier = await hashPassword(password, salt)
      const record = { name: name.trim(), email: email.trim().toLowerCase(), designation: designation?.trim() || 'Inspection Officer', salt, verifier, createdAt: new Date().toISOString() }
      setOfficer(record)
      writeJSON(KEYS.officer, record)
      const key = await deriveKey(password, salt)
      setVaultKey(key)
      const nextSession = { email: record.email, since: new Date().toISOString() }
      setSession(nextSession)
      writeJSON(KEYS.session, nextSession)
      return record
    },
    [],
  )

  const login = useCallback(
    async (email, password) => {
      const record = readJSON(KEYS.officer, null)
      if (!record) throw new Error('No officer account on this device. Register first.')
      if (record.email !== email.trim().toLowerCase()) throw new Error('Email does not match the officer registered on this device')
      const ok = await verifyPassword(password, record.salt, record.verifier)
      if (!ok) throw new Error('Incorrect password')
      const key = await deriveKey(password, record.salt)
      setVaultKey(key)
      setOfficer(record)
      const nextSession = { email: record.email, since: new Date().toISOString() }
      setSession(nextSession)
      writeJSON(KEYS.session, nextSession)
      return record
    },
    [],
  )

  /** Used after a page refresh: re-derive the vault key from the password. */
  const unlockVault = useCallback(async (password) => {
    const record = readJSON(KEYS.officer, null)
    if (!record) throw new Error('No officer account on this device')
    const ok = await verifyPassword(password, record.salt, record.verifier)
    if (!ok) throw new Error('Incorrect password')
    const key = await deriveKey(password, record.salt)
    setVaultKey(key)
    return true
  }, [])

  const logout = useCallback(() => {
    window.clearTimeout(saveTimer.current)
    setSession(null)
    setVaultKey(null)
    removeKey(KEYS.session)
  }, [])

  /* ---------------- encrypted OCEMS vault ---------------- */

  const sealVault = useCallback(
    async (inspectionId, payload) => {
      if (!vaultKey) throw new Error('Vault locked – re-enter your password to save credentials')
      const sealed = await encryptJSON(vaultKey, payload)
      const all = readJSON(KEYS.ocEmsVault, {})
      all[inspectionId] = sealed
      writeJSON(KEYS.ocEmsVault, all)
      return sealed.at
    },
    [vaultKey],
  )

  const openVault = useCallback(
    async (inspectionId) => {
      if (!vaultKey) return null
      const sealed = readJSON(KEYS.ocEmsVault, {})[inspectionId]
      if (!sealed) return null
      return decryptJSON(vaultKey, sealed)
    },
    [vaultKey],
  )

  /* ---------------- inspections ---------------- */

  const current = currentId ? inspections[currentId] : null

  const startInspection = useCallback(() => {
    const draft = blankInspection(officer?.email || '')
    setInspections((prev) => {
      const next = { ...prev, [draft.id]: draft }
      writeJSON(KEYS.drafts, next)
      return next
    })
    setCurrentId(draft.id)
    writeJSON(KEYS.current, draft.id)
    return draft
  }, [officer])

  const openInspection = useCallback((id) => {
    setCurrentId(id)
    writeJSON(KEYS.current, id)
    return id
  }, [])

  const deleteInspection = useCallback(
    async (id) => {
      setInspections((prev) => {
        const next = { ...prev }
        delete next[id]
        writeJSON(KEYS.drafts, next)
        return next
      })
      if (currentId === id) {
        setCurrentId(null)
        removeKey(KEYS.current)
      }
      const photos = ['fig1', 'fig2', 'fig3', 'fig4', 'fig5', 'fig6', 'fig7', 'fig8', 'fig9', 'fig10', 'fig11', 'fig12', 'fig13']
      await Promise.all(photos.map((fig) => deletePhoto(id, fig)))
      showToast('Inspection deleted from this device')
    },
    [currentId, showToast],
  )

  const updateSection = useCallback((section, patch) => {
    setInspections((prev) => {
      if (!prev || !currentId || !prev[currentId]) return prev
      const target = prev[currentId]
      const currentSection = target.data[section] || {}
      const nextSection = typeof patch === 'function' ? patch(currentSection) : { ...currentSection, ...patch }
      return {
        ...prev,
        [currentId]: {
          ...target,
          updatedAt: new Date().toISOString(),
          data: { ...target.data, [section]: nextSection },
        },
      }
    })
  }, [currentId])

  const setInspectionMeta = useCallback((patch) => {
    setInspections((prev) => {
      if (!currentId || !prev[currentId]) return prev
      return { ...prev, [currentId]: { ...prev[currentId], ...patch, updatedAt: new Date().toISOString() } }
    })
  }, [currentId])

  const savePhotoForCurrent = useCallback(
    async (figId, dataUrl) => {
      if (!currentId) return false
      return savePhoto(currentId, figId, dataUrl)
    },
    [currentId],
  )

  const loadPhotoForCurrent = useCallback(
    async (figId) => (currentId ? loadPhoto(currentId, figId) : null),
    [currentId],
  )

  const removePhotoForCurrent = useCallback(
    async (figId) => (currentId ? deletePhoto(currentId, figId) : false),
    [currentId],
  )

  const drafts = useMemo(
    () =>
      Object.values(inspections).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [inspections],
  )

  const searchedDrafts = useCallback(
    (query) => {
      const q = (query || '').trim().toLowerCase()
      if (!q) return drafts
      return drafts.filter((item) => {
        const g = item.data?.general || {}
        return [g.unitCode, g.unitName, g.unitAddress, g.state, g.contactName]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q))
      })
    },
    [drafts],
  )

  const value = {
    storageOk,
    officer,
    session,
    authenticated: Boolean(session && officer),
    vaultUnlocked: Boolean(vaultKey),
    register,
    login,
    unlockVault,
    logout,
    sealVault,
    openVault,
    inspections,
    drafts,
    searchedDrafts,
    current,
    currentId,
    startInspection,
    openInspection,
    deleteInspection,
    updateSection,
    setInspectionMeta,
    saveNow,
    lastSavedAt,
    online,
    pending,
    syncing,
    runSync,
    toast,
    showToast,
    quotaWarning,
    savePhotoForCurrent,
    loadPhotoForCurrent,
    removePhotoForCurrent,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
