import { describe, expect, it } from 'vitest'
import {
  keyedGetObject,
  serializedGetObject,
  toObject,
} from '../src/libs/query'
import type { DataResult } from '../src/download/download'

describe('toObject', () => {
  it('converts fieldValues and fields to an object', () => {
    const fields = ['a', 'b']
    const values = ['1', '2']
    expect(toObject(values, fields)).toEqual({ a: '1', b: '2' })
  })

  it('returns undefined for missing values', () => {
    // If fieldValues is shorter than fields, result[field] will be undefined
    expect(toObject(['1'], ['a', 'b'])).toEqual({ a: '1', b: undefined })
  })
})

describe('keyedGetObject', () => {
  const keyedData: DataResult = {
    type: 'keyed',
    fields: ['x', 'y'],
    banks: {
      foo: ['1', '2'],
    },
  }

  it('returns object for existing key', () => {
    expect(keyedGetObject('foo', keyedData)).toEqual({ x: '1', y: '2' })
  })

  it('returns undefined for missing key', () => {
    expect(keyedGetObject('bar', keyedData)).toBeUndefined()
  })

  it('throws if not keyed type', () => {
    // Use a valid DataResult of type serialized
    const serializedData: DataResult = {
      type: 'serialized',
      fields: ['x', 'y'],
      keys: { x: { foo: 0 }, y: { '2': 0 } },
      banks: [['foo', '2']],
    }
    expect(() => keyedGetObject('foo', serializedData)).toThrow(
      'Data is not in keyed format',
    )
  })
})

describe('serializedGetObject', () => {
  const serializedData: DataResult = {
    type: 'serialized',
    fields: ['id', 'name'],
    banks: [
      ['a', 'b'],
      ['c', 'd'],
    ],
    keys: {
      id: { a: 0, c: 1 },
      name: { b: 0, d: 1 },
    },
  }

  it('returns object for valid key and value', () => {
    expect(serializedGetObject('id', 'a', serializedData)).toEqual({
      id: 'a',
      name: 'b',
    })
    expect(serializedGetObject('name', 'd', serializedData)).toEqual({
      id: 'c',
      name: 'd',
    })
  })

  it('returns undefined for missing keyValue', () => {
    expect(serializedGetObject('id', 'zzz', serializedData)).toBeUndefined()
  })

  it('throws if key not found', () => {
    expect(() => serializedGetObject('foo', 'a', serializedData)).toThrow(
      'Key "foo" not found in data keys',
    )
  })

  it('throws if not serialized type', () => {
    // Use a valid DataResult of type keyed
    const keyedData: DataResult = {
      type: 'keyed',
      fields: ['id', 'name'],
      banks: { foo: ['a', 'b'] },
    }
    expect(() => serializedGetObject('id', 'a', keyedData)).toThrow(
      'Data is not in serialized format',
    )
  })

  it('throws if fields and fieldValues length mismatch', () => {
    const badData: DataResult = {
      ...serializedData,
      banks: [['a']],
    }
    expect(() => serializedGetObject('id', 'a', badData)).toThrow(
      'Fields length mismatch',
    )
  })
})
