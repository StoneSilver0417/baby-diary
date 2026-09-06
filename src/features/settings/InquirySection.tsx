import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { queryKeys } from '@/lib/queryClient'
import { createInquiry, getMyInquiries } from './api'

type InquirySectionProps = {
  readonly userId: string | null | undefined
}

export function InquirySection({ userId }: InquirySectionProps) {
  const queryClient = useQueryClient()
  const inquiryKey = queryKeys.inquiries.mine(userId ?? '')
  const { data: inquiries } = useQuery({
    queryKey: inquiryKey,
    queryFn: () => userId ? getMyInquiries(userId) : Promise.resolve([]),
    enabled: Boolean(userId),
  })
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const normalizedContent = content.trim()

  async function handleSubmit() {
    if (!userId || !normalizedContent) return
    setSubmitting(true)
    try {
      await createInquiry(userId, normalizedContent)
      setContent('')
      await queryClient.invalidateQueries({ queryKey: inquiryKey })
      toast.success('문의를 등록했어요.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '등록에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">문의하기</h2>
        <p className="mt-1 text-xs text-muted-foreground">남겨주신 문의와 답변을 이곳에서 확인할 수 있어요.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inquiry-content">문의 내용</Label>
        <Textarea
          id="inquiry-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="궁금한 점이나 불편한 점을 남겨주세요"
          maxLength={2000}
        />
      </div>
      <Button variant="outline" onClick={handleSubmit} disabled={submitting || !normalizedContent}>
        {submitting ? '등록 중…' : '문의 등록'}
      </Button>
      <div className="space-y-2" aria-live="polite">
        {inquiries?.map((inquiry) => (
          <article key={inquiry.id} className="rounded-lg border border-border p-3 text-sm">
            <p className="text-foreground">{inquiry.content}</p>
            {inquiry.reply ? (
              <p className="mt-2 rounded-md bg-accent p-2 text-accent-foreground">{inquiry.reply}</p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">답변 대기 중</p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
