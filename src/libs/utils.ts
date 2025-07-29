export function isUtf16(buffer: Uint8Array): 'LE' | 'BE' | false {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return 'LE'
  if (buffer[0] === 0xfe && buffer[1] === 0xff) return 'BE'
  return false
}

export function getCSVStats(csvString: string): {
  rowCount: number
  columnCount: number
} {
  const lines = csvString.trim().split('\n')
  const rowCount = lines.length - 1 // Exclude header
  const columnCount = lines[0].split('\t').length
  return { rowCount, columnCount }
}
