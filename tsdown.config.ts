import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: [
      './src/index.ts',
      './src/cli.ts',
      './src/libs/cache.browser.ts',
      './src/libs/cache.node.ts',
      './src/download/at.ts',
      './src/download/be.ts',
      './src/download/de.ts',
      './src/download/es.ts',
      './src/download/fr.ts',
    ],
    format: ['esm'],
    platform: 'neutral',
    dts: true,
    //exports: true,
    unbundle: true,
    external: [
      'node:util',
      'node:fs/promises',
      'node:async_hooks',
      'node:zlib',
      'node:buffer',
      'node:path',
      'node:process',
      'node:stream',
      'node:crypto',
      'node:os',
      'node:fs',
      'node:v8',
    ],
    sourcemap: false,
  },
])
