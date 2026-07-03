import type {
  Child,
  Comment,
  DiaryEntry,
  DiaryPhoto,
  InvestNote,
  Profile,
  Trade,
} from '@/types/database'

/**
 * Supabase 프로젝트 생성 전 UI를 검증하기 위한 인메모리 목업.
 * VITE_USE_MOCK=true일 때 lib/supabase.ts 대신 이 모듈이 데이터 계층 역할을 한다.
 */

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
    display_name: u.display_name,
    last_seen_diary_at: null,
  })),
  child: {
    id: 'child-1',
    name: '하은',
    birth_date: iso(daysAgo(200)),
  } as Child,
  entries: [
    {
      id: 'entry-1',
      author_id: 'user-b',
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
      author_id: 'user-a',
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
}
