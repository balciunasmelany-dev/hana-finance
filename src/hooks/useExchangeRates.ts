import { useState, useEffect } from 'react'
import { fetchDolarRates, DolarRate, getManualDolarApp, setManualDolarApp } from '../lib/dolarapi'

export function useExchangeRates() {
  const [rates, setRates]           = useState<DolarRate[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [lastUpdate, setLast]       = useState<Date | null>(null)
  const [manualRate, setManualRate] = useState<number | null>(getManualDolarApp)

  const load = async () => {
    try {
      setLoading(true)
      const data = await fetchDolarRates()
      setRates(data)
      setLast(new Date())
      setError(null)
    } catch {
      setError('Sin conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateManualRate = (rate: number | null) => {
    setManualDolarApp(rate)
    setManualRate(rate)
  }

  const getCripto = (): number | null => {
    if (manualRate) return manualRate
    return rates.find(r => r.casa === 'cripto')?.venta ?? null
  }

  const getEffectiveRates = (): DolarRate[] => {
    if (!manualRate) return rates
    return rates.map(r =>
      r.casa === 'cripto' ? { ...r, venta: manualRate, compra: manualRate } : r
    )
  }

  const getBest = () => {
    const effective = getEffectiveRates()
    if (!effective.length) return null
    return effective.reduce((best, r) => {
      if (!r.venta) return best
      if (!best || r.venta < best.venta!) return r
      return best
    }, null as DolarRate | null)
  }

  return {
    rates: getEffectiveRates(),
    loading, error, lastUpdate,
    reload: load,
    getCripto, getBest,
    manualRate, updateManualRate,
  }
}
