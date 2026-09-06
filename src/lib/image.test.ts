import { describe, it, expect, vi, afterEach } from 'vitest'
import { dataUrlToBlob, compressImage } from './image'

describe('dataUrlToBlob', () => {
  it('Given a valid JPEG data URL, When dataUrlToBlob is called, Then it returns a Blob with correct type and data', () => {
    // 1x1 transparent/black pixel JPEG base64
    const dataUrl =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    const blob = dataUrlToBlob(dataUrl)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/jpeg')
    expect(blob.size).toBeGreaterThan(0)
  })

  it('Given a valid PNG data URL, When dataUrlToBlob is called, Then it returns a PNG Blob', () => {
    const dataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const blob = dataUrlToBlob(dataUrl)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBeGreaterThan(0)
  })

  it('Given a HEIC or unknown data URL, When dataUrlToBlob is called, Then it falls back to image/jpeg Blob', () => {
    const dataUrl =
      'data:image/heic;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    const blob = dataUrlToBlob(dataUrl)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/jpeg')
    expect(blob.size).toBeGreaterThan(0)
  })
})

describe('compressImage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('Given a decoded bitmap, When compressImage is run with mock canvas, Then it compresses safely', async () => {
    const mockBitmap = {
      width: 3200,
      height: 2400,
      close: vi.fn(),
    }
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap))

    const mockCtx = {
      drawImage: vi.fn(),
    }
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn((callback: (blob: Blob | null) => void, type: string) => {
        if (type === 'image/webp') {
          callback(null)
        } else {
          callback(new Blob(['mock-jpeg'], { type: 'image/jpeg' }))
        }
      }),
      toDataURL: vi.fn(),
    }

    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(mockCanvas),
    })

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await compressImage(file)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('image/jpeg')
    expect(mockBitmap.close).toHaveBeenCalled()
    expect(mockCanvas.width).toBe(1600)
    expect(mockCanvas.height).toBe(1200)
  })

  it('Given toBlob returns null, When compressImage is called, Then it falls back to toDataURL', async () => {
    const mockBitmap = {
      width: 800,
      height: 600,
      close: vi.fn(),
    }
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap))

    const mockCtx = {
      drawImage: vi.fn(),
    }
    const sampleDataUrl =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn((callback: (blob: Blob | null) => void) => callback(null)),
      toDataURL: vi.fn().mockReturnValue(sampleDataUrl),
    }

    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(mockCanvas),
    })

    const file = new File(['test'], 'photo.heic', { type: 'image/heic' })
    const result = await compressImage(file)

    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('image/jpeg')
    expect(mockBitmap.close).toHaveBeenCalled()
  })
})
