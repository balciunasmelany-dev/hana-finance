import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { FINANCIAL_PROFILE } from '../constants/fixedExpenses'
import { supabase } from '../lib/supabase'
import type { AppSettings } from '../hooks/useSettings'
import { loadBalance, saveBalance, loadPaidFixed, markPaid, isPaid } from '../lib/balance'

const FIXED_KEY = 'hana_fixed_expenses'

type FixedItem = { name: string; amount: number; currency: 'ARS' | 'USD'; category?: string }

function loadFixed(): { personal: FixedItem[]; shared: FixedItem[] } {
  try {
    const saved = localStorage.getItem(FIXED_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      // migrar items sin currency → ARS por defecto
      const migrate = (arr: FixedItem[]) => arr.map(i => ({ ...i, currency: i.currency ?? 'ARS' }))
      return { personal: migrate(data.personal), shared: migrate(data.shared) }
    }
  } catch {}
  return {
    personal: [
      { name: 'Psicóloga',         amount: 160000, currency: 'ARS', category: 'health'    },
      { name: 'Carrefour',         amount: 120000, currency: 'ARS', category: 'home'      },
      { name: 'Verdulería',        amount: 80000,  currency: 'ARS', category: 'food'      },
      { name: 'Inglés (4 clases)', amount: 72000,  currency: 'ARS', category: 'education' },
      { name: 'Voley',             amount: 30000,  currency: 'ARS', category: 'health'    },
      { name: 'Celular Tuenti',    amount: 18000,  currency: 'ARS', category: 'other'     },
      { name: 'Amazon Prime',      amount: 7863,   currency: 'ARS', category: 'leisure'   },
    ],
    shared: [
      { name: '½ Flow',      amount: 80000, currency: 'ARS' },
      { name: '½ Alarma',    amount: 70069, currency: 'ARS' },
      { name: '½ Naturgy',   amount: 48510, currency: 'ARS' },
      { name: '½ Municipal', amount: 33997, currency: 'ARS' },
      { name: '½ Edenor',    amount: 15924, currency: 'ARS' },
    ]
  }
}

function saveFixed(data: { personal: FixedItem[]; shared: FixedItem[] }) {
  localStorage.setItem(FIXED_KEY, JSON.stringify(data))
}

type Props = {
  settings:         AppSettings
  onUpdate:         (key: keyof AppSettings, value: string | number) => Promise<void>
  manualRate:       number | null
  updateManualRate: (r: number | null) => void
}


function EditableRow({ label, value, onChange, prefix = '', type = 'text' }: {
  label: string; value: string | number; onChange: (v: string) => void; prefix?: string; type?: string
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal]     = useState(String(value))

  const save = () => {
    onChange(local)
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F0E8D5' }}>
      <span className="text-sm" style={{ color: '#5C4A3A' }}>{label}</span>
      {editing ? (
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm" style={{ color: '#9E8872' }}>{prefix}</span>}
          <input
            className="hana-input text-right"
            style={{ width: 100, padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
            type={type}
            value={local}
            onChange={e => setLocal(e.target.value)}
            onBlur={save}
            onKeyDown={e => e.key === 'Enter' && save()}
            autoFocus
          />
        </div>
      ) : (
        <button
          onClick={() => { setLocal(String(value)); setEditing(true) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1A7A6E', fontWeight: 700, fontFamily: 'Inter', fontSize: '0.95rem' }}
        >
          {prefix}{typeof value === 'number' ? value.toLocaleString('es-AR') : value} ✏️
        </button>
      )}
    </div>
  )
}

export function SettingsTab({ settings, onUpdate, manualRate, updateManualRate }: Props) {
  const { t, i18n: i18nHook } = useTranslation()
  const isKo = i18nHook.language === 'ko'
  const [syncing, setSyncing]         = useState(false)
  const [syncMsg, setSyncMsg]         = useState('')
  const [manualInput, setManualInput] = useState(manualRate ? String(manualRate) : '')
  const [fixed, setFixed]             = useState(loadFixed)
  const [editingFixed, setEditingFixed] = useState<{section: 'personal'|'shared', idx: number} | null>(null)
  const [balance, setBalance]         = useState(loadBalance)
  const [balArs, setBalArs]           = useState(String(loadBalance().ars || ''))
  const [balUsd, setBalUsd]           = useState(String(loadBalance().usd || ''))
  const [balSav, setBalSav]           = useState(String(loadBalance().savings || ''))
  const [paid, setPaid]               = useState(() => loadPaidFixed())

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('hana_lang', lang)
    onUpdate('language', lang)
  }

  const doSync = async () => {
    setSyncing(true)
    try {
      if (!supabase) throw new Error('No configurado')
      await supabase.from('settings').select('key').limit(1)
      setSyncMsg('✅ Conectado')
    } catch {
      setSyncMsg('❌ Sin conexión')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(''), 3000)
    }
  }

  return (
    <div className="tab-scroll h-full pb-24 px-4 pt-2 space-y-4">

      {/* Perfil */}
      <div className="card">
        <p className="text-xs font-semibold mb-2" style={{ color: '#9E8872' }}>👤 {t('profile')}</p>
        <EditableRow label={t('name')}                   value={settings.name}                    onChange={v => onUpdate('name', v)} />
        <EditableRow label={t('salary_base')}            value={settings.salary_base_usd}         onChange={v => onUpdate('salary_base_usd', Number(v))}         prefix="USD " type="number" />
        <EditableRow label={t('salary_bonus')}           value={settings.salary_bonus_usd}        onChange={v => onUpdate('salary_bonus_usd', Number(v))}        prefix="USD " type="number" />
        <EditableRow label={t('weekly_budget_setting')}  value={settings.weekly_budget_ars}       onChange={v => onUpdate('weekly_budget_ars', Number(v))}       prefix="$"   type="number" />
        <EditableRow label={t('saving_goal')}            value={settings.monthly_saving_goal_usd} onChange={v => onUpdate('monthly_saving_goal_usd', Number(v))} prefix="USD " type="number" />
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm" style={{ color: '#5C4A3A' }}>{isKo ? '급여일' : 'Día de cobro'}</span>
          <span className="font-bold" style={{ color: '#1A7A6E', fontFamily: 'Inter' }}>{FINANCIAL_PROFILE.salary_day_range}</span>
        </div>
      </div>

      {/* Saldo disponible */}
      <div className="card">
        <p className="text-xs font-semibold mb-1" style={{ color: '#9E8872' }}>
          💰 {isKo ? '현재 잔액 (DolarApp)' : 'Saldo disponible (DolarApp)'}
        </p>
        <p className="text-xs mb-3" style={{ color: '#9E8872' }}>
          {isKo ? '코브로할 때 업데이트하세요' : 'Actualizá cuando cobrás o hacés un depósito'}
        </p>
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <p className="text-xs mb-1" style={{ color: '#9E8872' }}>ARS corriente</p>
            <input className="hana-input w-full" type="number" inputMode="numeric" placeholder="0"
              value={balArs} onChange={e => setBalArs(e.target.value)} />
          </div>
          <div className="flex-1">
            <p className="text-xs mb-1" style={{ color: '#9E8872' }}>USD corriente</p>
            <input className="hana-input w-full" type="number" inputMode="decimal" placeholder="0"
              value={balUsd} onChange={e => setBalUsd(e.target.value)} />
          </div>
        </div>
        <div className="mb-3">
          <p className="text-xs mb-1" style={{ color: '#9E8872' }}>💎 USD ahorro (DolarApp USDT — no se toca)</p>
          <input className="hana-input w-full" type="number" inputMode="decimal" placeholder="0"
            value={balSav} onChange={e => setBalSav(e.target.value)} />
        </div>
        <button
          className="btn-primary w-full"
          onClick={() => {
            const b = { ars: Number(balArs) || 0, usd: Number(balUsd) || 0, savings: Number(balSav) || 0, updatedAt: new Date().toISOString() }
            saveBalance(b)
            setBalance(b)
          }}
        >
          {isKo ? '저장' : '💾 Guardar saldo'}
        </button>
        {balance.updatedAt && (
          <p className="text-xs mt-2 text-center" style={{ color: '#9E8872' }}>
            Actualizado: {new Date(balance.updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {/* Idioma */}
      <div className="card">
        <p className="text-xs font-semibold mb-3" style={{ color: '#9E8872' }}>🌐 {t('language')}</p>
        <div className="flex gap-2">
          {[
            { code: 'es', label: '🇦🇷 Español' },
            { code: 'en', label: '🇺🇸 English' },
            { code: 'ko', label: '🇰🇷 한국어'   },
          ].map(l => (
            <button
              key={l.code}
              onClick={() => changeLang(l.code)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: i18nHook.language === l.code ? '#C0392B' : '#F0E8D5',
                color:      i18nHook.language === l.code ? 'white'   : '#9E8872',
                border:     'none', cursor: 'pointer',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: '#9E8872' }}>
          {isKo ? '한국어로 연습해보세요 🇰🇷' : '¡Practicá coreano cambiando a 한국어!'}
        </p>
      </div>



      {/* Dólar App manual */}
      <div className="card">
        <p className="text-xs font-semibold mb-2" style={{ color: '#9E8872' }}>
          💵 {isKo ? '달러앱 수동 입력' : 'DolarApp — valor manual'}
        </p>
        <p className="text-xs mb-3" style={{ color: '#9E8872' }}>
          {isKo ? 'API 값을 수동으로 덮어쓸 수 있어요' : 'Podés sobrescribir el valor de la API con el que ves en DolarApp'}
        </p>
        <div className="flex gap-2 items-center">
          <input
            className="hana-input"
            style={{ flex: 1 }}
            type="number"
            inputMode="decimal"
            placeholder="Ej: 1520"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
          />
          <button
            className="method-chip active"
            onClick={() => {
              const v = parseFloat(manualInput)
              updateManualRate(v > 0 ? v : null)
            }}
          >
            {isKo ? '저장' : 'Guardar'}
          </button>
          {manualRate && (
            <button
              className="method-chip inactive"
              onClick={() => { updateManualRate(null); setManualInput('') }}
            >
              {isKo ? '삭제' : 'Quitar'}
            </button>
          )}
        </div>
        {manualRate && (
          <p className="text-xs mt-2 font-semibold" style={{ color: '#1A7A6E' }}>
            ✅ Usando USD {manualRate.toLocaleString('es-AR')} (manual)
          </p>
        )}
      </div>

      {/* Gastos fijos editables */}
      <div className="card">
        <p className="text-xs font-semibold mb-3" style={{ color: '#9E8872' }}>📋 {t('fixed_expenses')}</p>

        {(['personal','shared'] as const).map(section => (
          <div key={section}>
            <div className="flex justify-between items-center mt-2 mb-1">
              <p className="text-xs font-semibold" style={{ color: '#9E8872' }}>
                {section === 'personal' ? (isKo ? '개인 (ARS)' : 'Personales (ARS)') : (isKo ? '공동 (ARS)' : 'Compartidos (ARS)')}
              </p>
              <button
                onClick={() => {
                  const next = { ...fixed, [section]: [...fixed[section], { name: 'Nuevo', amount: 0, currency: 'ARS' as const }] }
                  setFixed(next); saveFixed(next)
                  setEditingFixed({ section, idx: fixed[section].length })
                }}
                style={{ background: 'none', border: 'none', color: '#1A7A6E', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}
              >+</button>
            </div>
            {fixed[section].map((e, idx) => (
              <div key={idx} className="py-1.5" style={{ borderBottom: '1px solid #F0E8D5' }}>
                {editingFixed?.section === section && editingFixed.idx === idx ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <input
                        className="hana-input text-sm"
                        style={{ flex: 1, padding: '0.3rem 0.5rem' }}
                        placeholder="Nombre"
                        value={e.name}
                        onChange={ev => {
                          const next = { ...fixed }
                          next[section] = fixed[section].map((x, i) => i === idx ? { ...x, name: ev.target.value } : x)
                          setFixed(next)
                        }}
                      />
                      {/* Toggle ARS / USD */}
                      <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #E0D8CC', flexShrink: 0 }}>
                        {(['ARS','USD'] as const).map(cur => (
                          <button key={cur}
                            onClick={() => {
                              const next = { ...fixed }
                              next[section] = fixed[section].map((x, i) => i === idx ? { ...x, currency: cur } : x)
                              setFixed(next)
                            }}
                            style={{
                              padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                              background: e.currency === cur ? '#1A7A6E' : '#F0E8D5',
                              color: e.currency === cur ? 'white' : '#9E8872',
                            }}
                          >{cur}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        className="hana-input text-sm"
                        style={{ flex: 1, padding: '0.3rem 0.5rem', fontFamily: 'Inter' }}
                        type="number"
                        placeholder="Monto"
                        value={e.amount}
                        onChange={ev => {
                          const next = { ...fixed }
                          next[section] = fixed[section].map((x, i) => i === idx ? { ...x, amount: Number(ev.target.value) } : x)
                          setFixed(next)
                        }}
                      />
                      <button
                        onClick={() => { saveFixed(fixed); setEditingFixed(null) }}
                        style={{ background: '#1A7A6E', border: 'none', color: 'white', borderRadius: 10, padding: '4px 14px', cursor: 'pointer', fontWeight: 700 }}
                      >✓</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm" style={{ color: '#5C4A3A' }}>{e.name}</span>
                      <span className="text-xs ml-2 font-semibold" style={{ fontFamily: 'Inter', color: '#9E8872' }}>
                        {e.currency === 'USD' ? 'USD ' : '$'}{e.amount.toLocaleString('es-AR')}
                      </span>
                    </div>
                    {/* Botón Pagar / Pagado */}
                    <button
                      onClick={() => {
                        const alreadyPaid = isPaid(paid, e.name)
                        const next = markPaid(e.name, alreadyPaid ? null : e.currency)
                        setPaid({ ...next })
                      }}
                      style={{
                        border: 'none', borderRadius: 10, padding: '3px 10px',
                        fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                        background: isPaid(paid, e.name) ? '#00C47D' : '#C0392B',
                        color: 'white',
                      }}
                    >
                      {isPaid(paid, e.name) ? '✓ Pagado' : 'Pagar'}
                    </button>
                    <button onClick={() => setEditingFixed({ section, idx })}
                      style={{ background: 'none', border: 'none', color: '#9E8872', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}
                    >✏️</button>
                    <button
                      onClick={() => {
                        const next = { ...fixed, [section]: fixed[section].filter((_, i) => i !== idx) }
                        setFixed(next); saveFixed(next)
                      }}
                      style={{ background: 'none', border: 'none', color: '#E8899A', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}
                    >✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Conexión */}
      <div className="card">
        <p className="text-xs font-semibold mb-3" style={{ color: '#9E8872' }}>☁️ {t('connection')}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: supabase ? '#00C47D' : '#9E8872' }}>
            {supabase ? '🟢 Supabase configurado' : '⚪ Sin configurar (.env)'}
          </span>
          <button
            onClick={doSync}
            disabled={syncing}
            className="method-chip active"
            style={{ opacity: syncing ? 0.6 : 1 }}
          >
            {syncing ? '…' : t('sync')}
          </button>
        </div>
        {syncMsg && <p className="text-xs mt-2 text-center font-semibold" style={{ color: '#1A7A6E' }}>{syncMsg}</p>}
      </div>

      {/* Vencimientos */}
      <div className="card">
        <p className="text-xs font-semibold mb-2" style={{ color: '#9E8872' }}>
          📅 {isKo ? '납부일' : 'Próximos vencimientos'}
        </p>
        {FINANCIAL_PROFILE.upcoming_dues.map(d => (
          <div key={d.name} className="flex justify-between py-2" style={{ borderBottom: '1px solid #F0E8D5' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2D2417' }}>{d.name}</p>
              <p className="text-xs" style={{ color: '#9E8872' }}>{d.date}</p>
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: 'Inter', color: '#C0392B' }}>
              ${d.amount.toLocaleString('es-AR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
