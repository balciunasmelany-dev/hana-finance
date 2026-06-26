import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { FINANCIAL_PROFILE } from '../constants/fixedExpenses'
import { supabase } from '../lib/supabase'
import type { AppSettings } from '../hooks/useSettings'
import {
  loadNotifSettings,
  saveNotifSettings,
  requestPermission,
  hasPermission,
  scheduleDailyCheckin,
  cancelDailyCheckin,
  subscribeWebPush,
  unsubscribeWebPush,
  type NotifSettings,
} from '../lib/notifications'

const FIXED_KEY = 'hana_fixed_expenses'

type FixedItem = { name: string; amount: number; category?: string }

function loadFixed(): { personal: FixedItem[]; shared: FixedItem[] } {
  try {
    const saved = localStorage.getItem(FIXED_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return {
    personal: [
      { name: 'Psicóloga',         amount: 160000, category: 'health'    },
      { name: 'Carrefour',         amount: 120000, category: 'home'      },
      { name: 'Verdulería',        amount: 80000,  category: 'food'      },
      { name: 'Inglés (4 clases)', amount: 72000,  category: 'education' },
      { name: 'Voley',             amount: 30000,  category: 'health'    },
      { name: 'Celular Tuenti',    amount: 18000,  category: 'other'     },
      { name: 'Amazon Prime',      amount: 7863,   category: 'leisure'   },
    ],
    shared: [
      { name: '½ Flow',     amount: 80000  },
      { name: '½ Alarma',   amount: 70069  },
      { name: '½ Naturgy',  amount: 48510  },
      { name: '½ Municipal',amount: 33997  },
      { name: '½ Edenor',   amount: 15924  },
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

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44, height: 24,
        borderRadius: 12,
        background: on ? '#1A7A6E' : '#E0D8CC',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 2, left: on ? 22 : 2,
        width: 20, height: 20,
        borderRadius: '50%',
        background: 'white',
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }} />
    </button>
  )
}

function NotificationsSection({ isKo }: { isKo: boolean }) {
  const [notifs, setNotifs]       = useState<NotifSettings>(loadNotifSettings)
  const [permStatus, setPermStatus] = useState<NotificationPermission | 'unsupported'>(
    'Notification' in window ? Notification.permission : 'unsupported'
  )
  const [webPushOk, setWebPushOk] = useState<boolean | null>(null)

  useEffect(() => {
    if (hasPermission() && notifs.daily_checkin) {
      scheduleDailyCheckin('20:00')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = async (key: keyof NotifSettings) => {
    const newVal = !notifs[key]

    if (newVal && !hasPermission()) {
      const granted = await requestPermission()
      setPermStatus(granted ? 'granted' : 'denied')
      if (!granted) {
        alert(isKo
          ? '알림 권한이 필요해요. 브라우저 설정에서 허용해 주세요.'
          : 'Necesitás dar permiso de notificaciones. Buscá el candado 🔒 en la barra del navegador → Notificaciones → Permitir.')
        return
      }
    }

    const updated = { ...notifs, [key]: newVal }
    setNotifs(updated)
    saveNotifSettings(updated)

    if (key === 'daily_checkin') {
      if (newVal) {
        // Intentar Web Push real primero (funciona con app cerrada)
        const ok = await subscribeWebPush()
        setWebPushOk(ok)
        // Siempre activar también el fallback local
        scheduleDailyCheckin('20:00')
      } else {
        await unsubscribeWebPush()
        cancelDailyCheckin()
        setWebPushOk(null)
      }
    }
  }

  const rows: { key: keyof NotifSettings; label: string; labelKo: string; desc: string }[] = [
    {
      key: 'daily_checkin',
      label: '🌸 Recordatorio diario (20:00)',
      labelKo: '🌸 매일 알림 (20:00)',
      desc: 'Te avisa cada noche para que registres tus gastos',
    },
    {
      key: 'budget_alert',
      label: '⚠️ Alerta de presupuesto',
      labelKo: '⚠️ 예산 경고',
      desc: 'Cuando superás el presupuesto semanal',
    },
    {
      key: 'milestone',
      label: '🎉 Logros de ahorro',
      labelKo: '🎉 저축 달성',
      desc: 'Cuando alcanzás un hito de tu meta',
    },
  ]

  return (
    <div className="card">
      <p className="text-xs font-semibold mb-1" style={{ color: '#9E8872' }}>🔔 {isKo ? '알림' : 'Notificaciones'}</p>

      {permStatus === 'denied' && (
        <p className="text-xs mb-3 p-2 rounded-xl" style={{ background: '#FFF0F0', color: '#C0392B' }}>
          ⚠️ {isKo
            ? '알림이 차단되어 있어요. 브라우저 설정에서 허용해 주세요.'
            : 'Las notificaciones están bloqueadas. Entrá al candado 🔒 en la barra del navegador → Notificaciones → Permitir.'}
        </p>
      )}

      {webPushOk === true && (
        <p className="text-xs mb-3 p-2 rounded-xl" style={{ background: '#F0FFF8', color: '#1A7A6E' }}>
          ✅ {isKo ? '앱이 닫혀도 알림이 와요!' : '¡Listo! Te va a llegar aunque tengas la app cerrada.'}
        </p>
      )}
      {webPushOk === false && (
        <p className="text-xs mb-3 p-2 rounded-xl" style={{ background: '#FFFBF0', color: '#9E6B00' }}>
          ⚡ {isKo ? '앱이 열려있을 때만 알림이 와요.' : 'Modo básico: la notificación llega mientras la app está abierta. Para recibirla siempre, configurá Supabase.'}
        </p>
      )}

      {rows.map(r => (
        <div key={r.key} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F0E8D5' }}>
          <div>
            <p className="text-sm" style={{ color: '#5C4A3A' }}>{isKo ? r.labelKo : r.label}</p>
            <p className="text-xs" style={{ color: '#9E8872' }}>{r.desc}</p>
          </div>
          <ToggleSwitch on={notifs[r.key]} onToggle={() => toggle(r.key)} />
        </div>
      ))}
    </div>
  )
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

      {/* Notificaciones */}
      <NotificationsSection isKo={isKo} />

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
                  const next = { ...fixed, [section]: [...fixed[section], { name: 'Nuevo', amount: 0 }] }
                  setFixed(next); saveFixed(next)
                  setEditingFixed({ section, idx: fixed[section].length })
                }}
                style={{ background: 'none', border: 'none', color: '#1A7A6E', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}
              >+</button>
            </div>
            {fixed[section].map((e, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid #F0E8D5' }}>
                {editingFixed?.section === section && editingFixed.idx === idx ? (
                  <>
                    <input
                      className="hana-input text-sm"
                      style={{ flex: 1, padding: '0.3rem 0.5rem' }}
                      value={e.name}
                      onChange={ev => {
                        const next = { ...fixed }
                        next[section] = fixed[section].map((x, i) => i === idx ? { ...x, name: ev.target.value } : x)
                        setFixed(next)
                      }}
                    />
                    <input
                      className="hana-input text-sm"
                      style={{ width: 90, padding: '0.3rem 0.5rem', fontFamily: 'Inter' }}
                      type="number"
                      value={e.amount}
                      onChange={ev => {
                        const next = { ...fixed }
                        next[section] = fixed[section].map((x, i) => i === idx ? { ...x, amount: Number(ev.target.value) } : x)
                        setFixed(next)
                      }}
                    />
                    <button
                      onClick={() => { saveFixed(fixed); setEditingFixed(null) }}
                      style={{ background: 'none', border: 'none', color: '#1A7A6E', cursor: 'pointer', fontWeight: 700 }}
                    >✓</button>
                  </>
                ) : (
                  <>
                    <span className="text-sm flex-1" style={{ color: '#5C4A3A' }}>{e.name}</span>
                    <span className="text-sm font-semibold" style={{ fontFamily: 'Inter', color: '#2D2417' }}>
                      ${e.amount.toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => setEditingFixed({ section, idx })}
                      style={{ background: 'none', border: 'none', color: '#9E8872', cursor: 'pointer', fontSize: '0.85rem' }}
                    >✏️</button>
                    <button
                      onClick={() => {
                        const next = { ...fixed, [section]: fixed[section].filter((_, i) => i !== idx) }
                        setFixed(next); saveFixed(next)
                      }}
                      style={{ background: 'none', border: 'none', color: '#E8899A', cursor: 'pointer', fontSize: '0.85rem' }}
                    >✕</button>
                  </>
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
