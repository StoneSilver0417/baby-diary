/**
 * 웹 <input type=file>과 Capacitor 네이티브 픽커를 동일한 인터페이스로 통일.
 * Capacitor 도입(10단계) 시 Capacitor.isNativePlatform() 분기를 이 파일에 추가한다.
 */
export async function pickPhotos(fileList: FileList): Promise<Blob[]> {
  return Array.from(fileList)
}
