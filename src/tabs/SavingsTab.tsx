import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { CherryBlossom } from '../components/CherryBlossomSVG'
import { FINANCIAL_PROFILE } from '../constants/fixedExpenses'
import type { AppSettings } from '../hooks/useSettings'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

type Props = {
  settings:    AppSettings
  monthTotal:  number
  impulseTotal:number
  topCategory: string
  criptoRate:  number | null
}

function FlowerBar({ pct }: { pct: number }) {
  const filled = Math.round(pct * 10)
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} style={{ fontSize: '1.2rem', opacity: i < filled ? 1 : 0.2 }}>🌸</span>
      ))}
    </div>
  )
}

export function SavingsTab({ settings, monthTotal, impulseTotal, topCategory, criptoRate }: Props) {
  const { t, i18n } = useTranslation()
  const isKo = i18n.language === 'ko'

  const current = settings.current_savings_usd
  const goals = [
    { id: 'korea',  name: 'Corea del Sur', ko: '한국', flag: '🇰🇷', target: 5000 },
    { id: 'greece', name: 'Grecia',         ko: '그리스', flag: '🇬🇷', target: 4000 },
  ]

  const monthly = settings.monthly_saving_goal_usd
  const cripto  = criptoRate ?? 1200

  // Ahorro real del mes (simplificado: lo que no se gastó)
  const monthlyArsReal  = monthTotal
  const monthlyUsdReal  = criptoRate ? monthlyArsReal / cripto : 0
  const projSavingUsd   = settings.salary_base_usd - FINANCIAL_PROFILE.usd_subscriptions - monthlyUsdReal
  const reachedGoal     = projSavingUsd >= monthly
  const gap             = monthly - projSavingUsd

  // Consejo automático
  const autoTip = (() => {
    if (impulseTotal > 50000) {
      const half = Math.round(impulseTotal / 2)
      return isKo
        ? `계획 없는 지출이 $${half.toLocaleString('es-AR')} ARS였어요. 절반만 줄이면 목표 달성!`
        : `Tuviste $${impulseTotal.toLocaleString('es-AR')} en gastos no planificados. Reducirlos a la mitad el mes que viene alcanzaría.`
    }
    const tips: Record<string, string> = {
      home:      isKo ? '생활비가 가장 높았어요. 기다릴 수 있는 게 있었을까요?' : 'Hogar fue tu mayor gasto variable. ¿Había algo que podía esperar?',
      clothes:   isKo ? '의류비가 많았어요. 이번 달은 쇼핑 없이 도전해볼까요?' : 'Ropa sumó más de lo habitual. ¿Probamos un mes sin compras de ropa?',
      leisure:   isKo ? '여가 지출이 많았어요. 괜찮아요, 삶의 일부예요 😊' : 'Salidas y ocio pesaron este mes. Nada grave, es parte de vivir 😊',
    }
    return tips[topCategory] ?? (isKo
      ? `거의 다 왔어요! ${topCategory} 지출을 조금 줄이면 목표 달성해요. 화이팅! 💪`
      : `Estuviste muy cerca. Un pequeño ajuste en ${topCategory} y lo alcanzás. 화이팅! 💪`)
  })()

  // Proyección 6 meses
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() + i)
    return d.toLocaleDateString(isKo ? 'ko-KR' : 'es-AR', { month: 'short' })
  })
  const projected = labels.map((_, i) => current + i * monthly)

  const chartData = {
    labels,
    datasets: [{
      label: isKo ? '저축 예측' : 'Ahorro proyectado',
      data:  projected,
      borderColor:     '#1A7A6E',
      backgroundColor: 'rgba(26,122,110,0.08)',
      fill:  true,
      tension: 0.4,
      pointBackgroundColor: '#1A7A6E',
      pointRadius: 4,
    }]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => `USD ${ctx.parsed.y.toFixed(0)}`
        }
      }
    },
    scales: {
      y: {
        grid: { color: '#F0E8D5' },
        ticks: { callback: (v: number | string) => `$${v}` }
      },
      x: { grid: { display: false } }
    },
    annotation: {}
  }

  const emergencyPct = Math.min(current / settings.emergency_fund_usd, 1)

  return (
    <div className="tab-scroll h-full pb-24 px-4 pt-2 space-y-4">

      {/* Metas de viaje */}
      {goals.map(g => {
        const pct = Math.min(current / g.target, 1)
        const monthsLeft = monthly > 0 ? Math.ceil((g.target - current) / monthly) : null
        return (
          <div key={g.id} className="card" style={{ background: 'linear-gradient(160deg, #FFF0F5 0%, #FBF5E6 100%)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: '1.5rem' }}>{g.flag}</span>
              <div>
                <p className="font-serif font-bold text-base" style={{ color: '#2D2417' }}>
                  {isKo ? g.ko : g.name}
                </p>
                <p className="text-xs" style={{ color: '#9E8872' }}>
                  {isKo ? '✈️ 여행 꿈' : '✈️ Meta de viaje'}
                </p>
              </div>
            </div>
            <FlowerBar pct={pct} />
            <div className="flex justify-between mt-2">
              <span className="text-xs" style={{ color: '#9E8872', fontFamily: 'Inter' }}>
                USD {current.toLocaleString()} / USD {g.target.toLocaleString()}
              </span>
              <span className="text-xs font-bold" style={{ color: '#C9920A' }}>
                {Math.round(pct * 100)}%
              </span>
            </div>
            {monthsLeft && (
              <p className="text-xs mt-2 text-center font-semibold" style={{ color: '#1A7A6E' }}>
                {isKo ? `약 ${monthsLeft}개월 후 도착! 💫` : `~${monthsLeft} meses para llegar 💫`}
              </p>
            )}
          </div>
        )
      })}

      {/* Meta mensual */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <CherryBlossom size={14} />
          <p className="text-xs font-semibold" style={{ color: '#9E8872' }}>
            {isKo ? t('monthly_goal') : t('monthly_goal')}
          </p>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs" style={{ color: '#9E8872' }}>{isKo ? t('projected') : t('projected')}</p>
            <p className="font-black text-2xl" style={{
              fontFamily: 'Inter',
              color: reachedGoal ? '#00C47D' : '#E53E3E'
            }}>
              USD {Math.max(0, projSavingUsd).toFixed(0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: '#9E8872' }}>{isKo ? '목표' : 'Meta'}</p>
            <p className="font-bold text-xl" style={{ fontFamily: 'Inter', color: '#2D2417' }}>
              USD {monthly}
            </p>
          </div>
        </div>

        {!reachedGoal && (
          <div className="mt-4 p-3 rounded-2xl" style={{ background: '#FFF0F5' }}>
            <p className="font-serif font-bold text-sm mb-1" style={{ color: '#C0392B' }}>
              🌸 {isKo ? t('almost_there') : t('almost_there')}
            </p>
            <p className="text-xs mb-2" style={{ color: '#5C4A3A' }}>
              {isKo ? `USD ${gap.toFixed(0)} 부족했어요.` : `Te faltaron USD ${gap.toFixed(0)} para la meta.`}
            </p>
            <p className="text-xs" style={{ color: '#5C4A3A' }}>{autoTip}</p>
            <p className="text-xs mt-2 font-semibold" style={{ color: '#1A7A6E' }}>
              {t('next_month_tip')} · {isKo ? '다음 달엔 더 잘할 거예요 🌸' : '다음 달엔 더 잘할 거예요 🌸'}
            </p>
          </div>
        )}
      </div>

      {/* Fondo de emergencia */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <span>🛡️</span>
          <p className="text-xs font-semibold" style={{ color: '#9E8872' }}>
            {isKo ? t('emergency_fund') : t('emergency_fund')} · 비상금
          </p>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-black text-xl" style={{ fontFamily: 'Inter', color: '#2C5F8A' }}>
            USD {current.toLocaleString()}
          </span>
          <span className="font-bold" style={{ fontFamily: 'Inter', color: '#9E8872' }}>
            / USD {settings.emergency_fund_usd.toLocaleString()}
          </span>
        </div>
        <div className="h-3 rounded-full mb-1" style={{ background: '#E0D8CC' }}>
          <div
            className="h-3 rounded-full transition-all"
            style={{ width: `${emergencyPct * 100}%`, background: '#2C5F8A' }}
          />
        </div>
        <p className="text-xs" style={{ color: '#9E8872' }}>
          {Math.round(emergencyPct * 100)}% — {isKo ? '3–4개월 지출 = 진짜 안정감' : '3–4 meses de gastos = tranquilidad real'}
        </p>
      </div>

      {/* Gráfico */}
      <div className="card">
        <p className="text-xs font-semibold mb-3" style={{ color: '#9E8872' }}>
          📈 {isKo ? t('projection') : t('projection')}
        </p>
        <Line data={chartData} options={chartOptions as Parameters<typeof Line>[0]['options']} />
        <div className="flex gap-4 mt-3 justify-center text-xs" style={{ color: '#9E8872' }}>
          <span>🛡️ USD {settings.emergency_fund_usd.toLocaleString()}</span>
          <span>✈️ USD 5.000</span>
        </div>
      </div>
    </div>
  )
}
