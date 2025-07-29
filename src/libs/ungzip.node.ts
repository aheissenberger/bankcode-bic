import { Buffer } from 'node:buffer'
import { gunzipSync } from 'node:zlib'
import { isUtf16 } from './utils'
import type { UnGzipFunction } from './ungzip'

export const ungzipNode: UnGzipFunction = async (res: Response) => {
  const buffer = Buffer.from(await res.arrayBuffer())
  // Use Node.js zlib to decompress gzip data
  return gunzipSync(buffer).toString(isUtf16(buffer) ? 'utf8' : 'utf16le')
}
