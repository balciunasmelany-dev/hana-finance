// Saldo disponible y estado de pagos de gastos fijos

const BALANCE_KEY = 'hana_balance'
const PAID_KEY    = 'hana_paid_fixed'

export type Balance = {
  ars:     number   // DolarApp ARS + BBVA (gastos corrientes)
  usd:     number   // DolarApp USD corriente (gastos en USD)
  savings: number   // DolarApp ahorro/USDT (no se toca)
  updatedAt: string
}

export function loadBalance(): Balance {
  try {
    const s = localStorage.getItem(BALANCE_KEY)
    if (s) return JSON.parse(s)
  } catch {}
  return { ars: 0, usd: 0, savings: 0, updatedAt: '' }
}

export function saveBalance(b: Balance) {
  localStorage.setItem(BALANCE_KEY, JSON.stringify({ ...b, updatedAt: new Date().toISOString() }))
}

// Pagos de fijos: guardamos { name → currency } para saber de dónde descontar
function paidKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export type PaidMap = Record<string, 'ARS' | 'USD'>  // name → moneda pagada

export function loadPaidFixed(): PaidMap {
  try {
    const s = localStorage.getItem(`${PAID_KEY}:${paidKey()}`)
    if (s) return JSON.parse(s)
  } catch {}
  return {}
}

export function markPaid(name: string, currency: 'ARS' | 'USD' | null): PaidMap {
  const current = loadPaidFixed()
  if (currency) current[name] = currency
  else delete current[name]
  localStorage.setItem(`${PAID_KEY}:${paidKey()}`, JSON.stringify(current))
  return current
}

export function isPaid(paid: PaidMap, name: string): boolean {
  return name in paid
}
