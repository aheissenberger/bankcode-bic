import fs from 'node:fs'
import { join } from 'node:path'

import {
  fieldNames as allFieldNames,
  getField,
  type ScrapeDownloadUrlResult,
} from '../download/download'
import { Cache } from '../libs/cache'
import { packData } from '../libs/pack-data'

export type ExportFormatType = 'json' | 'js' | 'ts'

type GenerateOptions = {
  filterCountries?: string[]
  fieldNames?: string[]
  keyNames?: string[]
  format?: 'json' | 'js' | 'ts'
  clearCache?: boolean
  noCache?: boolean
  ttlMs?: number
  debug?: boolean
}

export async function GenerateCommand(
  outputDirPath: string,
  options: GenerateOptions,
) {
  const { filterCountries } = options
  const downloadCache = new Cache()
  if (options?.clearCache) {
    await downloadCache.clear()
    console.info('Cache cleared.')
  }
  const noCache = options?.noCache || false
  const ttlMs = options?.ttlMs ?? 24 * 60 * 60 * 1000 // Default to 24 hours
  const countries = filterCountries?.map((c) => c.toLowerCase()) ?? [
    'at',
    'be',
    'de',
    'fr',
    'es',
  ]
  const fieldNames = (options?.fieldNames ?? allFieldNames).map((name) => name.toLowerCase())
  const keyNames = (options?.keyNames ?? []).map((name) => name.toLowerCase())
  const outputFormat = options?.format?.toLowerCase() ?? 'js'
  for (const country of countries) {
    const importFilePath = `../download/${country}.js`
    const { getCacheKey, getDownloadUrl, downloadCSV, parseCSV } = await import(
      importFilePath
    )
    const cacheKey = getCacheKey(country)
    let downloadUrl = noCache ? null : await downloadCache.get(cacheKey)
    let isCached = downloadUrl !== null
    if (!downloadUrl) {
      downloadUrl = await getDownloadUrl()
      if (!downloadUrl) {
        throw new Error('Download URL not found')
      }
      if (!noCache) {
        await downloadCache.set(cacheKey, downloadUrl, ttlMs)
      }
    }
    console.info(
      `${isCached ? '' : 'Scraped '}Download URL${isCached ? ' (cached)' : ''}: ${downloadUrl.url}`,
    )
    let response = noCache ? null : await downloadCache.get(downloadUrl.url)
    let responseFetchedDate = noCache
      ? null
      : await downloadCache.get(`${downloadUrl.url}|fetchedDate`)
    isCached = response !== null
    if (!response) {
      response = await downloadCSV(downloadUrl.url)
      responseFetchedDate = new Date().toISOString()
      if (!response) {
        throw new Error('Failed to fetch data from download URL')
      }
      if (!noCache) {
        await downloadCache.set(downloadUrl.url, response, ttlMs)
        await downloadCache.set(
          `${downloadUrl.url}|fetchedDate`,
          responseFetchedDate,
          ttlMs,
        )
      }
    }
    console.info(
      `Fetched data ${isCached ? '(cached) ' : ''}Size: ${response.length} bytes`,
    )
    let data =
      noCache || !isCached ? null : await downloadCache.get(`data-${country}`)
    isCached = data !== null
    if (!data) {
      data = parseCSV(response, country)
      if (!data) {
        throw new Error('Failed to parse CSV data')
      }
      if (!noCache && data.length !== 0) {
        await downloadCache.set(`data-${country}`, data, ttlMs)
      }
    }
    console.info(
      `Parsed data ${isCached ? '(cached) ' : ''}Size: ${data.length} rows`,
    )
    const outputObject = packData(data, keyNames, fieldNames)
    const outputFilePath = join(outputDirPath, `${country}.${outputFormat}`)
    const outputData =
      outputFormat === 'json'
        ? JSON.stringify(outputObject, null, 0)
        : createJavascriptExport(
          outputObject,
          printSourceInfo(downloadUrl, responseFetchedDate),
          outputFormat === 'ts',
        )
    fs.writeFileSync(outputFilePath, outputData)
    console.info(
      `\nSaved dataset for '${country}' size ${outputData.length} bytes, format '${outputObject.type}' to:\n${outputFilePath}\n`,
    )
  }
}
function createJavascriptExport(
  data: object,
  header: string,
  typescript = false,
): string {
  return `${header}${typescript === true ? `import { DataResult } from 'bankcode-bic';\n` : ''}export const bankData${typescript === true ? ' : DataResult' : ''} = ${JSON.stringify(data, null, 0)};`
}

function printSourceInfo(
  downloadUrl: ScrapeDownloadUrlResult,
  responseFetchedDate: string,
): string {
  return `// Source website: ${downloadUrl.websiteUrl}
// Source download URL: ${downloadUrl.url}
// Fetched date: ${responseFetchedDate}
// Version: ${downloadUrl.version === '' ? responseFetchedDate.replaceAll('-', '').slice(0, 8) : downloadUrl.version}
// ${downloadUrl.notes}
`
}

function getFields(fieldNames: string[], row: string[]) {
  return fieldNames.map((field) => getField(field, row))
}
