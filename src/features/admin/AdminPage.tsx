import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AppLink } from '@/lib/navigation'
import type { InquiryWithAuthor } from './api'
import { useAdminStats, useAllInquiries, useReplyInquiry } from './useAdminQueries'

export function AdminPage() {
  const { data: stats } = useAdminStats()
  const { data: inquiries } = useAllInquiries()
  const reply = useReplyInquiry()

  return (
    <div className="min-h-full p-5 pt-safe">
      <header className="mb-5 flex items-center gap-2">
        <AppLink to="/settings" aria-label="뒤로">
          <ChevronLeft className="size-5" />
        </AppLink>
        <h1 className="text-lg font-semibold text-foreground">관리자</h1>
      </header>

      {stats && (
        <div className="mb-6 grid grid-cols-3 gap-2 text-center">
          <StatCard label="가족" value={stats.households} />
          <StatCard label="구성원" value={stats.profiles} />
          <StatCard label="아이" value={stats.children} />
          <StatCard label="일기" value={stats.entries} />
          <StatCard label="미답변 문의" value={stats.open_inquiries} />
        </div>
      )}

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">문의 목록</h2>
      <div className="space-y-3">
        {inquiries?.map((inquiry) => (
          <InquiryRow
            key={inquiry.id}
            inquiry={inquiry}
            onReply={(text) => reply.mutate({ id: inquiry.id, reply: text })}
            pending={reply.isPending}
          />
        ))}
        {inquiries?.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">문의가 없어요.</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function InquiryRow({
  inquiry,
  onReply,
  pending,
}: {
  inquiry: InquiryWithAuthor
  onReply: (text: string) => void
  pending: boolean
}) {
  const [text, setText] = useState(inquiry.reply ?? '')

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">
        {inquiry.profiles?.display_name ?? '알 수 없음'}
      </div>
      <p className="text-sm text-foreground">{inquiry.content}</p>
      {inquiry.replied_at ? (
        <p className="rounded-md bg-accent p-2 text-sm text-accent-foreground">{inquiry.reply}</p>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="답변을 입력하세요"
          />
          <Button size="sm" onClick={() => onReply(text)} disabled={pending || !text.trim()}>
            답변 등록
          </Button>
        </div>
      )}
    </div>
  )
}
