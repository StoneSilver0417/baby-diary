import type { ComponentProps } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 하단 탭바 위 플로팅 추가 버튼의 공통 스타일 (Link 등 다른 요소에도 재사용) */
export const fabClassName =
  'bottom-fab fixed right-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg'

/** 플로팅 추가(+) 버튼 — SheetTrigger asChild 등에 그대로 감쌀 수 있는 button */
export function Fab({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button type="button" className={cn(fabClassName, className)} {...props}>
      <Plus className="size-6" />
    </button>
  )
}
