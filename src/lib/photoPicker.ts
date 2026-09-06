export async function pickPhotos(fileList: FileList | File[] | null | undefined): Promise<Blob[]> {
  if (!fileList) return []
  return Array.from(fileList).filter((file) => file && file.size > 0)
}
