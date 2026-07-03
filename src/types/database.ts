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

export type GrowthRecord = {
  id: string
  child_id: string
  record_date: string
  height_cm: number | null
  weight_kg: number | null
  memo: string | null
}

export type Milestone = {
  id: string
  child_id: string
  milestone_date: string
  title: string
  memo: string | null
  created_at: string
}

export type Dividend = {
  id: string
  child_id: string
  dividend_date: string
  stock_name: string
  amount: number
  memo: string | null
}

export type StockPrice = {
  stock_name: string
  current_price: number
  updated_at: string
}
