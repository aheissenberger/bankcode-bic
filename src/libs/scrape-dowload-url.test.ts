import { describe, expect, it, vi } from 'vitest'
import { scrapeDownloadUrl } from './scrape-dowload-url'

describe('scrapeDownloadUrl', () => {
  it('returns correct result object when match is found', async () => {
    const websiteUrl = 'https://example.com/page'
    const version = '20250607'
    const url = `https://example.com/files/fi_mrr_csv_${version}.csv.gz`
    const html = `<a href="${url}">Download</a>`
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    })
    const regex = /href="(?<url>.*\/fi_mrr_csv_(?<version>\d+)\.csv\.gz)"/
    const result = await scrapeDownloadUrl(websiteUrl, regex, mockFetch)
    expect(result).toEqual({
      websiteUrl,
      url,
      version,
    })
  })

  it('throws error when no match is found', async () => {
    const pageUrl = 'https://example.com/page'
    const html = '<a href="/files/other_file.csv.gz">Download</a>'
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    })
    const regex = /fi_mrr_csv_(\d+)\.csv\.gz/
    await expect(scrapeDownloadUrl(pageUrl, regex, mockFetch)).rejects.toThrow(
      'No matching URL found',
    )
  })

  it('support path without domain', async () => {
    const rootUrl = 'https://example.com'
    const websiteUrl = `${rootUrl}/page`
    const version = '20250607'
    const url = `/files/fi_mrr_csv_${version}.csv.gz`
    const html = `<a href="${url}">Download</a>`
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    })
    const regex = /href="(?<url>.*\/fi_mrr_csv_(?<version>\d+)\.csv\.gz)"/
    const result = await scrapeDownloadUrl(websiteUrl, regex, mockFetch)
    expect(result).toEqual({
      websiteUrl,
      url: `${rootUrl}${url}`,
      version,
    })
  })
})
