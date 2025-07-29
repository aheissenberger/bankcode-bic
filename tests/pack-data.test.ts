import { describe, expect, it } from 'vitest'
import {
  packData,
  type DataResultFlat,
  type DataResultKeyed,
  type DataResultSerialized,
} from '../src/libs/pack-data'
import type { BankData } from '../src/download/download'

describe('packData', () => {
  const fieldNames = ['BIC', 'BankCode', 'Name'] as const
  // Each BankData must have 10 fields: BankCode, BIC, Name, Address, PostCode, City, Phone, Fax, Email, Website
  const sampleData: BankData[] = [
    [
      'CODE1',
      'BIC1',
      'Bank One',
      'Addr1',
      '11111',
      'City1',
      '123',
      '456',
      'a@b.com',
      'site1',
    ],
    [
      'CODE2',
      'BIC2',
      'Bank Two',
      'Addr2',
      '22222',
      'City2',
      '234',
      '567',
      'b@c.com',
      'site2',
    ],
    [
      'CODE3',
      'BIC3',
      'Bank Three',
      'Addr3',
      '33333',
      'City3',
      '345',
      '678',
      'c@d.com',
      'site3',
    ],
  ]

  it('returns DataResultFlat when keyNames is empty', () => {
    const result = packData(sampleData, [], fieldNames as any)
    expect(result.type).toBe('flat')
    expect((result as DataResultFlat).fields).toEqual(fieldNames)
    expect((result as DataResultFlat).banks).toEqual([
      ['BIC1', 'CODE1', 'Bank One'],
      ['BIC2', 'CODE2', 'Bank Two'],
      ['BIC3', 'CODE3', 'Bank Three'],
    ])
  })

  it('returns DataResultKeyed when keyNames has length 1', () => {
    const result = packData(sampleData, ['BIC'] as any, fieldNames as any)
    expect(result.type).toBe('keyed')
    expect((result as DataResultKeyed).key).toBe('BIC')
    expect((result as DataResultKeyed).fields).toEqual(fieldNames)
    expect((result as DataResultKeyed).banks.BIC1).toEqual([
      'BIC1',
      'CODE1',
      'Bank One',
    ])
    expect((result as DataResultKeyed).banks.BIC2).toEqual([
      'BIC2',
      'CODE2',
      'Bank Two',
    ])
  })

  it('returns DataResultKeyed with one keyname and one field', () => {
    // Only use 'BIC' as key and field
    const result = packData(sampleData, ['BIC'] as any, ['BIC'] as any)
    expect(result.type).toBe('keyed')
    expect((result as DataResultKeyed).key).toBe('BIC')
    expect((result as DataResultKeyed).fields).toEqual(['BIC'])
    // Should return just the BIC string, not an array
    expect((result as DataResultKeyed).banks.BIC1).toBe('BIC1')
    expect((result as DataResultKeyed).banks.BIC2).toBe('BIC2')
    expect((result as DataResultKeyed).banks.BIC3).toBe('BIC3')
  })

  it('returns DataResultSerialized when keyNames has length >= 2', () => {
    const result = packData(
      sampleData,
      ['BIC', 'BankCode'] as any,
      fieldNames as any,
    )
    expect(result.type).toBe('serialized')
    expect((result as DataResultSerialized).fields).toEqual(fieldNames)
    expect((result as DataResultSerialized).banks).toEqual([
      ['BIC1', 'CODE1', 'Bank One'],
      ['BIC2', 'CODE2', 'Bank Two'],
      ['BIC3', 'CODE3', 'Bank Three'],
    ])
    // keys should map BIC and BankCode to row indices
    expect((result as DataResultSerialized).keys.BIC.BIC1).toBe(0)
    expect((result as DataResultSerialized).keys.BankCode.CODE2).toBe(1)
  })
})
