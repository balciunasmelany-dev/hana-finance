import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'

// Cuando el SW cambia de versión → recargar la página automáticamente
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

registerSW({
  immediate: true,
  onNeedRefresh() {
    // Enviar señal al nuevo SW para que active y dispare controllerchange
    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' })
  },
  onOfflineReady() {},
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
