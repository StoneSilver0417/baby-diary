const MAX_DIMENSION = 1600
const WEBP_QUALITY = 0.8

export async function compressImage(file: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
  )
  if (!blob) throw new Error('이미지 압축에 실패했습니다.')
  return blob
}
