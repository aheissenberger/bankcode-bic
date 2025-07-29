import type { CacheType } from './cache'
type CacheMeta = { file: string; expiry: number }
type MetaMap = Record<string, CacheMeta>

const META_KEY = 'localcache-meta'

function getMeta(localStorage: Storage): MetaMap {
  const raw = localStorage.getItem(META_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function setMeta(meta: MetaMap, localStorage: Storage) {
  localStorage.setItem(META_KEY, JSON.stringify(meta))
}

function clearMeta(localStorage: Storage) {
  localStorage.removeItem(META_KEY)
}

export async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await (globalThis.crypto?.subtle?.digest(
    'SHA-256',
    data,
  ) ?? Promise.resolve(new ArrayBuffer(0)))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `cache_${hashHex}`
}

export class LocalStorageCache implements CacheType {
  private localStorage: Storage

  constructor(win?: { localStorage: Storage }) {
    this.localStorage = win?.localStorage ?? globalThis.localStorage
  }

  async get(key: string, transformer?: (data: any) => any): Promise<any | null> {
    const meta = getMeta(this.localStorage)
    const entry = meta[key]
    if (!entry) return null
    if (Date.now() > entry.expiry) {
      delete meta[key]
      setMeta(meta, this.localStorage)
      this.localStorage.removeItem(entry.file)
      return null
    }
    // Defensive: if meta is corrupted, recompute file
    const file = entry.file ?? (await hashKey(key))
    const value = this.localStorage.getItem(file)
    if (value === null) return null
    return transformer ? transformer(value) : value
  }

  async set(key: string, value: any, ttlMs: number, transformer?: (data: any) => any): Promise<void> {
    const meta = getMeta(this.localStorage)
    const file = await hashKey(key)
    this.localStorage.setItem(file, transformer ? transformer(value) : value)
    meta[key] = { file, expiry: Date.now() + ttlMs }
    setMeta(meta, this.localStorage)
  }

  async clear(): Promise<void> {
    await clearMeta(this.localStorage)
  }
}
