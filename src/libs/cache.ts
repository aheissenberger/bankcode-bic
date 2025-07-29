import { LocalStorageCache } from './cache.browser'
import { NodeCache } from './cache.node'
export interface CacheType {
  get: (key: string, transformer?: (value: any) => any) => Promise<any | null>
  set: (
    key: string,
    value: any,
    ttlMs: number,
    transformer?: (value: any) => any,
  ) => Promise<void>
  clear: () => Promise<void>
}
export const Cache = 'window' in globalThis ? LocalStorageCache : NodeCache
