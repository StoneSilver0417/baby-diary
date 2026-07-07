import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const iconPath = path.join(root, 'src/assets/app-icon.png')
const outDir = path.join(root, 'public/icons')

const source = readFileSync(iconPath)
// 소스 이미지 배경(다크 네이비)에 맞춰 스플래시·마스커블 안전영역 배경을 통일 — 이음매 방지
const bgColor = '#3c3a42'

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

await mkdir(outDir, { recursive: true })

for (const { file, size } of targets) {
  await sharp(source).resize(size, size).png().toFile(path.join(outDir, file))
  console.log(`생성: public/icons/${file} (${size}x${size})`)
}

// 마스커블 아이콘: OS가 원형 등으로 마스킹해도 잘리지 않도록 80% 크기로 축소해 중앙 배치
const maskableSize = 512
const maskableIconSize = Math.round(maskableSize * 0.8)
const maskableIconBuffer = await sharp(source)
  .resize(maskableIconSize, maskableIconSize)
  .png()
  .toBuffer()
await sharp({
  create: { width: maskableSize, height: maskableSize, channels: 4, background: bgColor },
})
  .composite([{ input: maskableIconBuffer, gravity: 'center' }])
  .png()
  .toFile(path.join(outDir, 'maskable-512.png'))
console.log('생성: public/icons/maskable-512.png (512x512, 80% 안전영역)')

// 파비콘은 public/ 루트에 직접 생성
await sharp(source).resize(32, 32).png().toFile(path.join(root, 'public/favicon.png'))
console.log('생성: public/favicon.png (32x32)')

// Capacitor(@capacitor/assets)용 소스 — assets/icon.png(1024), assets/splash.png(2732)
const assetsDir = path.join(root, 'assets')
await mkdir(assetsDir, { recursive: true })

await sharp(source).resize(1024, 1024).png().toFile(path.join(assetsDir, 'icon.png'))
console.log('생성: assets/icon.png (1024x1024)')

// 스플래시: 아이콘과 같은 배경색 위에 아이콘을 축소해 중앙 배치 — 배경색이 동일해 이음매가 안 보임
const splashSize = 2732
const iconOnSplash = Math.round(splashSize * 0.6)
const iconBuffer = await sharp(source).resize(iconOnSplash, iconOnSplash).png().toBuffer()
await sharp({
  create: { width: splashSize, height: splashSize, channels: 4, background: bgColor },
})
  .composite([{ input: iconBuffer, gravity: 'center' }])
  .png()
  .toFile(path.join(assetsDir, 'splash.png'))
console.log('생성: assets/splash.png (2732x2732)')
