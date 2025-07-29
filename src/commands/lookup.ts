import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import { keyedGetObject, serializedGetObject, toObject } from '../libs/query'

interface LookupOptions {
  quiet?: boolean
  debug?: boolean
}

export async function lookup(
  values: string[],
  options: LookupOptions,
): Promise<any> {
  const quiet = options?.quiet || false
  const importBankDB = values[0]

  if (!existsSync(importBankDB)) {
    throw new Error(
      `File not found: ${importBankDB}. Create it with the "generate" command.`,
    )
  }
  const resolvePath = resolve(importBankDB)
  const { bankData } = await import(resolvePath)
  if (!bankData) {
    throw new Error(`Failed to import bank data from: ${importBankDB}`)
  }
  if (!quiet) console.info(`Using imported bank data from: ${importBankDB}`)

  if (options?.debug) console.debug(JSON.stringify(bankData))

  const keyName = values[1]
  if (!keyName) {
    throw new Error(
      `Key name is required. Possible key names: ${bankData.type === 'keyed'
        ? bankData.key
        : (bankData.type === 'serialized'
          ? Object.keys(bankData.keys || {})
          : bankData.fields
        ).join(', ')
      }`,
    )
  }
  const keyValue = values[2]
  if (!keyValue) {
    throw new Error(
      'Key value is required. Example with "305156796": bankcode-bic lookup de.js BankCode 305156796',
    )
  }

  if (bankData.type === 'keyed' && keyName !== bankData.key) {
    throw new Error(
      `Key name "${keyName}" does not match the bank data key "${bankData.key}"`,
    )
  }

  if (
    bankData.serialized === 'keyed' &&
    !Object.keys(bankData.keys).includes(keyName)
  ) {
    throw new Error(
      `Key "${keyName}" not found in data keys: ${Object.keys(bankData.keys).join(', ')}`,
    )
  }

  if (bankData.serialized === 'flat' && !bankData.fields.includes(keyName)) {
    throw new Error(
      `Key "${keyName}" not found in data keys: ${bankData.fields.join(', ')}`,
    )
  }

  switch (bankData.type) {
    case 'keyed':
      if (!quiet) {
        console.info(
          `Data type: keyed, rows: ${Object.keys(bankData.banks).length}`,
        )
        console.info(`${bankData.key} === ${keyValue}`)
      }
      process.stdout.write(
        `${JSON.stringify(keyedGetObject(keyValue, bankData))}\n`,
      )
      break
    case 'serialized':
      if (!quiet) {
        console.info(`Data type: serialized, rows: ${bankData.banks.length}`)
        console.info(`${keyName} === ${keyValue}`)
      }
      process.stdout.write(
        `${JSON.stringify(serializedGetObject(keyName, keyValue, bankData))}\n`,
      )
      break
    case 'flat':
    default:
      if (!quiet) {
        console.info(`Data type: flat, rows: ${bankData.banks.length}`)
      }
      for (const row of bankData.banks) {
        const rowObj = toObject(row, bankData.fields)
        if (rowObj[keyName] !== keyValue) continue
        process.stdout.write(`${JSON.stringify(rowObj)}\n`)
      }
  }
}
