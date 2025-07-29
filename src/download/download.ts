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
  BankCode: string,
  BIC: string,
  Name: string,
  Address: string,
  PostCode: string,
  City: string,
  Phone: string,
  Fax: string,
  Email: string,
  Website: string,
]
export interface ParseCSVType {
  (cvs: CSVString | Unzipped, countryCode: string): BankData[]
}

export type FieldNameType =
  | 'BankCode'
  | 'BIC'
  | 'Name'
  | 'Address'
  | 'PostCode'
  | 'City'
  | 'Phone'
  | 'Fax'
  | 'Email'
  | 'Website'

export const fieldNames: FieldNameType[] = [
  'BankCode',
  'BIC',
  'Name',
  'Address',
  'PostCode',
  'City',
  'Phone',
  'Fax',
  'Email',
  'Website',
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
