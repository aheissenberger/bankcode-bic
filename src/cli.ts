import process from 'node:process'
import { parseArgs } from 'node:util'
import { DownloadCommand } from './commands/download'
import { GenerateCommand, type ExportFormatType } from './commands/generate'
import { showHelp } from './commands/help'
import { lookup } from './commands/lookup'

async function main() {
  let positionals, flags
  try {
    const { positionals: pos, values } = parseArgs({
      options: {
        'cache-ttl': { type: 'string' },
        'no-cache': { type: 'boolean' },
        'clear-cache': { type: 'boolean' },
        'filter-country': { type: 'string', multiple: true },
        'key-names': { type: 'string', multiple: true },
        'field-names': { type: 'string', multiple: true },
        'quiet': { type: 'boolean' },
        format: {
          type: 'string',
          choices: ['json', 'js', 'ts'],
        },
        debug: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
      allowPositionals: true,
    })
    positionals = pos
    flags = values
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION'
    ) {
      console.error(
        'Error parsing command line arguments:',
        (error as { message?: string }).message,
      )
      showHelp()
    } else {
      console.error('Unexpected error:', error)
    }
    process.exit(1)
  }

  const command = positionals[0]

  switch (command) {
    case 'download':
      if (positionals.length < 2) {
        console.error('Please provide a file path for the downloaded data.')
        showHelp()
        process.exit(1)
      }
      DownloadCommand(positionals[1], {
        filterCountries: flags?.['filter-country'],
        clearCache: flags?.['clear-cache'],
        noCache: flags?.['no-cache'],
        ttlMs: flags?.['cache-ttl']
          ? Number.parseInt(flags['cache-ttl'], 10)
          : undefined,
      })
      break
    case 'generate':
      if (positionals.length < 2) {
        console.error('Please provide a file path for the generated data.')
        showHelp()
        process.exit(1)
      }
      if (
        flags?.format !== undefined &&
        !['json', 'js', 'ts'].includes(flags.format)
      ) {
        console.error(
          `Invalid format: ${flags.format}. Valid formats are: json, js, ts.`,
        )
        process.exit(1)
      }
      GenerateCommand(positionals[1], {
        filterCountries: flags?.['filter-country'],
        fieldNames: flags?.['field-names'],
        keyNames: flags?.['key-names'],
        format: flags?.format as ExportFormatType,
        // details: flags?.details,
        clearCache: flags?.['clear-cache'],
        noCache: flags?.['no-cache'],
        ttlMs: flags?.['cache-ttl']
          ? Number.parseInt(flags['cache-ttl'], 10)
          : undefined,
        debug: flags?.debug,
      })
      break

    case 'lookup': {
      try {
        positionals.shift()
        await lookup(positionals, {
          quiet: flags?.quiet,
          debug: flags?.debug,
        })
      } catch (error) {
        console.info("")
        console.error(error)
        console.info("")
        showHelp(command)
        process.exit(1)
      }
      break
    }

    case 'help':
      showHelp()
      break
    default:
      console.error(`Unknown command: ${command}`)
      showHelp()
      process.exit(1)
  }
}
await main()
