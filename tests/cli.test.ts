import { beforeEach, describe, expect, it, vi } from 'vitest'
import { main } from '../src/cli'

// Mock command modules
const DownloadCommand = vi.fn()
const GenerateCommand = vi.fn()
const LookupCommand = vi.fn(async () => { })
const showHelp = vi.fn()
const processExit = (code?: string | number | null | undefined): never => {
  throw new Error(`process.exit called with code: ${code}`)
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('cli main', () => {
  it('calls DownloadCommand for download', async () => {
    await main({
      cmds: {
        download: DownloadCommand,
        generate: GenerateCommand,
        help: showHelp,
        lookup: LookupCommand,
        exitApp: processExit,
      },
      cmdlineArgs: ['download', 'file.csv'],
    })
    expect(DownloadCommand).toHaveBeenCalledWith('file.csv', expect.any(Object))
  })

  it('calls GenerateCommand for generate', async () => {
    await main({
      cmds: {
        download: DownloadCommand,
        generate: GenerateCommand,
        help: showHelp,
        lookup: LookupCommand,
        exitApp: processExit,
      },
      cmdlineArgs: ['generate', 'out.js'],
    })
    expect(GenerateCommand).toHaveBeenCalledWith('out.js', expect.any(Object))
  })

  it('calls LookupCommand for lookup', async () => {
    await main({
      cmds: {
        download: DownloadCommand,
        generate: GenerateCommand,
        help: showHelp,
        lookup: LookupCommand,
        exitApp: processExit,
      },
      cmdlineArgs: ['lookup', 'file.js', 'BankCode', '123456'],
    })
    expect(LookupCommand).toHaveBeenCalled()
  })

  it('calls showHelp for help', async () => {
    await expect(
      main({
        cmds: {
          download: DownloadCommand,
          generate: GenerateCommand,
          help: showHelp,
          lookup: LookupCommand,
          exitApp: processExit,
        },
        cmdlineArgs: ['--help'],
      })
    ).rejects.toThrow('process.exit called with code: 1')
    expect(showHelp).toHaveBeenCalled()
  })

  it('calls showHelp for unknown command', async () => {
    await expect(
      main({
        cmds: {
          download: DownloadCommand,
          generate: GenerateCommand,
          help: showHelp,
          lookup: LookupCommand,
          exitApp: processExit,
        },
        cmdlineArgs: [],
      })
    ).rejects.toThrow('process.exit called with code: 1')
    expect(showHelp).toHaveBeenCalled()
  })
})
