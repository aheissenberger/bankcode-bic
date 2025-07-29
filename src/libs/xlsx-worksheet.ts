import type { Unzipped } from 'fflate'

/**
 * Parses an Excel Worksheet XML string and returns the data of each row as an array of arrays.
 * Each inner array represents a row, with cell values as strings (empty string for missing cells).
 * No external dependencies are used.
 * @param xml - The worksheet XML string
 * @returns Array of rows, each row is an array of cell values
 */
export function xlsxWorksheetData(
  xml: string,
  sharedStrings?: Map<number, string>,
): string[][] {
  // Extract all <row>...</row> blocks
  const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g
  // Capture cell type (t="s" for shared string), robust to attribute order and whitespace
  const cellRegex =
    /<c\s+([^>]*?)r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g
  const vRegex = /<v>([\s\S]*?)<\/v>/
  const rows: string[][] = []
  let match: RegExpExecArray | null

  // Find all row blocks
  while ((match = rowRegex.exec(xml))) {
    const rowXml = match[1]
    // Find all cells in this row
    const cells: { col: number; value: string }[] = []
    let cellMatch: RegExpExecArray | null
    while ((cellMatch = cellRegex.exec(rowXml))) {
      // cellMatch[1]: attributes before r, cellMatch[2]: colRef, cellMatch[3]: attributes after r, cellMatch[4]: cell inner XML
      const attrs = (cellMatch[1] + ' ' + cellMatch[3]).trim()
      const colRef = cellMatch[2]
      // Find t="s" in attributes
      const tMatch = /t="([^"]+)"/.exec(attrs)
      const cellType = tMatch ? tMatch[1] : undefined
      // Convert column letters to zero-based index
      let colIdx = 0
      for (let i = 0; i < colRef.length; i++) {
        colIdx = colIdx * 26 + (colRef.charCodeAt(i) - 64)
      }
      colIdx -= 1
      // Extract value
      const vMatch = vRegex.exec(cellMatch[4])
      let value = vMatch ? vMatch[1] : ''
      if (cellType === 's' && value !== '' && sharedStrings) {
        const idx = Number.parseInt(value, 10)
        value = sharedStrings.get(idx) ?? ''
      }
      cells.push({ col: colIdx, value })
    }
    // Build row array, filling missing cells with ''
    const rowArr: string[] = []
    if (cells.length) {
      const maxCol = Math.max(...cells.map((c) => c.col))
      for (let i = 0; i <= maxCol; i++) rowArr[i] = ''
      for (const cell of cells) rowArr[cell.col] = cell.value
    }
    rows.push(rowArr)
  }
  return rows
}

export function xlsxWorksheetXML(
  zipEntries: Unzipped,
  sheetIndex: number,
): string {
  const sheetPath = `xl/worksheets/sheet${sheetIndex}.xml`

  if (!zipEntries[sheetPath]) {
    throw new Error(`Sheet1 not found in the XLSX file at path: ${sheetPath}`)
  }
  const sheet1Data = zipEntries[sheetPath]
  const xmlText = new TextDecoder('utf-8').decode(sheet1Data)
  return xmlText
}
export function xlsxSharedStrings(zipEntries: Unzipped) {
  const sharedStringsPath = `xl/sharedStrings.xml`

  if (!zipEntries[sharedStringsPath]) {
    throw new Error(
      `Shared strings not found in the XLSX file at path: ${sharedStringsPath}`,
    )
  }
  const sharedStringsData = zipEntries[sharedStringsPath]
  const xmlText = new TextDecoder('utf-8').decode(sharedStringsData)
  return parseSharedStringsXml(xmlText)
}

/**
 * Parses a sharedStrings.xml string from an Excel file and returns a Map of index to string value.
 * @param xml - The sharedStrings.xml content as a string
 * @returns Map<number, string> where key is the index and value is the shared string
 */
export function parseSharedStringsXml(xml: string): Map<number, string> {
  const map = new Map<number, string>()
  // Extract all <si>...</si> blocks
  const siRegex = /<si>([\s\S]*?)<\/si>/g
  let match: RegExpExecArray | null
  let idx = 0
  while ((match = siRegex.exec(xml))) {
    // Extract text from <t>...</t> (may be multiple <t> per <si> for rich text)
    const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g
    let tMatch: RegExpExecArray | null
    let value = ''
    while ((tMatch = tRegex.exec(match[1]))) {
      value += tMatch[1]
    }
    map.set(idx++, value)
  }
  return map
}
