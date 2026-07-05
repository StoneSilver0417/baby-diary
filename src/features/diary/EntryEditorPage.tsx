import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { usePhotoUrls } from '@/features/diary/useDiaryQueries'
import { useHouseholdId, useMyProfile } from '@/features/shared/useHousehold'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { pickPhotos } from '@/lib/photoPicker'
import { getEntryByDate } from './api'
import { useSaveEntry } from './useDiaryMutations'
import type { DiaryPhoto } from '@/types/database'

const MAX_PHOTOS = 3

export function EntryEditorPage() {
  const { userId } = useAuth()
  const myProfile = useMyProfile()
  const householdId = useHouseholdId()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const saveEntry = useSaveEntry()

  const [date, setDate] = useState(searchParams.get('date') ?? format(new Date(), 'yyyy-MM-dd'))
  const [content, setContent] = useState('')
  const [entryId, setEntryId] = useState<string | undefined>(undefined)
  const [existingPhotos, setExistingPhotos] = useState<DiaryPhoto[]>([])
  const [newPhotos, setNewPhotos] = useState<Blob[]>([])
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!userId) return
    getEntryByDate(userId, date).then((existing) => {
      if (existing) {
        setEntryId(existing.id)
        setContent(existing.content)
        setExistingPhotos(existing.photos)
      } else {
        setEntryId(undefined)
        setContent('')
        setExistingPhotos([])
      }
      setNewPhotos([])
      setNewPhotoPreviews([])
    })
  }, [userId, date])

  const totalPhotoCount = existingPhotos.length + newPhotos.length
  // storage_path는 실모드에선 스토리지 경로라 img src로 못 씀 — 서명 URL로 변환
  const existingPhotoUrls = usePhotoUrls(existingPhotos.map((p) => p.storage_path))

  async function handlePickPhotos(files: FileList | null) {
    if (!files || files.length === 0) return
    const remaining = MAX_PHOTOS - totalPhotoCount
    if (remaining <= 0) {
      toast.error('사진은 최대 3장까지 첨부할 수 있어요.')
      return
    }
    const picked = (await pickPhotos(files)).slice(0, remaining)
    if (files.length > remaining) {
      toast.error('사진은 최대 3장까지 첨부할 수 있어요.')
    }
    setNewPhotos((prev) => [...prev, ...picked])
    setNewPhotoPreviews((prev) => [...prev, ...picked.map((b) => URL.createObjectURL(b))])
  }

  function removeExistingPhoto(id: string) {
    setExistingPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  function removeNewPhoto(index: number) {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index))
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!userId || !householdId) return
    if (!content.trim()) {
      toast.error('내용을 입력해 주세요.')
      return
    }
    try {
      await saveEntry.mutateAsync({
        entryId,
        householdId,
        authorId: userId,
        authorName: myProfile?.display_name ?? '',
        date,
        content,
        keepPhotoIds: existingPhotos.map((p) => p.id),
        newPhotos,
      })
      toast.success('저장했어요.')
      navigate('/')
    } catch {
      // useSaveEntry의 onError 토스트로 처리됨
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-5 p-5 pt-safe">
      <h1 className="font-hand text-xl font-semibold text-foreground">
        {entryId ? '일기 수정' : '일기 작성'}
      </h1>

      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <div className="flex flex-wrap gap-3">
        {existingPhotos.map((photo, i) => (
          <div key={photo.id} className="polaroid relative size-24 shrink-0">
            {existingPhotoUrls[i]?.data && (
              <img
                src={existingPhotoUrls[i].data}
                alt=""
                className="size-full rounded-[2px] object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => removeExistingPhoto(photo.id)}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
              aria-label="사진 삭제"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {newPhotoPreviews.map((url, i) => (
          <div key={url} className="polaroid relative size-24 shrink-0">
            <img src={url} alt="" className="size-full rounded-[2px] object-cover" />
            <button
              type="button"
              onClick={() => removeNewPhoto(i)}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
              aria-label="사진 삭제"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {totalPhotoCount < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex size-24 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border text-2xl text-muted-foreground"
            aria-label="사진 추가"
          >
            +
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void handlePickPhotos(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="오늘 있었던 일을 기록해 보세요"
        className="paper-lines min-h-40 flex-1 font-hand text-lg leading-[1.6rem]"
      />

      <Button onClick={handleSubmit} disabled={saveEntry.isPending}>
        {saveEntry.isPending ? '저장 중…' : '저장'}
      </Button>
    </div>
  )
}
