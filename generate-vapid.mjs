// Ejecutar una sola vez: node generate-vapid.mjs
// Guarda las claves como variables de entorno en Vercel

import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()
console.log('\n=== CLAVES VAPID (guardá esto!) ===')
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log('\nAgregá estas 3 variables en Vercel → Settings → Environment Variables')
console.log('La VITE_VAPID_PUBLIC_KEY también va en .env.local para desarrollo local\n')
