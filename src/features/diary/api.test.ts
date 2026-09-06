import { describe, it, expect, vi, afterEach } from 'vitest'
import { uploadPhoto, saveEntry } from './api'
import { supabase } from '@/lib/supabase'
import * as imageModule from '@/lib/image'

describe('uploadPhoto', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Given a photo blob, When uploadPhoto is called, Then it uploads with valid image/jpeg contentType and jpg extension', async () => {
    const mockCompressedBlob = new Blob(['compressed-data'], { type: 'image/jpeg' })
    vi.spyOn(imageModule, 'compressImage').mockResolvedValue(mockCompressedBlob)

    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'photo-1',
            entry_id: 'entry-1',
            storage_path: 'house-1/entry-1/uuid.jpg',
            sort_order: 0,
          },
          error: null,
        }),
      }),
    })

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      upload: mockUpload,
      remove: vi.fn(),
    } as unknown as ReturnType<typeof supabase.storage.from>)

    vi.spyOn(supabase, 'from').mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>)

    const result = await uploadPhoto('house-1', 'entry-1', new Blob(['raw']), 0)

    expect(result.id).toBe('photo-1')
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^house-1\/entry-1\/.*\.jpg$/),
      expect.any(Blob),
      { contentType: 'image/jpeg', upsert: false },
    )
  })

  it('Given an HEIC photo blob, When uploadPhoto is called, Then it forces image/jpeg contentType and jpg extension', async () => {
    const mockCompressedBlob = new Blob(['compressed-heic-data'], { type: 'image/heic' })
    vi.spyOn(imageModule, 'compressImage').mockResolvedValue(mockCompressedBlob)

    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'photo-2',
            entry_id: 'entry-2',
            storage_path: 'house-1/entry-2/uuid.jpg',
            sort_order: 1,
          },
          error: null,
        }),
      }),
    })

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      upload: mockUpload,
      remove: vi.fn(),
    } as unknown as ReturnType<typeof supabase.storage.from>)

    vi.spyOn(supabase, 'from').mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>)

    const result = await uploadPhoto('house-1', 'entry-2', new Blob(['raw-heic']), 1)

    expect(result.id).toBe('photo-2')
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^house-1\/entry-2\/.*\.jpg$/),
      expect.any(Blob),
      { contentType: 'image/jpeg', upsert: false },
    )
  })
})

describe('saveEntry', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Given valid input, When saveEntry is called, Then it upserts entry and uploads photos', async () => {
    vi.spyOn(imageModule, 'compressImage').mockResolvedValue(
      new Blob(['compressed'], { type: 'image/jpeg' }),
    )

    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'entry-123' },
          error: null,
        }),
      }),
    })

    const mockSelectPhotos = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })

    const mockInsertPhoto = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'photo-1', entry_id: 'entry-123', storage_path: 'p', sort_order: 0 },
          error: null,
        }),
      }),
    })

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'diary_entries') {
        return {
          upsert: mockUpsert,
        } as unknown as ReturnType<typeof supabase.from>
      }
      if (table === 'diary_photos') {
        return {
          select: mockSelectPhotos,
          insert: mockInsertPhoto,
        } as unknown as ReturnType<typeof supabase.from>
      }
      return {} as unknown as ReturnType<typeof supabase.from>
    })

    vi.spyOn(supabase.storage, 'from').mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    } as unknown as ReturnType<typeof supabase.storage.from>)

    const result = await saveEntry({
      householdId: 'house-1',
      authorId: 'user-1',
      authorName: '아빠',
      childId: null,
      date: '2026-09-06',
      content: '오늘 일기',
      keepPhotoIds: [],
      newPhotos: [new Blob(['test-photo'])],
    })

    expect(result.entryId).toBe('entry-123')
    expect(result.failedPhotos).toBe(0)
    expect(result.errors).toEqual([])
  })
})
