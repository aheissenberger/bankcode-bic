import { describe, expect, it, vi } from 'vitest'
import { isUtf16 } from '../src/libs/utils'

describe('isUtf16', () => {
  it('detects UTF-16LE BOM', () => {
    const buffer = new Uint8Array([0xff, 0xfe, 0x00, 0x61])
    expect(isUtf16(buffer)).toBe('LE')
  })

  it('detects UTF-16BE BOM', () => {
    const buffer = new Uint8Array([0xfe, 0xff, 0x00, 0x61])
    expect(isUtf16(buffer)).toBe('BE')
  })

  it('returns false for no BOM', () => {
    const buffer = new Uint8Array([0x61, 0x62, 0x63, 0x64])
    expect(isUtf16(buffer)).toBe(false)
  })

  it('returns false for short buffer', () => {
    const buffer = new Uint8Array([0xff])
    expect(isUtf16(buffer)).toBe(false)
  })
})

