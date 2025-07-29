import type { Unzipped } from 'fflate/node'

export interface ScrapeDownloadUrlResult {
  websiteUrl: string
  url: string
  dataFormat: 'csv' | 'xlsx'
  version: string
  notes: string
}

export interface GetCacheKeyFn {
  (country: string): string
}

export interface GetDownloadUrlFn {
  (fetchFn: typeof globalThis.fetch): Promise<ScrapeDownloadUrlResult>
}

export type CSVString = string

export interface DownloadType {
  (url: string, fetchFn: typeof globalThis.fetch): Promise<CSVString>
}
export type BankData = [
  bankcode: string,
  bic: string,
  name: string,
  address: string,
  postcode: string,
  city: string,
  phone: string,
  fax: string,
  email: string,
  website: string,
]
export interface ParseCSVType {
  (cvs: CSVString | Unzipped, countryCode: string): BankData[]
}

export type FieldNameType =
  | 'bankcode'
  | 'bic'
  | 'name'
  | 'address'
  | 'postcode'
  | 'city'
  | 'phone'
  | 'fax'
  | 'email'
  | 'website'

export const fieldNames: FieldNameType[] = [
  'bankcode',
  'bic',
  'name',
  'address',
  'postcode',
  'city',
  'phone',
  'fax',
  'email',
  'website',
]

export const getField = (() => {
  const fieldMap = new Map<string, number>()
  fieldNames.forEach((name, index) => fieldMap.set(name.toLowerCase(), index))
  return (colName: FieldNameType, row: string[]): string => {
    const index = fieldMap.get(colName.toLowerCase())
    if (index === undefined) {
      throw new Error(`Column name "${colName}" not found in field names`)
    }
    return row[index]
  }
})()
