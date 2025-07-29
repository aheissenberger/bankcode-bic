import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { deserialize, serialize } from 'node:v8'
import type { CacheType } from './cache'
import type { Buffer } from 'node:buffer'

async function ensureCacheDir(cacheDir: string, fsFn: typeof fs) {
  await fsFn.mkdir(cacheDir, { recursive: true })
}

type CacheMeta = { file: string; expiry: number }

const metaFile = (cacheDir: string) => join(cacheDir, 'nodecache-meta.json')

async function readMeta(
  cacheDir: string,
  fsFn: typeof fs,
): Promise<Record<string, CacheMeta>> {
  try {
    await ensureCacheDir(cacheDir, fsFn)
    const data = await fsFn.readFile(metaFile(cacheDir), 'utf8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

async function writeMeta(
  meta: Record<string, CacheMeta>,
  cacheDir: string,
  fsFn: typeof fs,
) {
  await ensureCacheDir(cacheDir, fsFn)
  await fsFn.writeFile(metaFile(cacheDir), JSON.stringify(meta), 'utf8')
}

async function readCacheValue(
  file: string,
  cacheDir: string,
  fsFn: typeof fs,
  deserializeFn: (buffer: Buffer) => string,
): Promise<string | null> {
  try {
    return deserializeFn(await fsFn.readFile(join(cacheDir, file)))
  } catch {
    return null
  }
}

async function writeCacheValue(
  file: string,
  value: any,
  cacheDir: string,
  fsFn: typeof fs,
  serializeFn: (value: any) => Buffer,
) {
  await ensureCacheDir(cacheDir, fsFn)
  await fsFn.writeFile(join(cacheDir, file), serializeFn(value))
}

export class NodeCache implements CacheType {
  private cacheDir: string
  private fs: typeof fs
  private serialize: typeof serialize
  private deserialize: typeof deserialize
  constructor(
    cacheDir?: string,
    fsFn = fs,
    v8toolsFn = { serialize, deserialize },
  ) {
    this.cacheDir =
      cacheDir ||
      process.env.CACHE_DIR ||
      (join(process.cwd(), '.cache') as string)
    this.get = this.get.bind(this)
    this.set = this.set.bind(this)
    this.fs = fsFn
    this.serialize = v8toolsFn.serialize
    this.deserialize = v8toolsFn.deserialize
  }
  get: (
    key: string,
    transformer?: (value: any) => any,
  ) => Promise<string | null> = async (key, transformer) => {
    const meta = await readMeta(this.cacheDir, this.fs)
    const entry = meta[key]
    if (!entry) return null
    if (Date.now() > entry.expiry) {
      delete meta[key]
      await writeMeta(meta, this.cacheDir, this.fs)
      return null
    }
    const value = await readCacheValue(
      entry.file,
      this.cacheDir,
      this.fs,
      this.deserialize,
    )
    if (!value) return null
    return transformer ? transformer(value) : value
  }

  set: (
    key: string,
    value: string,
    ttlMs: number,
    transformer?: (value: any) => any,
  ) => Promise<void> = async (key, value, ttlMs, transformer) => {
    const meta = await readMeta(this.cacheDir, this.fs)
    // Use SHA-256 hash for file name
    const file = `${createHash('sha256').update(key).digest('hex')}.cache`
    const transformedValue = transformer ? transformer(value) : value
    await writeCacheValue(
      file,
      transformedValue,
      this.cacheDir,
      this.fs,
      this.serialize,
    )
    meta[key] = { file, expiry: Date.now() + ttlMs }
    await writeMeta(meta, this.cacheDir, this.fs)
  }
  clear: () => Promise<void> = async () => {
    try {
      await this.fs.stat(metaFile(this.cacheDir))
    } catch {
      return
    }
    const meta = await readMeta(this.cacheDir, this.fs)
    for (const { file } of Object.values(meta)) {
      try {
        await this.fs.unlink(join(this.cacheDir, file))
      } catch { }
    }
    await this.fs.unlink(metaFile(this.cacheDir))
  }
}
