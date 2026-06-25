import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CATEGORIES, IMPULSE_CATEGORIES } from '../constants/fixedExpenses'
import { spawnConfetti } from '../components/PetalAnimation'
import type { Expense } from '../lib/supabase'

type Props = {
  expenses:      Expense[]
  todayTotal:    number
  criptoRate:    number | null
  onAdd:         (e: Omit<Expense, 'date' | 'week_number' | 'month_label'>) => Promise<unknown>
  onDelete:      (id: string) => Promise<void>
}

export function ExpensesTab({ expenses, todayTotal, criptoRate, onAdd, onDelete }: Props) {
  const { t, i18n } = useTranslation()
  const isKo = i18n.language === 'ko'

  const [amount, setAmount]     = useState('')
  const [desc, setDesc]         = useState('')
  const [cat, setCat]           = useState('food')
  const [method, setMethod]     = useState<'debito' | 'tarjeta'>('debito')
  const [saving, setSaving]     = useState(false)
  const [impulseModal, setImpulseModal] = useState(false)
  const [impulseMsg, setImpulseMsg]     = useState('')
  const [pendingData, setPending]       = useState<Omit<Expense,'date'|'week_number'|'month_label'> | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const todayExpenses = expenses.filter(e => e.date === new Date().toISOString().split('T')[0])

  const handleSave = async () => {
    const n = parseFloat(amount.replace(/\./g,'').replace(',','.'))
    if (!n || n <= 0) return
    const cripto = criptoRate ?? undefined
    const data: Omit<Expense,'date'|'week_number'|'month_label'> = {
      description: desc || (CATEGORIES.find(c => c.id === cat)?.labelEs ?? cat),
      amount_ars:  n,
      method,
      category:    cat,
      is_impulse:  false,
      usd_equiv:   cripto ? parseFloat((n / cripto).toFixed(2)) : undefined,
      cripto_rate: cripto,
    }
    if (IMPULSE_CATEGORIES.includes(cat)) {
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

  const fmtARS = (n: number) => `$${n.toLocaleString('es-AR')}`

  return (
    <div className="tab-scroll h-full pb-24 px-4 pt-2 space-y-4">
      {/* Form */}
      <div className="card space-y-4">
        {/* Monto */}
        <div>
          <label className="text-xs font-semibold" style={{ color: '#9E8872' }}>
            💴 {isKo ? t('how_much') : t('how_much')}
          </label>
          <div className="flex items-center gap-2 mt-1">
            <input
              className="hana-input text-2xl font-black"
              style={{ fontFamily: 'Inter', flex: 1 }}
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <span className="font-semibold" style={{ color: '#9E8872' }}>ARS</span>
          </div>
          {amount && criptoRate && (
            <p className="text-xs mt-1" style={{ color: '#9E8872', fontFamily: 'Inter' }}>
              ≈ USD {(parseFloat(amount) / criptoRate).toFixed(2)}
            </p>
          )}
        </div>

        {/* Categorías */}
        <div>
          <label className="text-xs font-semibold" style={{ color: '#9E8872' }}>
            🏷️ {isKo ? t('category') : t('category')}
          </label>
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

        {/* Descripción */}
        <div>
          <label className="text-xs font-semibold" style={{ color: '#9E8872' }}>
            📝 {isKo ? t('on_what') : t('on_what')}
          </label>
          <input
            className="hana-input mt-1"
            placeholder={t('description_placeholder')}
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        {/* Método */}
        <div>
          <label className="text-xs font-semibold" style={{ color: '#9E8872' }}>
            💳 {isKo ? t('payment_method') : t('payment_method')}
          </label>
          <div className="flex gap-2 mt-2">
            <button
              className={`method-chip ${method === 'debito' ? 'active' : 'inactive'}`}
              onClick={() => setMethod('debito')}
            >
              {isKo ? t('debit') : t('debit')}
            </button>
            <button
              className={`method-chip ${method === 'tarjeta' ? 'active' : 'inactive'}`}
              onClick={() => setMethod('tarjeta')}
            >
              {isKo ? t('card') : t('card')}
            </button>
          </div>
        </div>

        <button
          ref={btnRef}
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || !amount}
        >
          {saving ? '…' : `✓ ${isKo ? t('save_expense') : t('save_expense')}`}
        </button>

        {impulseMsg && (
          <p className="text-center text-sm font-semibold" style={{ color: '#1A7A6E' }}>{impulseMsg}</p>
        )}
      </div>

      {/* Lista del día */}
      {todayExpenses.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: '#9E8872' }}>
            {isKo ? '오늘' : 'Hoy'} — {isKo ? '합계' : 'Total'}: <span style={{ fontFamily: 'Inter', fontWeight: 800, color: '#2D2417' }}>{fmtARS(todayTotal)}</span>
          </p>
          <div className="space-y-2">
            {todayExpenses.map(e => {
              const c = CATEGORIES.find(x => x.id === e.category)
              return (
                <div
                  key={e.id}
                  className="card flex items-center gap-3 py-3"
                  style={{ padding: '0.75rem 1rem' }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{c?.emoji ?? '❓'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm" style={{ color: '#2D2417' }}>{e.description}</p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: e.method === 'debito' ? '#E8F7F0' : '#FFF0F5', color: e.method === 'debito' ? '#1A7A6E' : '#C0392B', fontWeight: 600 }}
                      >
                        {e.method === 'debito' ? (isKo ? t('debit') : t('debit')) : (isKo ? t('card') : t('card'))}
                      </span>
                      {e.is_impulse && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FFF3CD', color: '#856404', fontWeight: 600 }}>
                          💭 impulso
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-base" style={{ fontFamily: 'Inter', color: '#2D2417' }}>
                      {fmtARS(e.amount_ars)}
                    </p>
                    {e.usd_equiv && (
                      <p className="text-xs" style={{ color: '#9E8872' }}>USD {e.usd_equiv}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(e.id!)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E8899A', padding: '4px', fontSize: '1rem' }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal impulso */}
      {impulseModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ background: 'rgba(45,36,23,0.4)' }}
        >
          <div className="card w-full max-w-sm text-center" style={{ background: '#FBF5E6' }}>
            <p className="text-2xl mb-2">🌸</p>
            <p className="font-serif text-lg font-bold mb-1" style={{ color: '#2D2417' }}>
              {isKo ? '잠깐...' : 'Un momento...'}
            </p>
            <p className="text-sm mb-1" style={{ color: '#5C4A3A' }}>{t('impulse_question')}</p>
            <p className="text-xs mb-4" style={{ color: '#9E8872' }}>
              {isKo ? '필요한가요 아니면 기다릴 수 있었나요?' : '필요한가요 아니면 기다릴 수 있었나요?'}
            </p>
            <button className="btn-primary mb-2" onClick={() => confirmImpulse(false)}>
              {t('impulse_yes')}
            </button>
            <button
              onClick={() => confirmImpulse(true)}
              style={{ background: 'none', border: 'none', color: '#9E8872', cursor: 'pointer', width: '100%', padding: '0.6rem', fontWeight: 600 }}
            >
              {t('impulse_no')}
            </button>
          </div>
        </div>
      )}

      {/* Modal confirmar borrado */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ background: 'rgba(45,36,23,0.4)' }}
        >
          <div className="card w-full max-w-xs text-center" style={{ background: '#FBF5E6' }}>
            <p className="font-semibold mb-4" style={{ color: '#2D2417' }}>{t('confirm_delete')}</p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-2 rounded-xl font-semibold"
                style={{ background: '#F0E8D5', border: 'none', cursor: 'pointer', color: '#9E8872' }}
                onClick={() => setDeleteConfirm(null)}
              >
                {t('cancel')}
              </button>
              <button
                className="flex-1 py-2 rounded-xl font-semibold"
                style={{ background: '#E53E3E', border: 'none', cursor: 'pointer', color: 'white' }}
                onClick={async () => { await onDelete(deleteConfirm); setDeleteConfirm(null) }}
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
