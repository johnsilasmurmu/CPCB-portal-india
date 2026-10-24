/**
 * Officer credential hashing (PBKDF2-SHA-256) and AES-GCM encryption for
 * sensitive fields such as OCEMS portal credentials.
 */

const enc = new TextEncoder()
const dec = new TextDecoder()

const ITERATIONS = 150000

const toB64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

const fromB64 = (value) => {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function randomSalt() {
  return toB64(crypto.getRandomValues(new Uint8Array(16)))
}

async function baseKey(password) {
  return crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey'])
}

/** Derives an AES-GCM key from the officer password. Kept in memory only. */
export async function deriveKey(password, saltB64) {
  const key = await baseKey(password)
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(saltB64), iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** Password verifier: PBKDF2-derived bits, stored instead of the password. */
export async function hashPassword(password, saltB64) {
  const key = await baseKey(password)
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromB64(saltB64), iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  )
  return toB64(bits)
}

export async function verifyPassword(password, saltB64, verifier) {
  const candidate = await hashPassword(password, saltB64)
  if (candidate.length !== verifier.length) return false
  let mismatch = 0
  for (let i = 0; i < candidate.length; i += 1) mismatch |= candidate.charCodeAt(i) ^ verifier.charCodeAt(i)
  return mismatch === 0
}

export async function encryptJSON(key, payload) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = enc.encode(JSON.stringify(payload))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
  return { iv: toB64(iv), cipher: toB64(cipher), at: new Date().toISOString() }
}

export async function decryptJSON(key, sealed) {
  if (!sealed?.iv || !sealed?.cipher) return null
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(sealed.iv) },
      key,
      fromB64(sealed.cipher),
    )
    return JSON.parse(dec.decode(plain))
  } catch {
    return null
  }
}

/** Compresses a captured image for storage and report embedding. */
export function compressImage(file, maxSize = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the selected image'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Unsupported image file'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', quality),
          width: canvas.width,
          height: canvas.height,
        })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
