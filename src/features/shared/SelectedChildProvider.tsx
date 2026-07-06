import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useChildren } from '@/features/diary/useDiaryQueries'
import type { Child } from '@/types/database'

const STORAGE_KEY = 'baby-diary-selected-child'

type SelectedChildContextValue = {
  children: Child[]
  selectedChild: Child | undefined
  selectedChildId: string | undefined
  setSelectedChildId: (id: string) => void
}

const SelectedChildContext = createContext<SelectedChildContextValue | null>(null)

export function SelectedChildProvider({ children: content }: { children: ReactNode }) {
  const { data: children = [] } = useChildren()
  const [selectedChildId, setSelectedChildIdState] = useState<string | undefined>(
    () => localStorage.getItem(STORAGE_KEY) ?? undefined,
  )

  useEffect(() => {
    if (children.length === 0) return
    // 저장된 id가 목록에 없으면(아이 삭제·다른 계정 등) 첫째로 폴백
    if (!selectedChildId || !children.some((c) => c.id === selectedChildId)) {
      setSelectedChildIdState(children[0].id)
    }
  }, [children, selectedChildId])

  function setSelectedChildId(id: string) {
    setSelectedChildIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const selectedChild = children.find((c) => c.id === selectedChildId)

  return (
    <SelectedChildContext.Provider
      value={{ children, selectedChild, selectedChildId, setSelectedChildId }}
    >
      {content}
    </SelectedChildContext.Provider>
  )
}

export function useSelectedChild() {
  const ctx = useContext(SelectedChildContext)
  if (!ctx) {
    throw new Error('useSelectedChild는 SelectedChildProvider 내부에서만 사용할 수 있습니다.')
  }
  return ctx
}
