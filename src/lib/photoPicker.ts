/**
 * Capacitor Android WebView는 <input type=file accept="image/*" multiple">을 만나면
 * 시스템 Photo Picker(Android 13+, 권한 불필요)를 그대로 띄운다 — 네이티브 분기 불필요 확인됨.
 * 카메라 직접 촬영이 필요해지면 그때 @capacitor/camera 플러그인 도입을 검토한다.
 */
export async function pickPhotos(fileList: FileList): Promise<Blob[]> {
  return Array.from(fileList)
}
