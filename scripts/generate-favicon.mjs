// Generates all favicon PNG sizes from an SVG template using sharp
import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// SVG: "ARC" text, #007AFF on white, clean and legible at small sizes
function makeSvg(size) {
  const isSmall = size <= 32
  const fontSize = isSmall ? Math.round(size * 0.48) : Math.round(size * 0.38)
  const letterSpacing = isSmall ? 0 : Math.round(size * 0.035)
  const radius = isSmall ? Math.round(size * 0.18) : Math.round(size * 0.14)
  const textY = isSmall ? Math.round(size * 0.665) : Math.round(size * 0.66)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#ffffff"/>
  <text
    x="${size / 2}"
    y="${textY}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="300"
    fill="#007AFF"
    text-anchor="middle"
    letter-spacing="${letterSpacing}"
  >ARC</text>
</svg>`
}

const sizes = [
  { name: 'favicon-16x16.png',          size: 16 },
  { name: 'favicon-32x32.png',          size: 32 },
  { name: 'apple-touch-icon.png',        size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
]

for (const { name, size } of sizes) {
  const svg = Buffer.from(makeSvg(size))
  const outPath = join(publicDir, name)
  await sharp(svg).png().toFile(outPath)
  console.log(`✓ ${name} (${size}x${size})`)
}

// favicon.ico = 32x32 PNG wrapped as ICO (modern browsers accept this)
const png32 = await sharp(Buffer.from(makeSvg(32))).png().toBuffer()
const ico = buildIco(png32)
writeFileSync(join(publicDir, 'favicon.ico'), ico)
console.log('✓ favicon.ico')

// Also write favicon.svg for modern browsers that support SVG favicons
writeFileSync(join(publicDir, 'favicon.svg'), makeSvg(32))
console.log('✓ favicon.svg')

// ── Minimal ICO builder (PNG-in-ICO, one image, 32x32) ──────────────────────
function buildIco(pngBuffer) {
  const size = 32
  const iconDirSize = 6
  const iconDirEntrySize = 16
  const imageOffset = iconDirSize + iconDirEntrySize

  const buf = Buffer.alloc(imageOffset + pngBuffer.length)

  // ICONDIR header
  buf.writeUInt16LE(0, 0)       // reserved
  buf.writeUInt16LE(1, 2)       // type: 1 = ICO
  buf.writeUInt16LE(1, 4)       // number of images

  // ICONDIRENTRY
  buf.writeUInt8(size, 6)       // width (0 = 256)
  buf.writeUInt8(size, 7)       // height
  buf.writeUInt8(0, 8)          // color count
  buf.writeUInt8(0, 9)          // reserved
  buf.writeUInt16LE(1, 10)      // color planes
  buf.writeUInt16LE(32, 12)     // bits per pixel
  buf.writeUInt32LE(pngBuffer.length, 14)  // image data size
  buf.writeUInt32LE(imageOffset, 18)       // offset to image data

  pngBuffer.copy(buf, imageOffset)
  return buf
}
