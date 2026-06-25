import { useState, useRef } from 'react'
import { createWorker } from 'tesseract.js'

type Props = {
  onResult: (amount: number | null, description: string) => void
  onClose:  () => void
}

function extractAmount(text: string): number | null {
  // Busca patrones como $1.500, $ 1500, 1500.00, 1.500,00
  const patterns = [
    /\$\s*([\d.,]+)/g,
    /total[:\s]*([\d.,]+)/gi,
    /importe[:\s]*([\d.,]+)/gi,
    /monto[:\s]*([\d.,]+)/gi,
    /amount[:\s]*([\d.,]+)/gi,
  ]

  const candidates: number[] = []

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1].replace(/\./g, '').replace(',', '.')
      const n   = parseFloat(raw)
      if (n > 0 && n < 100_000_000) candidates.push(n)
    }
  }

  if (!candidates.length) return null
  // Devolver el más grande (suele ser el total)
  return Math.max(...candidates)
}

function extractDescription(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3)
  // Buscar líneas que parezcan nombres de comercio o concepto
  const skip = /^\d+$|fecha|date|hora|ticket|compro|iva|^[$]/i
  const useful = lines.filter(l => !skip.test(l)).slice(0, 3)
  return useful[0] ?? ''
}

export function ReceiptScanner({ onResult, onClose }: Props) {
  const [status, setStatus]   = useState<'idle' | 'reading' | 'done' | 'error'>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const camRef  = useRef<HTMLInputElement>(null)

  const processImage = async (file: File) => {
    setStatus('reading')
    setProgress(0)
    const url = URL.createObjectURL(file)
    setPreview(url)

    try {
      const worker = await createWorker('spa+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100))
        }
      })
      const { data: { text } } = await worker.recognize(url)
      await worker.terminate()

      const amount = extractAmount(text)
      const desc   = extractDescription(text)
      setStatus('done')
      onResult(amount, desc)
    } catch {
      setStatus('error')
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(45,36,23,0.92)' }}
    >
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <p className="font-serif font-bold text-lg text-white">📋 Escanear comprobante</p>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
        >✕</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">

        {/* Preview imagen */}
        {preview && (
          <div className="w-full rounded-2xl overflow-hidden" style={{ maxHeight: 260 }}>
            <img src={preview} alt="comprobante" style={{ width: '100%', objectFit: 'contain', maxHeight: 260 }} />
          </div>
        )}

        {/* Estado */}
        {status === 'reading' && (
          <div className="w-full">
            <p className="text-white text-center text-sm mb-2">
              Leyendo comprobante... {progress}%
            </p>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${progress}%`, background: '#FFB7C5' }}
              />
            </div>
          </div>
        )}

        {status === 'done' && (
          <p className="text-white text-center text-sm" style={{ color: '#00C47D' }}>
            ✅ ¡Listo! Revisá el monto en el formulario
          </p>
        )}

        {status === 'error' && (
          <p className="text-center text-sm" style={{ color: '#FFB7C5' }}>
            No pude leer el texto. Intentá con otra imagen más clara.
          </p>
        )}

        {/* Botones */}
        {status === 'idle' || status === 'error' ? (
          <div className="w-full space-y-3 mt-4">
            {/* Subir imagen / captura de pantalla */}
            <button
              className="btn-primary"
              onClick={() => fileRef.current?.click()}
            >
              🖼️ Subir imagen o captura
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFile}
            />

            {/* Cámara */}
            <button
              onClick={() => camRef.current?.click()}
              className="w-full py-3 rounded-2xl font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
            >
              📷 Sacar foto ahora
            </button>
            <input
              ref={camRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFile}
            />

            <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              El texto se lee en tu celu, no se sube a ningún servidor
            </p>
          </div>
        ) : status === 'done' ? (
          <button
            className="btn-primary mt-2"
            onClick={onClose}
          >
            ✓ Ver formulario
          </button>
        ) : null}
      </div>
    </div>
  )
}
