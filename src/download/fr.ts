import { scrapeDownloadUrl } from '../libs/scrape-dowload-url'
import { ungzip } from '../libs/ungzip'
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
      'https://www.ecb.europa.eu/stats/financial_corporations/list_of_financial_institutions/html/monthly_list-MID.en.html',
      // href="/stats/money/mfi/general/html/dla/mfi_mrr_MID/fi_mrr_csv_250630.csv.gz""
      /href="(?<url>.+\/fi_mrr_csv_(?<version>\d{6})\.csv\.gz)"/,
      fetchFn,
    )),
    dataFormat: 'csv',
    notes: 'European Central Bank Financial Institutions',
  }
}

export const downloadCSV: DownloadType = async (
  url: string,
  fetchFn = globalThis.fetch,
  ungzipFn = ungzip,
) => {
  const res = await fetchFn(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV from ${url}: ${res.statusText}`)
  }
  // Check if response is gzipped
  const contentEncoding = res.headers?.get?.('content-encoding')
  const contentType = res.headers?.get?.('content-type')
  if (
    contentEncoding === 'gzip' ||
    url.endsWith('.gz') ||
    contentType?.includes('gzip')
  ) {
    return await ungzipFn(res)
  } else {
    return await res.text()
  }
}

export const parseCSV: ParseCSVType = (cvs, countryCode: string) => {
  const separator = '\t'
  const lines = cvs.split(/\r?\n/)
  const header = lines[0].split(separator)
  const colMap: Map<string, number> = new Map()
  header.forEach((col, idx) => {
    colMap.set(col.trim(), idx)
  })
  lines.shift() // Remove header line

  const wantedCols = [
    'RIAD_CODE',
    'BIC',
    'NAME',
    'ADDRESS',
    'POSTAL',
    'CITY',
    'UNKNOWN',
    'UNKNOWN',
    'UNKNOWN',
    'UNKNOWN',
  ]

  const BICs = new Set<string>()
  const filterCountry = countryCode.toUpperCase();

  const result: BankData[] = []
  for (const line_ of lines) {
    const line = line_.trim()
    if (line === '') continue // Skip empty lines
    const cols = line.split(separator)
    if (cols[colMap.get('COUNTRY_OF_REGISTRATION') ?? -1] !== filterCountry) continue // Skip non-French RIAD_CODEs
    if (cols[colMap.get('BIC') ?? -1] === '') continue // Skip empty BICs
    if (BICs.has(cols[colMap.get('BIC') ?? -1])) continue // Skip duplicate BICs
    BICs.add(cols[colMap.get('BIC') ?? -1])
    const row = wantedCols.map((col) => cols[colMap.get(col) ?? -1]?.trim())
    row[0] = row[0].slice(2)
    result.push(row as BankData)
  }

  return result
}
