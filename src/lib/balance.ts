// Saldo disponible y estado de pagos de gastos fijos

const BALANCE_KEY = 'hana_balance'
const PAID_KEY    = 'hana_paid_fixed'

export type Balance = {
  ars: number
  usd: number
  updatedAt: string
}

export function loadBalance(): Balance {
  try {
    const s = localStorage.getItem(BALANCE_KEY)
    if (s) return JSON.parse(s)
  } catch {}
  return { ars: 0, usd: 0, updatedAt: '' }
}

export function saveBalance(b: Balance) {
  localStorage.setItem(BALANCE_KEY, JSON.stringify({ ...b, updatedAt: new Date().toISOString() }))
}

// Pagos de fijos: key = "YYYY-MM:nombre"
function paidKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function loadPaidFixed(): Set<string> {
  try {
    const s = localStorage.getItem(`${PAID_KEY}:${paidKey()}`)
    if (s) return new Set(JSON.parse(s))
  } catch {}
  return new Set()
}

export function markPaid(name: string, paid: boolean): Set<string> {
  const current = loadPaidFixed()
  if (paid) current.add(name)
  else current.delete(name)
  localStorage.setItem(`${PAID_KEY}:${paidKey()}`, JSON.stringify([...current]))
  return current
}
