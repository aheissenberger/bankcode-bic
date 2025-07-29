import { scrapeDownloadUrl } from '../libs/scrape-dowload-url'
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

export const getDownloadUrl: GetDownloadUrlFn = async (
  fetchFn = globalThis.fetch,
) => {
  return {
    ...(await scrapeDownloadUrl(
      'https://www.bundesbank.de/de/aufgaben/unbarer-zahlungsverkehr/serviceangebot/bankleitzahlen/download-bankleitzahlen-602592',
      // href="/resource/blob/926192/bdb8c7e624fa55dd552f73312f6a44db/472B63F073F071307366337C94F8C870/blz-aktuell-csv-data.csv"
      /href="(?<url>.*\/resource\/blob\/(?<version>\d+)\/.*\/blz-aktuell-csv-data.csv)"/,
      fetchFn,
    )),
    dataFormat: 'csv',
    notes: 'Deutsche Bundesbank Bankleitzahlendatei',
  }
}

export const downloadCSV: DownloadType = async (
  url: string,
  fetchFn = globalThis.fetch,
) => {
  const res = await fetchFn(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV from ${url}: ${res.statusText}`)
  }
  const buffer = await res.arrayBuffer()
  const decoder = new TextDecoder('iso-8859-1')
  const cvs = decoder.decode(new Uint8Array(buffer))
  return cvs
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
    'BIC',
    'Bezeichnung',
    'UNKNOWN',
    'PLZ',
    'Ort',
    'UNKNOWN',
    'UNKNOWN',
    'UNKNOWN',
    'UNKNOWN',
  ]

  const BICs = new Set<string>()

  const result: BankData[] = []
  for (const line_ of lines) {
    const line = line_.trim()
    if (line === '') continue // Skip empty lines
    const cols = line.split(';')
    for (let i = 0; i < cols.length; i++) {
      const val = cols[i]
      if (val.startsWith('"') && val.endsWith('"')) {
        cols[i] = val.slice(1, -1).replace(/""/g, '"')
      }
    }
    if (cols[colMap.get('Änderungskennzeichen') ?? -1] === 'D') continue // A = added, M = modified, D = deleted
    if (cols[colMap.get('Merkmal') ?? -1] !== '1') continue // Zahlungsdienstleister: 1 = Ja, 2 = Nein
    if (cols[colMap.get('BIC') ?? -1] === '') continue // Skip empty BICs
    if (BICs.has(cols[colMap.get('BIC') ?? -1])) continue // Skip duplicate BICs
    BICs.add(cols[colMap.get('BIC') ?? -1])
    const row = wantedCols.map((col) => cols[colMap.get(col) ?? -1]?.trim())
    result.push(row as BankData)
  }

  return result
}
