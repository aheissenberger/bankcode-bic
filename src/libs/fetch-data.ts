import {
  fieldNames as allFieldNames,
  type FieldNameType,
} from '../download/download'
import { packData } from './pack-data'

export type fetchDataOptions = {
  keyNames?: FieldNameType[]
  fieldNames?: FieldNameType[]
  fetchFn?: typeof globalThis.fetch
}

/**
 * Fetches bank data for a specified country and packs it into a structured format.
 *
 * @param country - The country code for which to fetch bank data.
 * @param options - Optional parameters including key names, field names, and a custom fetch function.
 * @returns A promise that resolves to a packed data object containing bank information.
 * @throws {Error} If the download URL is not found, if the data fails to download, if parsing fails, or if packing fails.
 */
export async function fetchData(country: string, options: fetchDataOptions) {
  const importFilePath = `../download/${country}.js`
  const { getDownloadUrl, downloadCSV, parseCSV } = await import(importFilePath)
  const fieldNames = options?.fieldNames ?? allFieldNames
  const keyNames = options?.keyNames ?? ['BankCode']
  const fetchFn = options?.fetchFn ?? globalThis.fetch
  const downloadUrl = await getDownloadUrl(fetchFn)
  if (!downloadUrl) {
    throw new Error('Download URL not found')
  }
  const csv = await downloadCSV(downloadUrl, fetchFn)
  if (!csv) {
    throw new Error('Failed to download data')
  }
  const data = parseCSV(csv)
  if (!data) {
    throw new Error('Failed to parse CSV data')
  }
  const outputObject = packData(data, keyNames, fieldNames)
  if (!outputObject) {
    throw new Error('Failed to pack data')
  }
  return outputObject
}
