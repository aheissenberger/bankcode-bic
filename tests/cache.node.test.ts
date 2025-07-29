import * as path from 'node:path'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NodeCache } from '../src/libs/cache.node'

const realCacheDir = '/.cache'

describe('NodeCache advanced', () => {
  it('uses SHA256 hash for file naming', async () => {
    const fsMock = FAKE_FS()
    const cache = new NodeCache(realCacheDir, fsMock as any)
    await cache.set('special-key', 'value', 1000)
    const meta = JSON.parse(
      fsMock._files[
        Object.keys(fsMock._files).find((f) =>
          f.endsWith('nodecache-meta.json'),
        )!
      ],
    )
    const expectedFile = `${createHash('sha256').update('special-key').digest('hex')}.cache`
    expect(meta['special-key'].file).toBe(expectedFile)
    // Debug: log all file keys to see what is present
    // eslint-disable-next-line no-console
    console.log('FAKE_FS keys:', Object.keys(fsMock._files))
  })

  it('updates meta file with expiry and file mapping', async () => {
    const fsMock = FAKE_FS()
    const cache = new NodeCache(realCacheDir, fsMock as any)
    await cache.set('meta-key', 'meta-value', 500)
    const meta = JSON.parse(
      fsMock._files[
        Object.keys(fsMock._files).find((f) =>
          f.endsWith('nodecache-meta.json'),
        )!
      ],
    )
    expect(meta['meta-key'].expiry).toBeGreaterThan(Date.now())
    expect(meta['meta-key'].file).toMatch(/\.cache$/)
  })

  it('uses custom serialize/deserialize functions', async () => {
    const fsMock = FAKE_FS()
    const v8tools = {
      serialize: vi.fn((v) => Buffer.from(`SERIALIZED:${v}`)),
      deserialize: vi.fn((buf) => buf.toString().replace('SERIALIZED:', '')),
    }
    const cache = new NodeCache(realCacheDir, fsMock as any, v8tools)
    await cache.set('ser-key', 'ser-value', 1000)
    const val = await cache.get('ser-key')
    expect(v8tools.serialize).toHaveBeenCalledWith('ser-value')
    expect(v8tools.deserialize).toHaveBeenCalled()
    expect(val).toBe('ser-value')
  })
})
const FAKE_FS = () => {
  const files: Record<string, string> = {}
  return {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn((file: string) => {
      if (files[file] === undefined) throw new Error('File not found')
      return Promise.resolve(files[file])
    }),
    writeFile: vi.fn((file: string, data: string) => {
      files[file] = data
      return Promise.resolve()
    }),
    stat: vi.fn().mockResolvedValue(true),
    unlink: vi.fn((file: string) => {
      delete files[file]
      return Promise.resolve()
    }),
    _files: files,
  }
}

describe('NodeCache', () => {
  let fsMock: ReturnType<typeof FAKE_FS>
  let cache: NodeCache

  beforeEach(() => {
    fsMock = FAKE_FS()
    cache = new NodeCache(realCacheDir, fsMock as any)
  })

  it('sets and gets a cache entry', async () => {
    await cache.set('key1', 'value1', 1000)
    const val = await cache.get('key1')
    expect(val).toBe('value1')
  })

  it('returns null for expired entry', async () => {
    await cache.set('key2', 'value2', -1) // already expired
    const val = await cache.get('key2')
    expect(val).toBeNull()
  })

  it('returns null for missing entry', async () => {
    const val = await cache.get('missing')
    expect(val).toBeNull()
  })

  it('overwrites existing entry', async () => {
    await cache.set('key3', 'value3', 1000)
    await cache.set('key3', 'value4', 1000)
    const val = await cache.get('key3')
    expect(val).toBe('value4')
  })
})
describe('NodeCache.clear', () => {
  it('removes all cache files and meta file', async () => {
    const fsMock = FAKE_FS()
    // Simulate two cache entries and meta file
    const meta = {
      keyA: { file: 'fileA.cache', expiry: Date.now() + 1000 },
      keyB: { file: 'fileB.cache', expiry: Date.now() + 1000 },
    }
    fsMock._files[path.join(realCacheDir, 'nodecache-meta.json')] =
      JSON.stringify(meta)
    fsMock._files[path.join(realCacheDir, 'fileA.cache')] = 'A'
    fsMock._files[path.join(realCacheDir, 'fileB.cache')] = 'B'
    // Add stat and unlink mocks
    fsMock.stat = vi.fn().mockResolvedValue(true)
    fsMock.unlink = vi.fn((file) => {
      const match = Object.keys(fsMock._files).find((key) =>
        key.endsWith(path.basename(file)),
      )
      if (match) delete fsMock._files[match]
      return Promise.resolve()
    })
    const cache = new NodeCache(realCacheDir, fsMock as any)
    await cache.clear()
    // Cache files should be gone
    expect(
      fsMock._files[path.join(realCacheDir, 'fileA.cache')],
    ).toBeUndefined()
    expect(
      fsMock._files[path.join(realCacheDir, 'fileB.cache')],
    ).toBeUndefined()
    expect(
      fsMock._files[path.join(realCacheDir, 'nodecache-meta.json')],
    ).toBeUndefined()
  })

  it('does nothing if meta file does not exist', async () => {
    const fsMock = FAKE_FS()
    fsMock.stat = vi.fn().mockRejectedValue(new Error('not found'))
    fsMock.unlink = vi.fn()
    const cache = new NodeCache(realCacheDir, fsMock as any)
    await cache.clear()
    expect(fsMock.unlink).not.toHaveBeenCalled()
  })

  it('handles errors when deleting cache files gracefully', async () => {
    const fsMock = FAKE_FS()
    const meta = {
      keyA: { file: 'fileA.cache', expiry: Date.now() + 1000 },
      keyB: { file: 'fileB.cache', expiry: Date.now() + 1000 },
    }
    fsMock._files[path.join(realCacheDir, 'nodecache-meta.json')] =
      JSON.stringify(meta)
    fsMock._files[path.join(realCacheDir, 'fileA.cache')] = 'A'
    fsMock._files[path.join(realCacheDir, 'fileB.cache')] = 'B'
    fsMock.stat = vi.fn().mockResolvedValue(true)
    // Simulate error for fileB
    fsMock.unlink = vi.fn((file) => {
      if (file.endsWith('fileB.cache')) {
        // Simulate error for fileB, do not delete
        throw new Error('unlink failed')
      }
      const match = Object.keys(fsMock._files).find((key) =>
        key.endsWith(path.basename(file)),
      )
      if (match) delete fsMock._files[match]
      return Promise.resolve()
    })
    const cache = new NodeCache(realCacheDir, fsMock as any)
    await cache.clear()
    // fileA should be gone, fileB may remain due to error
    expect(
      fsMock._files[path.join(realCacheDir, 'fileA.cache')],
    ).toBeUndefined()
    expect(fsMock._files[path.join(realCacheDir, 'fileB.cache')]).toBeDefined()
    // fileB.cache may still exist due to error
    expect(fsMock.unlink).toHaveBeenCalledWith(
      path.join(realCacheDir, 'fileA.cache'),
    )
    expect(fsMock.unlink).toHaveBeenCalledWith(
      path.join(realCacheDir, 'fileB.cache'),
    )
    expect(fsMock.unlink).toHaveBeenCalledWith(
      path.join(realCacheDir, 'nodecache-meta.json'),
    )
  })
})
