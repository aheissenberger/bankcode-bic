import { ungzipBrowser } from './ungzip.browser'
import { ungzipNode } from './ungzip.node'

export type UnGzipFunction = (res: Response) => Promise<string>

export const ungzip = 'window' in globalThis ? ungzipBrowser : ungzipNode
