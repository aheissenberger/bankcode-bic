export interface ScrapeDownloadUrlResult {
  websiteUrl: string
  url: string
  version: string
}

export interface ScrapeDownloadUrl {
  (
    websiteUrl: string,
    urlRegex: RegExp,
    fetchFn: typeof globalThis.fetch,
  ): Promise<ScrapeDownloadUrlResult>
}

export const scrapeDownloadUrl: ScrapeDownloadUrl = async (
  websiteUrl,
  urlRegex,
  fetchFn,
) => {
  const response = await fetchFn(websiteUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${websiteUrl}: ${response.statusText}`)
  }
  const text = await response.text()
  const match = text.match(urlRegex)
  if (!match || !match.groups) {
    throw new Error(`No matching URL found in ${websiteUrl}`)
  }
  const { url, version } = match.groups
  return {
    websiteUrl,
    url: new URL(url, websiteUrl).href,
    version,
  }
}
