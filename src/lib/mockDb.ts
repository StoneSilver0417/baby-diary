import type {
  Child,
  Comment,
  DiaryEntry,
  DiaryPhoto,
  Dividend,
  GrowthRecord,
  Household,
  InvestNote,
  Milestone,
  Profile,
  StockPrice,
  Trade,
} from '@/types/database'

/**
 * Supabase 프로젝트 생성 전 UI를 검증하기 위한 인메모리 목업.
 * VITE_USE_MOCK=true일 때 lib/supabase.ts 대신 이 모듈이 데이터 계층 역할을 한다.
 */

/** mock은 단일 가족만 시뮬레이션한다 (멀티테넌트 격리는 실제 Supabase의 RLS가 담당) */
export const HOUSEHOLD_ID = 'household-1'

export const MOCK_USERS = [
  { id: 'user-a', email: 'appa@family.test', password: 'test1234', display_name: '아빠' },
  { id: 'user-b', email: 'omma@family.test', password: 'test1234', display_name: '엄마' },
] as const

const today = new Date()
const iso = (d: Date) => d.toISOString().slice(0, 10)
const daysAgo = (n: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d
}

export const mockState = {
  profiles: MOCK_USERS.map<Profile>((u) => ({
    id: u.id,
    household_id: HOUSEHOLD_ID,
    display_name: u.display_name,
    last_seen_diary_at: null,
  })),
  household: {
    id: HOUSEHOLD_ID,
    name: '우리집',
  } as Household,
  children: [
    {
      id: 'child-1',
      household_id: HOUSEHOLD_ID,
      name: '하은',
      birth_date: iso(daysAgo(200)),
    },
    {
      id: 'child-2',
      household_id: HOUSEHOLD_ID,
      name: '도윤',
      birth_date: iso(daysAgo(20)),
    },
  ] as Child[],
  entries: [
    {
      id: 'entry-1',
      household_id: HOUSEHOLD_ID,
      author_id: 'user-b',
      child_id: null,
      entry_date: iso(daysAgo(1)),
      content: '오늘 처음으로 뒤집기에 성공했어요! 너무 신기해서 몇 번이나 다시 보여줬어요.',
      created_at: daysAgo(1).toISOString(),
      photos: [] as DiaryPhoto[],
      comments: [] as Comment[],
      likedBy: [] as string[],
      authorName: '엄마',
    },
    {
      id: 'entry-2',
      household_id: HOUSEHOLD_ID,
      author_id: 'user-a',
      child_id: 'child-1',
      entry_date: iso(daysAgo(3)),
      content: '이유식을 처음 먹어봤는데 표정이 너무 웃겼다.',
      created_at: daysAgo(3).toISOString(),
      photos: [] as DiaryPhoto[],
      comments: [
        {
          id: 'comment-1',
          entry_id: 'entry-2',
          author_id: 'user-b',
          content: '표정 진짜 웃기다 ㅋㅋ',
          created_at: daysAgo(3).toISOString(),
        },
      ],
      likedBy: ['user-b'],
      authorName: '아빠',
    },
  ] as DiaryEntry[],
  trades: [
    {
      id: 'trade-1',
      household_id: HOUSEHOLD_ID,
      child_id: 'child-1',
      trade_date: iso(daysAgo(30)),
      stock_name: '삼성전자',
      side: '매수',
      quantity: 10,
      unit_price: 70000,
      memo: '첫 매수',
    },
  ] as Trade[],
  notes: [] as InvestNote[],
  growthRecords: [
    {
      id: 'growth-1',
      household_id: HOUSEHOLD_ID,
      child_id: 'child-1',
      record_date: iso(daysAgo(200)),
      height_cm: 50.5,
      weight_kg: 3.4,
      memo: '출생',
    },
    {
      id: 'growth-2',
      household_id: HOUSEHOLD_ID,
      child_id: 'child-1',
      record_date: iso(daysAgo(140)),
      height_cm: 57.2,
      weight_kg: 5.1,
      memo: '2개월 검진',
    },
    {
      id: 'growth-3',
      household_id: HOUSEHOLD_ID,
      child_id: 'child-1',
      record_date: iso(daysAgo(80)),
      height_cm: 63.0,
      weight_kg: 6.8,
      memo: '4개월 검진',
    },
    {
      id: 'growth-4',
      household_id: HOUSEHOLD_ID,
      child_id: 'child-1',
      record_date: iso(daysAgo(20)),
      height_cm: 67.5,
      weight_kg: 7.9,
      memo: null,
    },
  ] as GrowthRecord[],
  milestones: [
    {
      id: 'milestone-1',
      household_id: HOUSEHOLD_ID,
      child_id: 'child-1',
      milestone_date: iso(daysAgo(100)),
      title: '첫 미소',
      memo: '아침에 눈 마주치고 처음 웃었다',
      created_at: daysAgo(100).toISOString(),
    },
    {
      id: 'milestone-2',
      household_id: HOUSEHOLD_ID,
      child_id: 'child-1',
      milestone_date: iso(daysAgo(1)),
      title: '첫 뒤집기',
      memo: null,
      created_at: daysAgo(1).toISOString(),
    },
  ] as Milestone[],
  dividends: [
    {
      id: 'dividend-1',
      household_id: HOUSEHOLD_ID,
      child_id: 'child-1',
      dividend_date: iso(daysAgo(10)),
      stock_name: '삼성전자',
      amount: 3610,
      memo: '분기 배당',
    },
  ] as Dividend[],
  prices: [
    {
      household_id: HOUSEHOLD_ID,
      stock_name: '삼성전자',
      current_price: 75000,
      updated_at: daysAgo(2).toISOString(),
    },
  ] as StockPrice[],
}
