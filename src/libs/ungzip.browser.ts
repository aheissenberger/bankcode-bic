import type { UnGzipFunction } from './ungzip'

export const ungzipBrowser: UnGzipFunction = async (res: Response) => {
  // Decompress the gzip stream
  if (!res.body) {
    throw new Error('Response body is null')
  }
  const decompressedStream = res.body.pipeThrough(
    new DecompressionStream('gzip'),
  )

  // Read the stream and collect all chunks
  const reader = decompressedStream.getReader()
  const chunks: Uint8Array[] = []
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }

  // Concatenate all chunks into a single buffer
  const totalLength = chunks.reduce((acc, cur) => acc + cur.length, 0)
  const buffer = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.length
  }

  // Detect UTF-16 BOM
  const encoding: 'utf-8' | 'utf-16le' | 'utf-16be' = 'utf-8'
  // Remove BOM if present
  const decodeBuffer = encoding === 'utf-8' ? buffer : buffer.subarray(2)

  const decoder = new TextDecoder(encoding)
  return decoder.decode(decodeBuffer)
}
