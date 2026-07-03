import { differenceInCalendarDays, differenceInCalendarMonths } from 'date-fns'

/** 생일로부터 D+N일 · N개월 계산 (피드·성장 헤더 공용) */
export function childAge(birthDate: string | undefined) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  return {
    days: differenceInCalendarDays(now, birth),
    months: differenceInCalendarMonths(now, birth),
  }
}
