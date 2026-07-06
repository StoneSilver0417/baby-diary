import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSelectedChild } from '@/features/shared/SelectedChildProvider'

/** 아이가 2명 이상일 때만 노출되는 전환 탭 (성장·투자 탭 헤더에서 사용) */
export function ChildSwitcher() {
  const { children, selectedChildId, setSelectedChildId } = useSelectedChild()
  if (children.length <= 1) return null

  return (
    <Tabs value={selectedChildId ?? ''} onValueChange={setSelectedChildId}>
      <TabsList className="w-full">
        {children.map((c) => (
          <TabsTrigger key={c.id} value={c.id} className="flex-1">
            {c.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
