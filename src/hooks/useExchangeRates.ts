import { useState, useEffect } from 'react'
import { fetchDolarRates, DolarRate } from '../lib/dolarapi'

export function useExchangeRates() {
  const [rates, setRates]       = useState<DolarRate[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [lastUpdate, setLast]   = useState<Date | null>(null)

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

  const getCripto = () => rates.find(r => r.casa === 'cripto')?.venta ?? null
  const getBest   = () => {
    if (!rates.length) return null
    return rates.reduce((best, r) => {
      if (!r.venta) return best
      if (!best || r.venta < best.venta!) return r
      return best
    }, null as DolarRate | null)
  }

  return { rates, loading, error, lastUpdate, reload: load, getCripto, getBest }
}
