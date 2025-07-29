import { unzipSync } from 'fflate'
export function xlsxUnzip(xlsx: ArrayBuffer | Uint8Array) {
  const zip = unzipSync(new Uint8Array(xlsx))
  return zip
}
