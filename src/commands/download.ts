import fs from 'node:fs'
import { join } from 'node:path'

import { Cache } from '../libs/cache'

export type ExportFormatType = 'json' | 'js' | 'ts'

type DownloadOptions = {
  filterCountries?: string[]
  clearCache?: boolean
  noCache?: boolean
  ttlMs?: number
  debug?: boolean
}

export async function DownloadCommand(
  outputDirPath: string,
  options: DownloadOptions,
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
    const dataFormat = downloadUrl.dataFormat
    const outputFilePath = join(outputDirPath, `${country}.${dataFormat}`)
    fs.writeFileSync(outputFilePath, response)
    console.info(
      `\nSaved dataset for '${country}' size ${response.length} bytes, format '${dataFormat}' to:\n${outputFilePath}\n`,
    )
  }
}
