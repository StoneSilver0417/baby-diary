const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85

function toBlobAsync(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob(
        (blob) => resolve(blob),
        type,
        quality,
      )
    } catch {
      resolve(null)
    }
  })
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  const mimeMatch = parts[0]?.match(/:(.*?);/)
  let mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  if (
    !mime ||
    mime === 'image/heic' ||
    mime === 'image/heif' ||
    (mime !== 'image/jpeg' && mime !== 'image/png')
  ) {
    mime = 'image/jpeg'
  }
  const binaryStr = atob(parts[1] || '')
  const len = binaryStr.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('FileReader 결과가 유효하지 않습니다.'))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('파일 읽기 실패'))
    reader.onabort = () => reject(new Error('파일 읽기가 중단되었습니다.'))
    reader.readAsDataURL(file)
  })
}

function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    let settled = false

    img.onload = () => {
      if (settled) return
      settled = true
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img)
      } else {
        reject(new Error('이미지 크기가 0입니다.'))
      }
    }
    img.onerror = () => {
      if (settled) return
      settled = true
      reject(new Error('이미지 로드에 실패했습니다.'))
    }
    img.src = src

    if (typeof img.decode === 'function') {
      img.decode().then(() => {
        if (settled) return
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          settled = true
          resolve(img)
        }
      }).catch(() => {
        // img.onload/onerror가 처리
      })
    }
  })
}

async function decodeImage(
  file: File | Blob,
): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      if (bmp.width > 0 && bmp.height > 0) {
        return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() }
      }
      bmp.close()
    } catch {
      try {
        const bmp = await createImageBitmap(file)
        if (bmp.width > 0 && bmp.height > 0) {
          return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() }
        }
        bmp.close()
      } catch {
        // <img> 폴백 진행
      }
    }
  }

  let objectUrl: string | null = null
  try {
    objectUrl = URL.createObjectURL(file)
    const img = await loadImageFromSrc(objectUrl)
    const urlToRevoke = objectUrl
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => {
        try {
          URL.revokeObjectURL(urlToRevoke)
        } catch {}
      },
    }
  } catch {
    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl)
      } catch {}
    }
  }

  try {
    const dataUrl = await readFileAsDataUrl(file)
    const img = await loadImageFromSrc(dataUrl)
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => {},
    }
  } catch (err) {
    throw new Error(
      `이미지를 디코드할 수 없습니다 (HEIC 또는 지원되지 않는 이미지 형식): ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
  }
}

export async function compressImage(file: File | Blob): Promise<Blob> {
  const decoded = await decodeImage(file)
  try {
    const maxDim = Math.max(decoded.width, decoded.height)
    const scale = maxDim > MAX_DIMENSION ? MAX_DIMENSION / maxDim : 1
    const width = Math.max(1, Math.round(decoded.width * scale))
    const height = Math.max(1, Math.round(decoded.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.')
    ctx.drawImage(decoded.source, 0, 0, width, height)

    let blob = await toBlobAsync(canvas, 'image/jpeg', JPEG_QUALITY)
    if (!blob || !blob.type || blob.type === 'image/heic' || blob.type === 'image/heif') {
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
        blob = dataUrlToBlob(dataUrl)
      } catch {
        const dataUrl = canvas.toDataURL('image/png')
        blob = dataUrlToBlob(dataUrl)
      }
    }

    if (!blob || blob.size === 0) {
      throw new Error('이미지 압축에 실패했습니다.')
    }

    const finalMime = blob.type === 'image/png' ? 'image/png' : 'image/jpeg'
    if (blob.type !== finalMime) {
      blob = new Blob([blob], { type: finalMime })
    }

    return blob
  } finally {
    decoded.release()
  }
}
