import type { GrowthRecord } from '@/types/database'

type LatestMeasurement = {
  readonly value: number
  readonly recordDate: string
}

export type LatestMeasurements = {
  readonly height: LatestMeasurement | null
  readonly weight: LatestMeasurement | null
}

export function getLatestMeasurements(records: readonly GrowthRecord[]): LatestMeasurements {
  let height: LatestMeasurement | null = null
  let weight: LatestMeasurement | null = null

  for (const record of records) {
    if (record.height_cm !== null && (!height || record.record_date > height.recordDate)) {
      height = { value: record.height_cm, recordDate: record.record_date }
    }
    if (record.weight_kg !== null && (!weight || record.record_date > weight.recordDate)) {
      weight = { value: record.weight_kg, recordDate: record.record_date }
    }
  }

  return { height, weight }
}
