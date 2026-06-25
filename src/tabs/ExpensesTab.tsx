import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CATEGORIES, IMPULSE_CATEGORIES } from '../constants/fixedExpenses'
import { spawnConfetti } from '../components/PetalAnimation'
import { ReceiptScanner } from '../components/ReceiptScanner'
import type { Expense } from '../lib/supabase'

type Props = {
  expenses:   Expense[]
  todayTotal: number
  criptoRate: number | null
  onAdd:      (e: Omit<Expense, 'date' | 'week_number' | 'month_label'>) => Promise<unknown>
  onDelete:   (id: string) => Promise<void>
}

const METHODS = [
  { id: 'debito_global', label: 'DolarApp USD',  labelKo: '달러앱 USD', color: '#1A7A6E' },
  { id: 'debito',        label: 'DolarApp ARS',  labelKo: '달러앱 ARS', color: '#2C5F8A' },
  { id: 'debito_bbva',   label: 'BBVA',          labelKo: 'BBVA',       color: '#C9920A' },
  { id: 'tarjeta',       label: 'Tarjeta cred.', labelKo: '신용카드',   color: '#C0392B' },
  { id: 'efectivo',      label: 'Efectivo',       labelKo: '현금',       color: '#9E8872' },
]

const INCOME_SOURCES = [
  { id: 'salary',   label: 'Salario',          labelKo: '급여'    },
  { id: 'loan_pay', label: 'Me devolvieron',   labelKo: '상환'    },
  { id: 'freelance',label: 'Freelance',        labelKo: '프리랜서' },
  { id: 'interest', label: 'Rendimientos',     labelKo: '수익'    },
  { id: 'other',    label: 'Otro ingreso',     labelKo: '기타'    },
]

export function ExpensesTab({ expenses, todayTotal, criptoRate, onAdd, onDelete }: Props) {
  const { t, i18n } = useTranslation()
  const isKo = i18n.language === 'ko'

  const [showScanner, setShowScanner] = useState(false)
  const [entryType, setEntryType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount]       = useState('')
  const [currency, setCurrency]   = useState<'ARS' | 'USD'>('ARS')
  const [desc, setDesc]           = useState('')
  const [cat, setCat]             = useState('food')
  const [incomeSource, setIncomeSrc] = useState('salary')
  const [method, setMethod]       = useState('debito')
  const [saving, setSaving]       = useState(false)
  const [impulseModal, setImpulseModal] = useState(false)
  const [impulseMsg, setImpulseMsg]     = useState('')
  const [pendingData, setPending]       = useState<Omit<Expense,'date'|'week_number'|'month_label'> | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const today = new Date().toISOString().split('T')[0]
  const todayExpenses = expenses.filter(e => e.date === today)
  const todayIncomes  = todayExpenses.filter(e => e.type === 'income')
  const todaySpends   = todayExpenses.filter(e => e.type !== 'income')

  const parseAmount = () => parseFloat(amount.replace(/\./g,'').replace(',','.'))

  const handleSave = async () => {
    const n = parseAmount()
    if (!n || n <= 0) return
    const cripto = criptoRate ?? undefined

    const amountArs = (entryType === 'income' && currency === 'USD' && cripto)
      ? n * cripto
      : entryType === 'income' && currency === 'USD'
        ? n * 1500
        : n

    const data: Omit<Expense,'date'|'week_number'|'month_label'> = {
      description: desc || (entryType === 'income'
        ? (INCOME_SOURCES.find(s => s.id === incomeSource)?.[isKo ? 'labelKo' : 'label'] ?? 'Ingreso')
        : (CATEGORIES.find(c => c.id === cat)?.labelEs ?? cat)),
      amount_ars:  entryType === 'income' ? -amountArs : amountArs,
      method:      method as Expense['method'],
      category:    entryType === 'income' ? incomeSource : cat,
      is_impulse:  false,
      type:        entryType,
      currency,
      usd_equiv:   cripto ? parseFloat((amountArs / cripto).toFixed(2)) : undefined,
      cripto_rate: cripto,
    }

    if (entryType === 'expense' && IMPULSE_CATEGORIES.includes(cat)) {
      setPending(data)
      setImpulseModal(true)
      return
    }
    await doSave(data, false)
  }

  const doSave = async (data: Omit<Expense,'date'|'week_number'|'month_label'>, isImpulse: boolean) => {
    setSaving(true)
    await onAdd({ ...data, is_impulse: isImpulse })
    setSaving(false)
    setAmount('')
    setDesc('')
    setCat('food')
    setIncomeSrc('salary')
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      spawnConfetti(r.left + r.width / 2, r.top)
    }
  }

  const confirmImpulse = async (isImpulse: boolean) => {
    if (!pendingData) return
    if (isImpulse) setImpulseMsg(isKo ? '저장됐어요 😊 괜찮아요, 화이팅!' : t('impulse_saved'))
    setImpulseModal(false)
    await doSave(pendingData, isImpulse)
    setPending(null)
    if (isImpulse) setTimeout(() => setImpulseMsg(''), 3000)
  }

  const fmtARS = (n: number) => `$${Math.abs(n).toLocaleString('es-AR')}`

  // Resumen del día
  const incomeTotalArs = todayIncomes.reduce((s, e) => s + Math.abs(e.amount_ars), 0)
  const spendTotalArs  = todaySpends.reduce((s, e) => s + e.amount_ars, 0)
  const balance        = incomeTotalArs - spendTotalArs

  return (
    <div className="tab-scroll h-full pb-24 px-4 pt-2 space-y-4">

      {/* Botón escáner */}
      <button
        onClick={() => setShowScanner(true)}
        className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-1"
        style={{ background: 'linear-gradient(135deg, #2D2417, #5C4A3A)', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        📋 Escanear comprobante / transferencia
      </button>

      {/* Toggle Gasto / Ingreso */}
      <div className="flex gap-2">
        <button
          onClick={() => setEntryType('expense')}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: entryType === 'expense' ? '#C0392B' : '#F0E8D5',
            color:      entryType === 'expense' ? 'white'   : '#9E8872',
            border: 'none', cursor: 'pointer',
          }}
        >
          📤 {isKo ? '지출' : 'Gasto'}
        </button>
        <button
          onClick={() => setEntryType('income')}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: entryType === 'income' ? '#1A7A6E' : '#F0E8D5',
            color:      entryType === 'income' ? 'white'   : '#9E8872',
            border: 'none', cursor: 'pointer',
          }}
        >
          📥 {isKo ? '수입' : 'Ingreso'}
        </button>
      </div>

      {/* Form */}
      <div className="card space-y-4">

        {/* Monto + moneda */}
        <div>
          <label className="text-xs font-semibold" style={{ color: '#9E8872' }}>
            {entryType === 'income' ? '💵 ¿Cuánto te ingresó?' : '💴 ¿Cuánto gastaste?'}
          </label>
          <div className="flex gap-2 mt-1">
            <input
              className="hana-input text-2xl font-black"
              style={{ fontFamily: 'Inter', flex: 1 }}
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            {/* Toggle ARS/USD solo para ingresos */}
            {entryType === 'income' && (
              <div className="flex flex-col gap-1">
                {(['ARS','USD'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className="method-chip"
                    style={{
                      background: currency === c ? '#1A7A6E' : '#F0E8D5',
                      color:      currency === c ? 'white'   : '#9E8872',
                      border: 'none', cursor: 'pointer', padding: '0.3rem 0.7rem',
                    }}
                  >{c}</button>
                ))}
              </div>
            )}
          </div>
          {amount && criptoRate && (
            <p className="text-xs mt-1" style={{ color: '#9E8872', fontFamily: 'Inter' }}>
              {entryType === 'income' && currency === 'USD'
                ? `≈ $${(parseAmount() * criptoRate).toLocaleString('es-AR')} ARS`
                : `≈ USD ${(parseAmount() / criptoRate).toFixed(2)}`}
            </p>
          )}
        </div>

        {/* Fuente de ingreso o categoría */}
        {entryType === 'income' ? (
          <div>
            <label className="text-xs font-semibold" style={{ color: '#9E8872' }}>📋 Origen</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {INCOME_SOURCES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setIncomeSrc(s.id)}
                  className="py-1.5 px-3 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: incomeSource === s.id ? '#1A7A6E' : '#F0E8D5',
                    color:      incomeSource === s.id ? 'white'   : '#9E8872',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  {isKo ? s.labelKo : s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold" style={{ color: '#9E8872' }}>🏷️ {t('category')}</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  className={`cat-btn ${cat === c.id ? 'selected' : ''}`}
                  onClick={() => setCat(c.id)}
                >
                  <span>{c.emoji}</span>
                  <p>{isKo ? c.labelKo : c.labelEs}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Descripción */}
        <div>
          <label className="text-xs font-semibold" style={{ color: '#9E8872' }}>📝 Descripción (opcional)</label>
          <input
            className="hana-input mt-1"
            placeholder={entryType === 'income' ? 'Ej: Devolución de Juan, salario julio...' : t('description_placeholder')}
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        {/* Método de pago */}
        <div>
          <label className="text-xs font-semibold" style={{ color: '#9E8872' }}>💳 {t('payment_method')}</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className="py-1 px-3 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: method === m.id ? m.color : '#F0E8D5',
                  color:      method === m.id ? 'white'  : '#9E8872',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {isKo ? m.labelKo : m.label}
              </button>
            ))}
          </div>
        </div>

        <button
          ref={btnRef}
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || !amount}
          style={{ background: entryType === 'income' ? 'linear-gradient(135deg, #1A7A6E, #145f55)' : undefined }}
        >
          {saving ? '…' : entryType === 'income'
            ? `✓ ${isKo ? '수입 저장' : 'Guardar ingreso'}`
            : `✓ ${t('save_expense')}`}
        </button>

        {impulseMsg && (
          <p className="text-center text-sm font-semibold" style={{ color: '#1A7A6E' }}>{impulseMsg}</p>
        )}
      </div>

      {/* Resumen del día */}
      {todayExpenses.length > 0 && (
        <div className="card" style={{ background: balance >= 0 ? '#F0FFF7' : '#FFF5F5' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#9E8872' }}>
            {isKo ? '오늘 요약' : 'Resumen de hoy'}
          </p>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#1A7A6E', fontWeight: 700 }}>
              📥 {fmtARS(incomeTotalArs)} ARS
            </span>
            <span style={{ color: '#C0392B', fontWeight: 700 }}>
              📤 {fmtARS(spendTotalArs)} ARS
            </span>
            <span style={{ color: balance >= 0 ? '#1A7A6E' : '#C0392B', fontWeight: 800, fontFamily: 'Inter' }}>
              = {balance >= 0 ? '+' : ''}{balance.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      )}

      {/* Lista del día */}
      {todayExpenses.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: '#9E8872' }}>
            {isKo ? '오늘' : 'Hoy'} — {isKo ? '합계' : 'Gastos'}: <span style={{ fontFamily: 'Inter', fontWeight: 800, color: '#2D2417' }}>{fmtARS(todayTotal)}</span>
          </p>
          <div className="space-y-2">
            {todayExpenses.map(e => {
              const c    = CATEGORIES.find(x => x.id === e.category)
              const meth = METHODS.find(m => m.id === e.method)
              const isIncome = e.type === 'income'
              return (
                <div
                  key={e.id}
                  className="card flex items-center gap-3 py-3"
                  style={{ padding: '0.75rem 1rem', borderLeft: `3px solid ${isIncome ? '#1A7A6E' : '#E8899A'}` }}
                >
                  <span style={{ fontSize: '1.3rem' }}>{isIncome ? '📥' : (c?.emoji ?? '❓')}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm" style={{ color: '#2D2417' }}>{e.description}</p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {meth && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${meth.color}20`, color: meth.color }}>
                          {isKo ? meth.labelKo : meth.label}
                        </span>
                      )}
                      {e.currency && e.currency !== 'ARS' && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#FFF3CD', color: '#856404' }}>
                          {e.currency}
                        </span>
                      )}
                      {e.is_impulse && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#FFF3CD', color: '#856404' }}>
                          💭 impulso
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-base" style={{ fontFamily: 'Inter', color: isIncome ? '#1A7A6E' : '#2D2417' }}>
                      {isIncome ? '+' : ''}{fmtARS(e.amount_ars)}
                    </p>
                    {e.usd_equiv && (
                      <p className="text-xs" style={{ color: '#9E8872' }}>USD {e.usd_equiv}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(e.id!)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E8899A', padding: '4px', fontSize: '1rem' }}
                  >✕</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal impulso */}
      {impulseModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ background: 'rgba(45,36,23,0.4)' }}>
          <div className="card w-full max-w-sm text-center" style={{ background: '#FBF5E6' }}>
            <p className="text-2xl mb-2">🌸</p>
            <p className="font-serif text-lg font-bold mb-1" style={{ color: '#2D2417' }}>
              {isKo ? '잠깐...' : 'Un momento...'}
            </p>
            <p className="text-sm mb-4" style={{ color: '#5C4A3A' }}>{t('impulse_question')}</p>
            <button className="btn-primary mb-2" onClick={() => confirmImpulse(false)}>{t('impulse_yes')}</button>
            <button onClick={() => confirmImpulse(true)}
              style={{ background: 'none', border: 'none', color: '#9E8872', cursor: 'pointer', width: '100%', padding: '0.6rem', fontWeight: 600 }}>
              {t('impulse_no')}
            </button>
          </div>
        </div>
      )}

      {/* Scanner de comprobantes */}
      {showScanner && (
        <ReceiptScanner
          onResult={(amount, description) => {
            if (amount) setAmount(String(Math.round(amount)))
            if (description) setDesc(description)
            setShowScanner(false)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Modal borrado */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ background: 'rgba(45,36,23,0.4)' }}>
          <div className="card w-full max-w-xs text-center" style={{ background: '#FBF5E6' }}>
            <p className="font-semibold mb-4" style={{ color: '#2D2417' }}>{t('confirm_delete')}</p>
            <div className="flex gap-3">
              <button className="flex-1 py-2 rounded-xl font-semibold"
                style={{ background: '#F0E8D5', border: 'none', cursor: 'pointer', color: '#9E8872' }}
                onClick={() => setDeleteConfirm(null)}>
                {t('cancel')}
              </button>
              <button className="flex-1 py-2 rounded-xl font-semibold"
                style={{ background: '#E53E3E', border: 'none', cursor: 'pointer', color: 'white' }}
                onClick={async () => { await onDelete(deleteConfirm); setDeleteConfirm(null) }}>
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
