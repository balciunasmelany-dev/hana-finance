import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { FIXED_EXPENSES, FINANCIAL_PROFILE } from '../constants/fixedExpenses'
import { supabase } from '../lib/supabase'
import type { AppSettings } from '../hooks/useSettings'

type Props = {
  settings: AppSettings
  onUpdate: (key: keyof AppSettings, value: string | number) => Promise<void>
}

function ToggleRow({ label, defaultOn = true }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F0E8D5' }}>
      <span className="text-sm" style={{ color: '#5C4A3A' }}>{label}</span>
      <button
        onClick={() => setOn(o => !o)}
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

export function SettingsTab({ settings, onUpdate }: Props) {
  const { t, i18n: i18nHook } = useTranslation()
  const isKo = i18nHook.language === 'ko'
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

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

  const NOTIF_LABELS = [
    t('daily_checkin'), t('budget_alert'), t('red_week'),
    t('dues'), t('month_end'), t('milestones'), t('goal_not_reached'),
  ]

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
      <div className="card">
        <p className="text-xs font-semibold mb-1" style={{ color: '#9E8872' }}>🔔 {t('notifications')}</p>
        {NOTIF_LABELS.map(label => <ToggleRow key={label} label={label} />)}
      </div>

      {/* Gastos fijos */}
      <div className="card">
        <p className="text-xs font-semibold mb-3" style={{ color: '#9E8872' }}>📋 {t('fixed_expenses')}</p>

        <p className="text-xs font-semibold mb-1" style={{ color: '#9E8872' }}>
          {isKo ? '개인 (ARS)' : 'Personales (ARS)'}
        </p>
        {FIXED_EXPENSES.personal_ars.map(e => (
          <div key={e.name} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #F0E8D5' }}>
            <span className="text-sm" style={{ color: '#5C4A3A' }}>
              {isKo ? e.nameKo : e.name}
            </span>
            <span className="text-sm font-semibold" style={{ fontFamily: 'Inter', color: '#2D2417' }}>
              ${e.amount.toLocaleString('es-AR')}
            </span>
          </div>
        ))}

        <p className="text-xs font-semibold mt-3 mb-1" style={{ color: '#9E8872' }}>
          {isKo ? '공동 (ARS)' : 'Compartidos (ARS)'}
        </p>
        {FIXED_EXPENSES.shared_ars.map(e => (
          <div key={e.name} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #F0E8D5' }}>
            <span className="text-sm" style={{ color: '#5C4A3A' }}>{e.name}</span>
            <span className="text-sm font-semibold" style={{ fontFamily: 'Inter', color: '#2D2417' }}>
              ${e.amount.toLocaleString('es-AR')}
            </span>
          </div>
        ))}

        <p className="text-xs font-semibold mt-3 mb-1" style={{ color: '#9E8872' }}>
          {isKo ? '구독 (USD)' : 'Suscripciones (USD)'}
        </p>
        {FIXED_EXPENSES.usd.map(e => (
          <div key={e.name} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid #F0E8D5' }}>
            <span className="text-sm" style={{ color: '#5C4A3A' }}>
              {isKo ? e.nameKo : e.name}
            </span>
            <span className="text-sm font-semibold" style={{ fontFamily: 'Inter', color: '#2D2417' }}>
              USD {e.amount.toFixed(2)}
            </span>
          </div>
        ))}

        <p className="text-xs mt-2 font-semibold text-right" style={{ color: '#9E8872', fontFamily: 'Inter' }}>
          {isKo ? '구독 합계' : 'Total suscripciones'}: USD {FINANCIAL_PROFILE.usd_subscriptions}
        </p>
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
