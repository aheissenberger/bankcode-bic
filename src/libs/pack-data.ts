import {
  getField,
  type BankData,
  type FieldNameType,
} from '../download/download'

export type SerializedDataFormatType = 'keyed' | 'serialized' | 'flat'

type BanksKeyed = Record<string, string | string[]>
export type DataResultKeyed = {
  type: 'keyed'
  key: FieldNameType
  fields: FieldNameType[]
  banks: BanksKeyed
}

type KeysSerialized = Record<FieldNameType, Record<string, number>>
export type DataResultSerialized = {
  type: 'serialized'
  keys: KeysSerialized
  fields: FieldNameType[]
  banks: string[][]
}

export type DataResultFlat = {
  type: 'flat'
  fields: FieldNameType[]
  banks: string[][]
}

export type DataResult = DataResultKeyed | DataResultSerialized | DataResultFlat

export function packData(
  data: BankData[],
  keyNames: FieldNameType[],
  fieldNames: FieldNameType[],
): DataResult {
  const dataFormat = ['flat', 'keyed', 'serialized'][
    Math.min(keyNames.length, 2)
  ]
  let outputObject: DataResult
  switch (dataFormat) {
    case 'keyed': {
      const onlyOneField = fieldNames.length === 1
      outputObject = {
        type: 'keyed' as const,
        key: keyNames[0],
        fields: fieldNames,
        banks: data.reduce((acc: BanksKeyed, row: string[]) => {
          const key = getField(keyNames[0], row)
          acc[key] = onlyOneField
            ? getField(fieldNames[0], row)
            : getFields(fieldNames, row)
          return acc
        }, {} as BanksKeyed),
      }
      break
    }
    case 'serialized': {
      const keysData = keyNames.reduce((acc, key) => {
        acc[key] = {}
        return acc
      }, {} as KeysSerialized)
      const banks: string[][] = Array.from({ length: data.length })
      let index = 0
      for (const row of data) {
        for (const keyName of keyNames) {
          keysData[keyName][getField(keyName, row)] = index
        }
        banks[index++] = getFields(fieldNames, row)
      }
      outputObject = {
        type: 'serialized' as const,
        keys: keysData,
        fields: fieldNames,
        banks,
      }
      break
    }
    default: // 'flat'
      outputObject = {
        type: 'flat' as const,
        fields: fieldNames,
        banks: data.map((row: string[]) => getFields(fieldNames, row)),
      }
  }
  return outputObject
}

function getFields(fieldNames: FieldNameType[], row: string[]) {
  return fieldNames.map((field) => getField(field, row))
}
