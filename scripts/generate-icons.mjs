import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const svgPath = path.join(root, 'src/assets/app-icon.svg')
const outDir = path.join(root, 'public/icons')

const svg = readFileSync(svgPath)

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'maskable-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
]

await mkdir(outDir, { recursive: true })

for (const { file, size } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, file))
  console.log(`생성: public/icons/${file} (${size}x${size})`)
}

// 파비콘은 public/ 루트에 직접 생성 (기존 vite 스캐폴드 favicon.svg 대체)
await sharp(svg, { density: 384 })
  .resize(32, 32)
  .png()
  .toFile(path.join(root, 'public/favicon.png'))
console.log('생성: public/favicon.png (32x32)')

// Capacitor(@capacitor/assets)용 소스 — assets/icon.png(1024), assets/splash.png(2732)
const assetsDir = path.join(root, 'assets')
await mkdir(assetsDir, { recursive: true })

await sharp(svg, { density: 384 })
  .resize(1024, 1024)
  .png()
  .toFile(path.join(assetsDir, 'icon.png'))
console.log('생성: assets/icon.png (1024x1024)')

// 스플래시: 아이콘과 같은 코랄 배경(#d97757) 위에 아이콘을 축소해 중앙 배치 — 배경색이 동일해 이음매가 안 보임
const splashSize = 2732
const iconOnSplash = Math.round(splashSize * 0.6)
const iconBuffer = await sharp(svg, { density: 384 }).resize(iconOnSplash, iconOnSplash).png().toBuffer()
await sharp({
  create: {
    width: splashSize,
    height: splashSize,
    channels: 4,
    background: '#d97757',
  },
})
  .composite([{ input: iconBuffer, gravity: 'center' }])
  .png()
  .toFile(path.join(assetsDir, 'splash.png'))
console.log('생성: assets/splash.png (2732x2732)')
