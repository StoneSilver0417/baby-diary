/** input type=file accept="image/*" multiple 만으로 안드로이드 시스템 Photo Picker(Android 13+,
 * 권한 불필요)가 그대로 뜨므로 별도 분기가 필요 없다. */
export async function pickPhotos(fileList: FileList): Promise<Blob[]> {
  return Array.from(fileList)
}
