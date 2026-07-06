import { supabase, useMock } from '@/lib/supabase'
import type { AdminStats, Inquiry } from '@/types/database'

export async function checkIsAdmin(): Promise<boolean> {
  if (useMock) return false
  const { data, error } = await supabase.rpc('is_admin')
  if (error) throw error
  return Boolean(data)
}

export async function getAdminStats(): Promise<AdminStats> {
  if (useMock) throw new Error('모의 모드에서는 관리자 기능을 지원하지 않아요.')
  const { data, error } = await supabase.rpc('admin_stats')
  if (error) throw error
  return data as AdminStats
}

export type InquiryWithAuthor = Inquiry & { profiles: { display_name: string } | null }

export async function getAllInquiries(): Promise<InquiryWithAuthor[]> {
  if (useMock) throw new Error('모의 모드에서는 관리자 기능을 지원하지 않아요.')
  const { data, error } = await supabase
    .from('inquiries')
    .select('*, profiles(display_name)')
    .order('replied_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as InquiryWithAuthor[]
}

export async function replyInquiry(id: string, reply: string): Promise<void> {
  if (useMock) throw new Error('모의 모드에서는 관리자 기능을 지원하지 않아요.')
  const { error } = await supabase
    .from('inquiries')
    .update({ reply, replied_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
