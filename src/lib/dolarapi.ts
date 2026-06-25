export type DolarRate = {
  casa:      string
  nombre:    string
  compra:    number | null
  venta:     number | null
  fechaActualizacion: string
}

const CACHE_KEY = 'hana_dolar_cache'
const CACHE_TTL = 5 * 60 * 1000

export async function fetchDolarRates(): Promise<DolarRate[]> {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const { ts, data } = JSON.parse(cached)
    if (Date.now() - ts < CACHE_TTL) return data
  }

  const [dolaresRes, dolarappRes] = await Promise.all([
    fetch('https://dolarapi.com/v1/dolares'),
    fetch('https://dolarapi.com/v1/exchanges/dolarapp/usd').catch(() => null),
  ])

  const data = await dolaresRes.json() as DolarRate[]

  // Reemplazar la cotización cripto con la de DolarApp real
  if (dolarappRes?.ok) {
    const dolarappData = await dolarappRes.json() as Array<{ compra: number; venta: number }>
    if (dolarappData[0]) {
      const idx = data.findIndex(r => r.casa === 'cripto')
      if (idx >= 0) {
        data[idx] = {
          ...data[idx],
          compra: dolarappData[0].compra,
          venta:  dolarappData[0].venta,
          nombre: 'DolarApp',
        }
      }
    }
  }

  localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  return data
}

export function getRateByName(rates: DolarRate[], casa: string): DolarRate | undefined {
  return rates.find(r => r.casa.toLowerCase() === casa.toLowerCase())
}

export const RATE_ORDER: { casa: string; label: string; labelKo: string }[] = [
  { casa: 'cripto',   label: 'DolarApp / Cripto', labelKo: '크립토'  },
  { casa: 'bolsa',    label: 'MEP',               labelKo: 'MEP'     },
  { casa: 'blue',     label: 'Blue',              labelKo: '블루'    },
  { casa: 'oficial',  label: 'Oficial',           labelKo: '공식'    },
  { casa: 'tarjeta',  label: 'Tarjeta',           labelKo: '카드'    },
]

const MANUAL_RATE_KEY = 'hana_manual_dolarapp'

export function getManualDolarApp(): number | null {
  const v = localStorage.getItem(MANUAL_RATE_KEY)
  return v ? parseFloat(v) : null
}

export function setManualDolarApp(rate: number | null) {
  if (rate) localStorage.setItem(MANUAL_RATE_KEY, String(rate))
  else localStorage.removeItem(MANUAL_RATE_KEY)
}
