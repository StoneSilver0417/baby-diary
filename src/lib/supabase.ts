import { createClient } from '@supabase/supabase-js'

export const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * mock 모드에서는 URL/키가 없어도 되도록 더미 값을 넣는다.
 * 실제 요청은 각 feature의 api.ts에서 useMock 분기로 걸러내 절대 발생하지 않는다.
 */
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
)
