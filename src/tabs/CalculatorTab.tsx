import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchDolarRates, RATE_ORDER, DolarRate } from '../lib/dolarapi'

const HISTORY_KEY = 'hana_calc_history'

type Conversion = { amount: number; direction: 'ARS→USD' | 'USD→ARS'; results: Record<string, number>; ts: number }

function loadHistory(): Conversion[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]').slice(0, 3) } catch { return [] }
}

function saveHistory(c: Conversion) {
  const h = loadHistory()
  localStorage.setItem(HISTORY_KEY, JSON.stringify([c, ...h].slice(0, 3)))
}

export function CalculatorTab() {
  const { t, i18n } = useTranslation()
  const isKo = i18n.language === 'ko'

  const [rates, setRates]       = useState<DolarRate[]>([])
  const [input, setInput]       = useState('')
  const [dir, setDir]           = useState<'ARS→USD' | 'USD→ARS'>('ARS→USD')
  const [history, setHistory]   = useState<Conversion[]>(loadHistory)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchDolarRates().then(r => { setRates(r); setLoading(false) })
  }, [])

  const amount = parseFloat(input.replace(/\./g,'').replace(',','.')) || 0

  const convert = useCallback((rate: DolarRate | undefined): number | null => {
    if (!rate?.venta || !amount) return null
    return dir === 'ARS→USD' ? amount / rate.venta : amount * rate.venta
  }, [amount, dir])

  // Guardar historial con debounce
  useEffect(() => {
    if (!amount || !rates.length) return
    const id = setTimeout(() => {
      const results: Record<string, number> = {}
      RATE_ORDER.forEach(r => {
        const rate = rates.find(x => x.casa === r.casa)
        const val  = convert(rate)
        if (val) results[r.casa] = val
      })
      if (Object.keys(results).length) {
        const c: Conversion = { amount, direction: dir, results, ts: Date.now() }
        saveHistory(c)
        setHistory(loadHistory())
      }
    }, 800)
    return () => clearTimeout(id)
  }, [amount, dir, rates, convert])

  const best = (() => {
    if (!rates.length || !amount) return null
    let bestRate: DolarRate | null = null
    RATE_ORDER.forEach(r => {
      const rate = rates.find(x => x.casa === r.casa)
      if (!rate?.venta) return
      if (!bestRate || (dir === 'ARS→USD' ? rate.venta < bestRate.venta! : rate.venta > bestRate.venta!)) {
        bestRate = rate
      }
    })
    return bestRate as DolarRate | null
  })()

  const tipMsg = (() => {
    if (!best || !amount) return null
    const bestLabel = RATE_ORDER.find(r => r.casa === best.casa)
    if (!bestLabel) return null
    const name = isKo ? bestLabel.labelKo : bestLabel.label
    if (dir === 'ARS→USD') {
      return isKo
        ? `💡 ${name}이 오늘 최고 옵션이에요.`
        : `💡 ${name} es tu mejor opción hoy.`
    }
    const val = best.venta ? (amount * best.venta).toLocaleString('es-AR') : '–'
    return isKo
      ? `💡 ${name}에서 $${val} ARS 받아요.`
      : `💡 Con ${name} recibís $${val} ARS.`
  })()

  return (
    <div className="tab-scroll h-full pb-24 px-4 pt-2 space-y-4">
      <div className="card space-y-4">
        {/* Dirección */}
        <div className="flex gap-2">
          {(['ARS→USD', 'USD→ARS'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDir(d)}
              className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: dir === d ? '#1A7A6E' : '#F0E8D5',
                color:      dir === d ? 'white'   : '#9E8872',
                border:     'none', cursor: 'pointer'
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Input */}
        <div>
          <input
            className="hana-input text-3xl font-black text-center"
            style={{ fontFamily: 'Inter' }}
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <p className="text-center text-xs mt-1" style={{ color: '#9E8872' }}>
            {dir === 'ARS→USD' ? 'ARS' : 'USD'}
          </p>
        </div>

        {/* Resultados */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F0E8D5' }}>
          {RATE_ORDER.map((r, i) => {
            const rate = rates.find(x => x.casa === r.casa)
            const val  = convert(rate)
            const isBest = rate?.casa === best?.casa
            return (
              <div
                key={r.casa}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: isBest ? '#F0FFF7' : (i % 2 === 0 ? '#FBF5E6' : '#F7F1E3'),
                  borderBottom: i < RATE_ORDER.length - 1 ? '1px solid #F0E8D5' : 'none',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: '#5C4A3A' }}>
                    {isKo ? r.labelKo : r.label}
                  </span>
                  {isBest && amount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#00C47D', color: 'white' }}>
                      ⭐ {isKo ? t('best_rate') : t('best_rate')}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {loading ? (
                    <span style={{ color: '#9E8872', fontSize: '0.85rem' }}>…</span>
                  ) : (
                    <>
                      <p className="font-black text-base" style={{ fontFamily: 'Inter', color: '#2D2417' }}>
                        {val != null ? val.toLocaleString('es-AR', { maximumFractionDigits: 2 }) : '–'}
                      </p>
                      <p className="text-xs" style={{ color: '#9E8872' }}>
                        {rate?.venta ? `1 ${dir === 'ARS→USD' ? 'USD' : 'ARS'} = ${dir === 'ARS→USD' ? rate.venta : (1/rate.venta).toFixed(4)}` : '–'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {tipMsg && (
          <p className="text-sm font-semibold text-center px-2" style={{ color: '#1A7A6E' }}>{tipMsg}</p>
        )}
      </div>

      {/* Historial */}
      {history.length > 0 && (
        <div className="card">
          <p className="text-xs font-semibold mb-3" style={{ color: '#9E8872' }}>
            🕐 {isKo ? '최근 환산' : 'Últimas conversiones'}
          </p>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span style={{ color: '#5C4A3A', fontFamily: 'Inter' }}>
                  {h.direction === 'ARS→USD'
                    ? `$${h.amount.toLocaleString('es-AR')} ARS`
                    : `USD ${h.amount.toLocaleString('es-AR')}`}
                </span>
                <span style={{ color: '#9E8872', fontSize: '0.75rem' }}>
                  {new Date(h.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
