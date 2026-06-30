import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useExchangeRates } from '../hooks/useExchangeRates'
import { CherryBlossom } from '../components/CherryBlossomSVG'
import { MOTIVATIONAL_QUOTES, FINANCIAL_PROFILE } from '../constants/fixedExpenses'
import type { AppSettings } from '../hooks/useSettings'
import { loadBalance, loadPaidFixed, isPaid, type Balance, type PaidMap } from '../lib/balance'

type Props = {
  todayTotal:   number
  weekTotal:    number
  monthTotal:   number   // gastos registrados este mes (solo egresos)
  settings:     AppSettings
  criptoRate:   number | null
}

function greeting(name: string) {
  const h = new Date().getHours()
  if (h < 12) return { es: `Buen día, ${name} ☀️`, ko: `좋은 아침이에요 ${name}` }
  if (h < 19) return { es: `Buenas tardes, ${name} 🌸`, ko: `안녕하세요 ${name}` }
  return { es: `Buenas noches, ${name} 🌙`, ko: `잘 자요 ${name}` }
}

function formatDate() {
  const now  = new Date()
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  const mons = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const koDays = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일']
  const koMons = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  return {
    es: `${days[now.getDay()]} ${now.getDate()} de ${mons[now.getMonth()]}`,
    ko: `${koMons[now.getMonth()]} ${now.getDate()}일 ${koDays[now.getDay()]}`,
  }
}

function semaforo(todayTotal: number, weeklyBudget: number): { emoji: string; color: string; bg: string } {
  const daily = weeklyBudget / 7
  const pct   = todayTotal / daily
  if (todayTotal === 0)   return { emoji: '⚪', color: '#9E8872', bg: '#FFF0F5' }
  if (pct <= 0.7)         return { emoji: '🟢', color: '#00C47D', bg: '#F0FFF7' }
  if (pct <= 1.0)         return { emoji: '🟡', color: '#F5A623', bg: '#FFFBF0' }
  return                         { emoji: '🔴', color: '#E53E3E', bg: '#FFF5F5' }
}

function FlowerBar({ pct }: { pct: number }) {
  const filled = Math.round(pct * 10)
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} style={{ fontSize: '1.1rem', opacity: i < filled ? 1 : 0.2 }}>🌸</span>
      ))}
    </div>
  )
}

export function HomeTab({ todayTotal, weekTotal, monthTotal, settings, criptoRate }: Props) {
  const { t, i18n } = useTranslation()
  const { rates, loading: rLoading } = useExchangeRates()
  const [quoteIdx, setQuoteIdx]     = useState(0)
  const [activeGoal, setActiveGoal] = useState<'korea' | 'greece'>('korea')
  const [scenario, setScenario]     = useState<'base' | 'bonus' | 'aguinaldo'>('base')
  const [semaKey, setSemaKey]       = useState(0)
  const [balance, setBalance]       = useState<Balance>(loadBalance)
  const [paid, setPaid]             = useState<PaidMap>(loadPaidFixed)

  // Recargar saldo cuando volvés al tab
  useEffect(() => {
    setBalance(loadBalance())
    setPaid(loadPaidFixed())
  }, [])

  const isKo = i18n.language === 'ko'
  const greet = greeting(settings.name)
  const date  = formatDate()
  const sema  = semaforo(todayTotal, settings.weekly_budget_ars)

  const weekPct = Math.min(weekTotal / settings.weekly_budget_ars, 1)

  // Cotizaciones clave
  const RATE_DISPLAY = [
    { label: 'DolarApp', labelKo: '크립토', casa: 'cripto'  },
    { label: 'MEP',      labelKo: 'MEP',    casa: 'bolsa'   },
    { label: 'Blue',     labelKo: '블루',   casa: 'blue'    },
    { label: 'Oficial',  labelKo: '공식',   casa: 'oficial' },
    { label: 'Tarjeta',  labelKo: '카드',   casa: 'tarjeta' },
  ]

  // Meta de viaje
  const goals = {
    korea:  { name: 'Corea del Sur', ko: '한국', flag: '🇰🇷', target: 5000, current: settings.current_savings_usd },
    greece: { name: 'Grecia',        ko: '그리스', flag: '🇬🇷', target: 4000, current: settings.current_savings_usd * 0.8 },
  }
  const goal = goals[activeGoal]
  const goalPct = Math.min(goal.current / goal.target, 1)

  const monthlySaving = settings.monthly_saving_goal_usd
  const monthsToGoal  = monthlySaving > 0
    ? Math.ceil((goal.target - goal.current) / monthlySaving)
    : null

  // Escenario de ahorro
  const salaryMap = {
    base:      settings.salary_base_usd,
    bonus:     settings.salary_bonus_usd,
    aguinaldo: FINANCIAL_PROFILE.salary_aguinaldo_usd,
  }
  const salaryUsd    = salaryMap[scenario]
  const fixedUsd     = FINANCIAL_PROFILE.usd_subscriptions
  const cripto       = criptoRate ?? 1200
  const fixedArsUsd  = totalFixedArs / cripto   // fijos reales convertidos a USD
  const projSaving   = salaryUsd - fixedUsd - fixedArsUsd
  const projColor    = projSaving >= settings.monthly_saving_goal_usd ? '#00C47D'
                      : projSaving >= settings.monthly_saving_goal_usd * 0.8 ? '#F5A623'
                      : '#E53E3E'

  // Quote rotation
  useEffect(() => {
    const id = setInterval(() => setQuoteIdx(i => (i + 1) % MOTIVATIONAL_QUOTES.length), 8000)
    return () => clearInterval(id)
  }, [])

  // Re-fade semáforo on change
  useEffect(() => { setSemaKey(k => k + 1) }, [sema.emoji])

  const quote    = MOTIVATIONAL_QUOTES[quoteIdx]
  const todayUsd = criptoRate ? (todayTotal / criptoRate).toFixed(1) : '–'

  // Gastos fijos reales desde localStorage
  const fixedStored = (() => {
    try {
      const s = localStorage.getItem('hana_fixed_expenses')
      return s ? JSON.parse(s) : { personal: [], shared: [] }
    } catch { return { personal: [], shared: [] } }
  })()
  const allFixed: { name: string; amount: number; currency: 'ARS' | 'USD' }[] = [
    ...(fixedStored.personal ?? []),
    ...(fixedStored.shared   ?? []),
  ].map(f => ({ ...f, currency: f.currency ?? 'ARS' }))

  const totalFixedArs = allFixed.filter(f => f.currency === 'ARS').reduce((s, f) => s + f.amount, 0)
  const paidFixedArs  = allFixed.filter(f => isPaid(paid, f.name) && f.currency === 'ARS').reduce((s, f) => s + f.amount, 0)
  const paidFixedUsd  = allFixed.filter(f => isPaid(paid, f.name) && f.currency === 'USD').reduce((s, f) => s + f.amount, 0)

  // Saldo disponible = saldo inicial − fijos pagados − gastos registrados
  const monthExpenses = monthTotal > 0 ? monthTotal : 0
  const availableArs  = balance.ars - paidFixedArs - monthExpenses
  const availableUsd  = balance.usd - paidFixedUsd

  return (
    <div className="tab-scroll h-full pb-24 px-4 pt-2 space-y-3">
      {/* Header */}
      <div className="pt-2 pb-1">
        <p className="font-serif text-xl font-bold" style={{ color: '#2D2417' }}>
          {isKo ? greet.ko : greet.es}
        </p>
        <p className="text-sm" style={{ color: '#9E8872' }}>
          {isKo ? date.ko : date.es}
        </p>
      </div>

      {/* 0. Saldo disponible */}
      {balance.ars > 0 || balance.usd > 0 || balance.savings > 0 ? (
        <div className="card" style={{ background: 'linear-gradient(135deg, #F0FFF8 0%, #FBF5E6 100%)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#9E8872' }}>
            💰 {isKo ? '현재 잔액' : 'Saldo disponible'}
          </p>
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-xs" style={{ color: '#9E8872' }}>{isKo ? 'ARS 가용' : 'ARS disponible'}</p>
              <p className="font-black text-xl" style={{ fontFamily: 'Inter', color: availableArs >= 0 ? '#1A7A6E' : '#C0392B' }}>
                ${availableArs.toLocaleString('es-AR')}
              </p>
              {paidFixedArs > 0 && (
                <p className="text-xs" style={{ color: '#9E8872' }}>
                  −${paidFixedArs.toLocaleString('es-AR')} {isKo ? '고정 납부' : 'fijos pagados'}
                </p>
              )}
              {monthExpenses > 0 && (
                <p className="text-xs" style={{ color: '#9E8872' }}>
                  −${monthExpenses.toLocaleString('es-AR')} {isKo ? '이번 달 지출' : 'gastos del mes'}
                </p>
              )}
            </div>
            {balance.usd > 0 && (
              <div className="text-right">
                <p className="text-xs" style={{ color: '#9E8872' }}>{isKo ? 'USD 가용' : 'USD disponible'}</p>
                <p className="font-black text-xl" style={{ fontFamily: 'Inter', color: availableUsd >= 0 ? '#1A7A6E' : '#C0392B' }}>
                  USD {availableUsd.toLocaleString()}
                </p>
                {paidFixedUsd > 0 && (
                  <p className="text-xs" style={{ color: '#9E8872' }}>−USD {paidFixedUsd.toLocaleString()} fijos</p>
                )}
              </div>
            )}
          </div>
          {balance.savings > 0 && (
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #F0E8D5' }}>
              <div>
                <p className="text-xs" style={{ color: '#9E8872' }}>💎 {isKo ? 'USD 저축 (DolarApp)' : 'USD ahorro (DolarApp)'}</p>
                <p className="font-bold text-base" style={{ fontFamily: 'Inter', color: '#C9920A' }}>
                  USD {balance.savings.toLocaleString()}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-xl font-semibold" style={{ background: '#FFF8E6', color: '#C9920A' }}>
                {isKo ? '손대지 마세요 🌸' : 'No tocar 🌸'}
              </span>
            </div>
          )}
        </div>
      ) : null}

      {/* 1. Semáforo */}
      <div className="card" style={{ background: sema.bg }}>
        <div key={semaKey} className="fade-in flex flex-col items-center gap-2 py-2">
          <span style={{ fontSize: '3.2rem', lineHeight: 1 }}>{sema.emoji}</span>
          <p className="text-sm font-semibold" style={{ color: sema.color }}>
            {isKo ? '오늘 지출' : t('today_spent')}:
            <span className="font-black text-lg ml-2" style={{ fontFamily: 'Inter' }}>
              ${todayTotal.toLocaleString('es-AR')} ARS
            </span>
            {criptoRate && (
              <span className="ml-2 text-sm" style={{ color: '#9E8872' }}>· USD {todayUsd}</span>
            )}
          </p>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: '#9E8872' }}>
            <span>{isKo ? '주간 예산' : t('weekly_budget')}</span>
            <span style={{ fontFamily: 'Inter', fontWeight: 700 }}>
              {Math.round(weekPct * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ background: '#E0D8CC' }}>
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${weekPct * 100}%`, background: sema.color }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: '#9E8872', fontFamily: 'Inter' }}>
            <span>${weekTotal.toLocaleString('es-AR')}</span>
            <span>${settings.weekly_budget_ars.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>

      {/* 2. Cotizaciones */}
      <div className="card">
        <p className="text-xs font-semibold mb-3" style={{ color: '#9E8872' }}>
          💵 {isKo ? '환율' : t('exchange_rate')}
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {RATE_DISPLAY.map(r => {
            const rate = rates.find(x => x.casa === r.casa)
            return (
              <div key={r.casa} className="flex-shrink-0 text-center" style={{ minWidth: 64 }}>
                <p className="text-xs mb-1" style={{ color: '#9E8872' }}>
                  {isKo ? r.labelKo : r.label}
                </p>
                <p className="font-black text-base" style={{ fontFamily: 'Inter', color: '#2D2417' }}>
                  {rate?.venta ? rate.venta.toLocaleString('es-AR') : (rLoading ? '…' : '–')}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Meta de viaje */}
      <div className="card" style={{ background: 'linear-gradient(160deg, #FFF0F5 0%, #FBF5E6 100%)' }}>
        <div className="flex items-center gap-2 mb-3">
          <CherryBlossom size={16} />
          <p className="text-xs font-semibold" style={{ color: '#9E8872' }}>
            {isKo ? '나의 여행 꿈' : t('travel_goal')}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex gap-2 mb-4">
          {(['korea','greece'] as const).map(g => (
            <button
              key={g}
              onClick={() => setActiveGoal(g)}
              className="flex-1 py-1.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeGoal === g ? '#C0392B' : '#F0E8D5',
                color:      activeGoal === g ? 'white'   : '#9E8872',
                border:     'none',
                cursor:     'pointer',
              }}
            >
              {goals[g].flag} {isKo ? goals[g].ko : goals[g].name}
            </button>
          ))}
        </div>

        <FlowerBar pct={goalPct} />

        <div className="flex justify-between items-center mt-2 mb-3">
          <span className="text-xs" style={{ color: '#9E8872', fontFamily: 'Inter' }}>
            USD {goal.current.toLocaleString()} / USD {goal.target.toLocaleString()}
          </span>
          <span className="text-xs font-bold" style={{ color: '#C9920A' }}>
            {Math.round(goalPct * 100)}%
          </span>
        </div>

        {/* Quote */}
        <div className="text-center my-2">
          <p className="font-serif text-base font-bold" style={{ color: '#2D2417' }}>
            {quote.ko}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#9E8872' }}>{quote.es}</p>
        </div>

        {monthsToGoal && (
          <p className="text-center text-xs mt-2" style={{ color: '#1A7A6E', fontWeight: 700 }}>
            ✈️ {isKo ? `이 속도라면 약 ${monthsToGoal}개월` : `A este ritmo llegás en: ~${monthsToGoal} meses`} 💫
          </p>
        )}
      </div>

      {/* 4. Este mes */}
      <div className="card">
        <p className="text-xs font-semibold mb-3" style={{ color: '#9E8872' }}>
          📊 {isKo ? '이번 달' : 'Este mes'}
        </p>
        <div className="flex gap-2 mb-3">
          {(['base','bonus','aguinaldo'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              className="flex-1 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: scenario === s ? '#1A7A6E' : '#F0E8D5',
                color:      scenario === s ? 'white'   : '#9E8872',
                border:     'none',
                cursor:     'pointer',
              }}
            >
              {isKo
                ? (s === 'base' ? '기본' : s === 'bonus' ? '보너스' : '상여금')
                : (s === 'base' ? 'Base' : s === 'bonus' ? 'Con bono' : 'Aguinaldo')}
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs" style={{ color: '#9E8872' }}>
              {isKo ? '예측 저축' : 'Ahorro proyectado'}
            </p>
            <p className="font-black text-xl" style={{ color: projColor, fontFamily: 'Inter' }}>
              USD {Math.max(0, projSaving).toFixed(0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: '#9E8872' }}>
              {isKo ? '목표' : 'Meta'}
            </p>
            <p className="font-bold text-lg" style={{ color: '#2D2417', fontFamily: 'Inter' }}>
              USD {settings.monthly_saving_goal_usd}
            </p>
          </div>
          <span style={{ fontSize: '1.5rem' }}>
            {projSaving >= settings.monthly_saving_goal_usd ? '🟢' : projSaving >= settings.monthly_saving_goal_usd * 0.8 ? '🟡' : '🔴'}
          </span>
        </div>
      </div>
    </div>
  )
}
