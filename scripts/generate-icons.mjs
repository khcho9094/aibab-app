// scripts/generate-icons.mjs
import sharp from 'sharp'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#f97316"/>
  <text x="256" y="360" font-size="300" text-anchor="middle" font-family="Arial, sans-serif">🍚</text>
</svg>`

const buf = Buffer.from(svg)

await sharp(buf).resize(192, 192).png().toFile('public/icon-192.png')
console.log('✓ icon-192.png')

await sharp(buf).resize(512, 512).png().toFile('public/icon-512.png')
console.log('✓ icon-512.png')

console.log('아이콘 생성 완료')
