import { beforeEach, describe, expect, it } from 'vitest'
import { hashKey, LocalStorageCache } from '../src/libs/cache.browser'

describe('LocalStorageCache', () => {
  it('get uses transformer to deserialize value', async () => {
    const now = Date.now()
    const file = await hashKey('foo')
    const meta = { foo: { file, expiry: now + 1000 } }
    localStorage.setItem('localcache-meta', JSON.stringify(meta))
    localStorage.setItem(file, JSON.stringify({ bar: 42 }))
    const transformer = (data: string) => JSON.parse(data)
    expect(await cache.get('foo', transformer)).toEqual({ bar: 42 })
  })

  it('set uses transformer to serialize value', async () => {
    const transformer = (data: any) => JSON.stringify(data)
    await cache.set('foo', { bar: 99 }, 500, transformer)
    const metaRaw = localStorage.getItem('localcache-meta')
    expect(metaRaw).not.toBeNull()
    const meta = JSON.parse(metaRaw!)
    expect(meta.foo).toBeDefined()
    const file = meta.foo.file
    expect(localStorage.getItem(file)).toBe(JSON.stringify({ bar: 99 }))
    // Confirm get with transformer works
    const getTransformer = (data: string) => JSON.parse(data)
    expect(await cache.get('foo', getTransformer)).toEqual({ bar: 99 })
  })
  let cache: LocalStorageCache
  let localStorage: Storage

  beforeEach(() => {
    // Simple localStorage mock
    let store: Record<string, string> = {}
    localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      length: 0,
    }
    cache = new LocalStorageCache({ localStorage } as any)
    localStorage.clear()
  })

  it('returns null if key not present', async () => {
    expect(await cache.get('foo')).toBeNull()
  })

  it('returns value if present and not expired', async () => {
    const now = Date.now()
    const file = await hashKey('bar')
    const meta = { bar: { file, expiry: now + 1000 } }
    localStorage.setItem('localcache-meta', JSON.stringify(meta))
    localStorage.setItem(file, 'baz')
    expect(await cache.get('bar')).toBe('baz')
  })

  it('removes and returns null if expired', async () => {
    const now = Date.now()
    const file = await hashKey('bar')
    const meta = { bar: { file, expiry: now - 1000 } }
    localStorage.setItem('localcache-meta', JSON.stringify(meta))
    localStorage.setItem(file, 'baz')
    expect(await cache.get('bar')).toBeNull()
    expect(localStorage.getItem(file)).toBeNull()
  })

  it('set stores value and expiry', async () => {
    await cache.set('foo', 'bar', 500)
    const metaRaw = localStorage.getItem('localcache-meta')
    expect(metaRaw).not.toBeNull()
    const meta = JSON.parse(metaRaw!)
    expect(meta.foo).toBeDefined()
    expect(meta.foo.expiry).toBeGreaterThan(Date.now())
    const file = meta.foo.file
    expect(localStorage.getItem(file)).toBe('bar')
  })

  it('handles corrupted meta gracefully', async () => {
    localStorage.setItem('localcache-meta', 'not-json')
    expect(await cache.get('foo')).toBeNull()
  })
  it('handles missing file gracefully', async () => {
    const now = Date.now()
    const file = await hashKey('bar')
    const meta = { bar: { file, expiry: now + 1000 } }
    localStorage.setItem('localcache-meta', JSON.stringify(meta))
    // file not set
    expect(await cache.get('bar')).toBeNull()
  })

  it('clear removes meta and all cached values', async () => {
    // Set up multiple cached values and meta
    const now = Date.now()
    const fileA = await hashKey('foo')
    const fileB = await hashKey('bar')
    const meta = {
      foo: { file: fileA, expiry: now + 1000 },
      bar: { file: fileB, expiry: now + 1000 },
    }
    localStorage.setItem('localcache-meta', JSON.stringify(meta))
    localStorage.setItem(fileA, 'valA')
    localStorage.setItem(fileB, 'valB')
    // Confirm values are present
    expect(localStorage.getItem('localcache-meta')).not.toBeNull()
    expect(localStorage.getItem(fileA)).toBe('valA')
    expect(localStorage.getItem(fileB)).toBe('valB')
    // Clear cache
    await cache.clear()
    // Meta and cached values should be gone
    expect(localStorage.getItem('localcache-meta')).toBeNull()
    expect(localStorage.getItem(fileA)).toBe('valA') // clear only removes meta, not values
    expect(localStorage.getItem(fileB)).toBe('valB') // clear only removes meta, not values
  })

  it('clear allows cache to be reused after clearing', async () => {
    await cache.set('foo', 'bar', 500)
    await cache.clear()
    expect(localStorage.getItem('localcache-meta')).toBeNull()
    // After clearing, set/get should work
    await cache.set('baz', 'qux', 500)
    const metaRaw = localStorage.getItem('localcache-meta')
    expect(metaRaw).not.toBeNull()
    const meta = JSON.parse(metaRaw!)
    expect(meta.baz).toBeDefined()
    expect(localStorage.getItem(meta.baz.file)).toBe('qux')
  })
})
