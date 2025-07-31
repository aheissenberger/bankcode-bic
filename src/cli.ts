import process from 'node:process'
import { parseArgs } from 'node:util'
import { DownloadCommand } from './commands/download'
import { GenerateCommand, type ExportFormatType } from './commands/generate'
import { showHelp } from './commands/help'
import { LookupCommand } from './commands/lookup'

export async function main(
  options = {
    cmds: {
      download: DownloadCommand,
      generate: GenerateCommand,
      help: showHelp,
      lookup: LookupCommand,
      exitApp: process.exit,
    },
    cmdlineArgs: process.argv
  },
) {
  const { cmds, cmdlineArgs } = options
  let positionals: string[] = []
  let flags
  try {
    const { positionals: pos, values } = parseArgs({
      args: cmdlineArgs,
      options: {
        'cache-ttl': { type: 'string' },
        'no-cache': { type: 'boolean' },
        'clear-cache': { type: 'boolean' },
        'filter-country': { type: 'string', multiple: true },
        'key-names': { type: 'string', multiple: true },
        'field-names': { type: 'string', multiple: true },
        quiet: { type: 'boolean' },
        format: {
          type: 'string',
          choices: ['json', 'js', 'ts'],
        },
        debug: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
      allowPositionals: true,
    })
    positionals = pos ?? []
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
      cmds.help()
    } else {
      console.error('Unexpected error:', error)
    }
    cmds.exitApp(1)
  }

  const command = positionals[0]

  switch (command) {
    case 'download':
      if (positionals.length < 2) {
        console.error('Please provide a file path for the downloaded data.')
        cmds.help()
        cmds.exitApp(1)
      }
      await cmds.download(positionals[1], {
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
        cmds.help()
        cmds.exitApp(1)
      }
      if (
        flags?.format !== undefined &&
        !['json', 'js', 'ts'].includes(flags.format)
      ) {
        console.error(
          `Invalid format: ${flags.format}. Valid formats are: json, js, ts.`,
        )
        cmds.exitApp(1)
      }
      await cmds.generate(positionals[1], {
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
        await cmds.lookup(positionals, {
          quiet: flags?.quiet,
          debug: flags?.debug,
        })
      } catch (error) {
        console.info('')
        console.error(error)
        console.info('')
        cmds.help(command)
        cmds.exitApp(1)
      }
      break
    }

    case 'help':
      cmds.help()
      break
    default:
      console.error(`Unknown command: ${command}`)
      cmds.help()
      cmds.exitApp(1)
  }
}
if (require.main === module && process.env.VITEST !== 'true') {
  await main()
}
