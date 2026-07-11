const MAX_DIMENSION = 1600
const WEBP_QUALITY = 0.8
const JPEG_QUALITY = 0.85

function toBlobAsync(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * 이미지를 캔버스에 그릴 수 있는 형태로 디코드한다.
 * createImageBitmap(EXIF 회전 반영)을 우선 쓰되, 실패하면 <img> 디코드로 폴백한다.
 * 특정 포맷·환경에서 둘 중 한쪽만 성공하는 경우가 있어(예: 일부 기기의 HEIC, 큰 이미지)
 * 이중 경로로 견고성을 높인다.
 */
async function decodeImage(
  file: File | Blob,
): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    if (bmp.width > 0 && bmp.height > 0) {
      return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() }
    }
    bmp.close()
  } catch {
    // 아래 <img> 폴백을 시도한다.
  }

  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('빈 이미지')
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    }
  } catch (err) {
    URL.revokeObjectURL(url)
    throw err
  }
}

/** 사진을 최대 1600px로 리사이즈하고 WebP(미지원 시 JPEG)로 압축한다. */
export async function compressImage(file: File | Blob): Promise<Blob> {
  const decoded = await decodeImage(file)
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(decoded.width, decoded.height))
    const width = Math.max(1, Math.round(decoded.width * scale))
    const height = Math.max(1, Math.round(decoded.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.')
    ctx.drawImage(decoded.source, 0, 0, width, height)

    // WebP 우선, 인코딩 미지원(일부 사파리 등)으로 null이면 JPEG로 폴백한다.
    const blob =
      (await toBlobAsync(canvas, 'image/webp', WEBP_QUALITY)) ??
      (await toBlobAsync(canvas, 'image/jpeg', JPEG_QUALITY))
    if (!blob) throw new Error('이미지 압축에 실패했습니다.')
    return blob
  } finally {
    decoded.release()
  }
}
