import type { Unzipped } from 'fflate/node'
import { scrapeDownloadUrl } from '../libs/scrape-dowload-url'
import { xlsxUnzip } from '../libs/xlsx-unzip'
import { xlsxSharedStrings, xlsxWorksheetData, xlsxWorksheetXML } from '../libs/xlsx-worksheet'
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
      'https://www.nbb.be/en/activities/payments-and-securities/payment-standards/bank-identification-codes',
      // href="/sites/default/files/2025-07/r_fulllist_of_codes_current_1.xlsx"
      /href="(?<url>.*\/sites\/default\/files\/(?<version>\d{4}-\d{2})\/r_fulllist_of_codes_current_\d\.xlsx)"/,
      fetchFn,
    )),
    dataFormat: 'xlsx',
    notes: 'National Bank of Belgium Bank Identification Codes',
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
  const xlsContent = await xlsxUnzip(buffer)
  return xlsContent
}

export const parseCSV: ParseCSVType = (xlsContent: Unzipped) => {
  const sharedStrings = xlsxSharedStrings(xlsContent)
  const worksheetXML = xlsxWorksheetXML(xlsContent, 1) // Assuming we want the first worksheet

  const lines = xlsxWorksheetData(worksheetXML, sharedStrings)
  //const version = lines[0][0]?.split(' ')?.[1] ?? lines[0][0] // Assuming the first cell contains the version e.g "Version 15/07/2025"
  while (lines[0][0] !== 'T_Identification_Number') {
    lines.shift() // Skip header rows until we find the one with 'T_Identification_Number'
  }
  const header = lines[0]
  const colMap: Map<string, number> = new Map()
  header.forEach((col, idx) => {
    colMap.set(col.trim(), idx)
  })
  lines.shift() // Remove header line

  const BICs = new Set<string>()
  const removedBICs = new Set<string>([
    'VRIJ',
    'VRIJ-LIBRE',
    'NAV',
    'NAP',
    'NYA',
    '-',
  ])

  const result: BankData[] = []
  for (const line of lines) {
    const bic =
      line[colMap.get('Biccode') ?? -1]?.replaceAll(' ', '')?.toUpperCase() ??
      ''
    if (bic === '') continue // Skip if BIC is not defined
    if (removedBICs.has(bic) || BICs.has(bic)) continue // Skip duplicate BICs
    BICs.add(bic)
    const bankCode =
      line[colMap.get('T_Identification_Number') ?? -1]?.trim() ?? ''
    if (bankCode === '') continue // Skip empty bank codes
    let name = line[colMap.get('T_Institutions_English') ?? -1]?.trim() ?? ''
    if (name === '')
      name = line[colMap.get('T_Institutions_Dutch') ?? -1]?.trim() ?? ''
    if (name === '')
      name = line[colMap.get('T_Institutions_French') ?? -1]?.trim() ?? ''

    const row = Array.from({ length: 10 }).fill('')
    row[0] = bankCode
    row[1] = bic
    row[2] = name
    result.push(row as BankData)
  }

  return result
}
