import { describe, it, expect } from 'vitest'
import { xlsxWorksheetData, parseSharedStringsXml } from '../src/libs/xlsx-worksheet'

const simpleXml = `
<worksheet>
  <sheetData>
    <row r="1">
      <c r="A1"><v>foo</v></c>
      <c r="B1"><v>bar</v></c>
      <c r="C1"><v>baz</v></c>
    </row>
    <row r="2">
      <c r="A2"><v>1</v></c>
      <c r="C2"><v>3</v></c>
    </row>
  </sheetData>
</worksheet>
`

describe('xlsxWorksheetData (simple worksheet)', () => {
    it('parses rows and columns correctly', () => {
        const rows = xlsxWorksheetData(simpleXml)
        expect(rows).toEqual([
            ['foo', 'bar', 'baz'],
            ['1', '', '3'],
        ])
    })
})

const sharedStringsXml = `
<sst count="2" uniqueCount="2" xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <si><t>foo</t></si>
  <si><t>bar</t></si>
</sst>
`

describe('xlsxWorksheetData (with sharedStrings)', () => {
    it('parses shared string cells using sharedStrings map', () => {
        const worksheetXml = `
      <worksheet><sheetData>
        <row r="1">
          <c r="A1" t="s"><v>0</v></c>
          <c r="B1" t="s"><v>1</v></c>
        </row>
      </sheetData></worksheet>
    `
        const sharedStrings = parseSharedStringsXml(sharedStringsXml)
        expect(xlsxWorksheetData(worksheetXml, sharedStrings)).toEqual([
            ['foo', 'bar']
        ])
    })
})
