export type Profile = {
  id: string
  display_name: string
  last_seen_diary_at: string | null
}

export type Child = {
  id: string
  name: string
  birth_date: string
}

export type DiaryPhoto = {
  id: string
  entry_id: string
  storage_path: string
  sort_order: number
}

export type Comment = {
  id: string
  entry_id: string
  author_id: string
  content: string
  created_at: string
}

export type DiaryEntry = {
  id: string
  author_id: string
  entry_date: string
  content: string
  created_at: string
  photos: DiaryPhoto[]
  comments: Comment[]
  likedBy: string[]
  authorName: string
}

export type TradeSide = '매수' | '매도'

export type Trade = {
  id: string
  child_id: string
  trade_date: string
  stock_name: string
  side: TradeSide
  quantity: number
  unit_price: number
  memo: string | null
}

export type InvestNote = {
  id: string
  author_id: string
  note_date: string
  content: string
}
