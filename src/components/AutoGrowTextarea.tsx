import { useLayoutEffect, useRef, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * 내용에 따라 세로로 자동으로 늘어나는 textarea. 단일 줄 Input처럼 시작하되,
 * 길어지면 가로 스크롤 대신 줄바꿈되며 높이가 늘고, 최대 높이(max-h-32)를 넘으면
 * 그때만 세로 스크롤한다. iOS Safari는 CSS field-sizing을 아직 지원하지 않아
 * scrollHeight로 직접 높이를 맞춘다(값이 바뀔 때마다 재계산).
 */
export function AutoGrowTextarea({ value, className, ...props }: ComponentProps<'textarea'>) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    // border-box라 scrollHeight(내용+패딩)에 테두리 두께(offsetHeight-clientHeight)를
    // 더해야 정확히 맞는다. 안 더하면 1~2px 모자라 불필요한 세로 스크롤바가 뜬다.
    const border = el.offsetHeight - el.clientHeight
    el.style.height = `${el.scrollHeight + border}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      className={cn(
        'w-full min-w-0 resize-none rounded-md border border-input bg-transparent px-3 py-1.5 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
        'max-h-32 overflow-y-auto',
        className,
      )}
      {...props}
    />
  )
}
