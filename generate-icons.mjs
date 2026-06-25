import { writeFileSync } from 'fs'

const svg = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo hanji cream -->
  <rect width="512" height="512" rx="${size * 0.18}" fill="#FBF5E6"/>

  <!-- Pétalos de cerezo (5) -->
  <g transform="translate(256,220)">
    <ellipse cx="0" cy="-72" rx="38" ry="62" fill="#FFB7C5" opacity="0.95" transform="rotate(0)"/>
    <ellipse cx="0" cy="-72" rx="38" ry="62" fill="#FFB7C5" opacity="0.95" transform="rotate(72)"/>
    <ellipse cx="0" cy="-72" rx="38" ry="62" fill="#FFB7C5" opacity="0.95" transform="rotate(144)"/>
    <ellipse cx="0" cy="-72" rx="38" ry="62" fill="#FFB7C5" opacity="0.95" transform="rotate(216)"/>
    <ellipse cx="0" cy="-72" rx="38" ry="62" fill="#FFB7C5" opacity="0.95" transform="rotate(288)"/>
    <!-- Centro dorado -->
    <circle cx="0" cy="0" r="30" fill="#C9920A"/>
    <!-- Signo $ en el centro -->
    <text x="0" y="11" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="bold" fill="#FBF5E6">$</text>
  </g>

  <!-- Texto 하나 abajo -->
  <text x="256" y="390" text-anchor="middle" font-family="Georgia, serif" font-size="72" font-weight="bold" fill="#C0392B" opacity="0.9">하나</text>

  <!-- Línea decorativa -->
  <line x1="140" y1="410" x2="372" y2="410" stroke="#E8899A" stroke-width="3" opacity="0.5"/>

  <!-- Pequeños puntos decorativos -->
  <circle cx="256" cy="440" r="5" fill="#C9920A" opacity="0.6"/>
  <circle cx="236" cy="440" r="3" fill="#FFB7C5" opacity="0.6"/>
  <circle cx="276" cy="440" r="3" fill="#FFB7C5" opacity="0.6"/>
</svg>`

// Guardar SVG
writeFileSync('public/icon.svg', svg(512))
console.log('✅ SVG guardado en public/icon.svg')
console.log('')
console.log('Para convertir a PNG, instalá sharp y ejecutá:')
console.log('  npm install sharp --save-dev')
console.log('  node convert-icons.mjs')
