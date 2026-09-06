import { describe, expect, it } from 'vitest'
import type { GrowthRecord } from '@/types/database'
import { getLatestMeasurements } from './growthSummary'

const records: readonly GrowthRecord[] = [
  {
    id: 'older-complete',
    household_id: 'household-1',
    child_id: 'child-1',
    record_date: '2026-07-01',
    height_cm: 82.4,
    weight_kg: 11.2,
    memo: null,
  },
  {
    id: 'newer-height',
    household_id: 'household-1',
    child_id: 'child-1',
    record_date: '2026-08-01',
    height_cm: 84.1,
    weight_kg: null,
    memo: null,
  },
  {
    id: 'newest-weight',
    household_id: 'household-1',
    child_id: 'child-1',
    record_date: '2026-09-01',
    height_cm: null,
    weight_kg: 11.8,
    memo: null,
  },
]

describe('getLatestMeasurements', () => {
  it('Given partial records on different dates, When summarized, Then each metric uses its newest non-null record', () => {
    const summary = getLatestMeasurements(records)

    expect(summary.height).toEqual({ value: 84.1, recordDate: '2026-08-01' })
    expect(summary.weight).toEqual({ value: 11.8, recordDate: '2026-09-01' })
  })

  it('Given records without a measurement, When summarized, Then the missing metric remains null', () => {
    const summary = getLatestMeasurements([
      { ...records[1], weight_kg: null },
    ])

    expect(summary.height).toEqual({ value: 84.1, recordDate: '2026-08-01' })
    expect(summary.weight).toBeNull()
  })

  it('Given records in descending order, When summarized, Then input order is preserved', () => {
    const input = [...records].reverse()

    getLatestMeasurements(input)

    expect(input.map((record) => record.id)).toEqual([
      'newest-weight',
      'newer-height',
      'older-complete',
    ])
  })
})
