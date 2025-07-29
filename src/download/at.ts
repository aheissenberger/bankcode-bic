import type {
  BankData,
  DownloadType,
  GetCacheKeyFn,
  GetDownloadUrlFn,
  ParseCSVType,
} from './download'

export const getCacheKey: GetCacheKeyFn = (country: string): string => {
  return `bankcode-bic-${country}`
}

export const getDownloadUrl: GetDownloadUrlFn = async () => {
  return {
    websiteUrl:
      'https://www.oenb.at/Statistik/Klassifikationen/Bankstellenverzeichnis.html',
    url: 'https://www.oenb.at/docroot/downloads_observ/sepa-zv-vz_gesamt.csv',
    dataFormat: 'csv',
    version: '',
    notes: 'Österreichische Nationalbank Bankstellenverzeichnis',
  }
}
export const downloadCSV: DownloadType = async (
  url: string,
  fetchFn = globalThis.fetch,
) => {
  const res = await fetchFn(url)
  const buffer = await res.arrayBuffer()
  const decoder = new TextDecoder('iso-8859-1')
  const cvs = decoder.decode(new Uint8Array(buffer))
  const csvStart = cvs.indexOf('Kennzeichen;')
  if (csvStart === -1) {
    throw new Error('CSV header not found')
  }
  return cvs.slice(csvStart)
}

export const parseCSV: ParseCSVType = (cvs) => {
  const lines = cvs.split(/\r?\n/)
  const header = lines[0].split(';')
  const colMap: Map<string, number> = new Map()
  header.forEach((col, idx) => {
    colMap.set(col.trim(), idx)
  })
  lines.shift() // Remove header line

  const wantedCols = [
    'Bankleitzahl',
    'SWIFT-Code',
    'Bankenname',
    'Straße',
    'PLZ',
    'Ort',
    'Telefon',
    'Fax',
    'E-Mail',
    'Homepage',
  ]

  const allowedSectors = new Set([
    'Raiffeisen',
    'Aktienbanken',
    '§ 9 Institute',
    'Sparkassen',
    'Volksbanken',
  ])

  const result: BankData[] = []
  for (const line_ of lines) {
    const line = line_.trim()
    if (line === '') continue // Skip empty lines
    const cols = line.split(';')
    if (!allowedSectors.has(cols[colMap.get('Sektor') ?? -1])) continue // Skip if unwanted sectors
    const row = wantedCols.map((col) => cols[colMap.get(col) ?? -1]?.trim())
    result.push(row as BankData)
  }

  return result
}
