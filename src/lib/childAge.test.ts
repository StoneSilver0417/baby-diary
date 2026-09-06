import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { childAge } from './childAge'

describe('childAge', () => {
  beforeEach(() => {
    // Mock system time to a fixed date for deterministic tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2023-10-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Given undefined birthDate, When calculated, Then it returns null', () => {
    expect(childAge(undefined)).toBeNull()
  })

  it('Given empty string birthDate, When calculated, Then it returns null', () => {
    expect(childAge('')).toBeNull()
  })

  it('Given a valid birthDate, When calculated, Then it returns correct days and months', () => {
    // Born exactly 1 year ago
    const result1 = childAge('2022-10-15')
    expect(result1).not.toBeNull()
    expect(result1?.days).toBe(365)
    expect(result1?.months).toBe(12)

    // Born 10 days ago
    const result2 = childAge('2023-10-05')
    expect(result2).not.toBeNull()
    expect(result2?.days).toBe(10)
    expect(result2?.months).toBe(0)

    // Born 1 month and 5 days ago
    const result3 = childAge('2023-09-10')
    expect(result3).not.toBeNull()
    expect(result3?.days).toBe(35) // 20 days in Sep + 15 days in Oct
    expect(result3?.months).toBe(1)
  })
})
