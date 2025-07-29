import type { FieldNameType } from '../download/download'
import type { DataResult, DataResultKeyed } from '../libs/pack-data'

type RecordType = Partial<Record<FieldNameType, string>>

/**
 * Converts field values to an object with the specified fields.
 *
 * @param fieldValues - The values of the fields, either as a string or an array of strings.
 * @param fields - The field names to use as keys in the resulting object.
 * @returns An object where each key corresponds to a field name and its value is the corresponding value from fieldValues.
 */
export const toObject = (
  fieldValues: string | string[],
  fields: FieldNameType[],
) => {
  if (typeof fieldValues === 'string') {
    const key: FieldNameType = fields[0]
    const obj: RecordType = { [key]: fieldValues }
    return obj
  }
  const obj: RecordType = fields.reduce((acc, field, idx) => {
    acc[field] = fieldValues[idx]
    return acc
  }, {} as RecordType)
  return obj
}

/**
 * Retrieves an object from keyed data based on a key value.
 *
 * @param keyValue - The value of the key to look up.
 * @param data - The keyed data result (must be of type DataResultKeyed).
 * @returns The object corresponding to the key value, or undefined if not found.
 * @throws {Error} If the data is not in keyed format.
 */
export const keyedGetObject = (keyValue: string, data: DataResultKeyed) => {
  if (data?.type === 'keyed') {
    const fieldsValues = data?.banks[keyValue]
    if (!fieldsValues) {
      return undefined
    }
    return toObject(fieldsValues, data.fields)
  } else {
    throw new Error('Data is not in keyed format')
  }
}

/**
 * Retrieves an object from serialized data based on a key and key value.
 *
 * @param key - The field name of the key to look up.
 * @param keyValue - The value of the key to look up.
 * @param data - The serialized data result (must be of type DataResultSerialized).
 * @returns The object corresponding to the key value, or undefined if not found.
 * @throws {Error} If the data is not in serialized format or the key is not found.
 */
export const serializedGetObject = (
  key: string,
  keyValue: string,
  data: DataResult,
) => {
  if (data?.type === 'serialized') {
    const keyMap = data?.keys?.[key as FieldNameType]
    if (!keyMap) {
      throw new Error(`Key "${key}" not found in data keys`)
    }
    const dataIndex = keyMap[keyValue]
    if (dataIndex === undefined) {
      return undefined
    }
    const fieldsValues = data.banks[dataIndex]
    if (fieldsValues.length !== data.fields.length) {
      throw new Error('Fields length mismatch')
    }
    return toObject(fieldsValues, data.fields)
  } else {
    throw new Error('Data is not in serialized format')
  }
}
