import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './i18n'
import { PetalBackground } from './components/PetalAnimation'
import { BottomNav } from './components/BottomNav'
import { HomeTab }       from './tabs/HomeTab'
import { ExpensesTab }   from './tabs/ExpensesTab'
import { SavingsTab }    from './tabs/SavingsTab'
import { CalculatorTab } from './tabs/CalculatorTab'
import { SettingsTab }   from './tabs/SettingsTab'
import { useExpenses }   from './hooks/useExpenses'
import { useSettings }   from './hooks/useSettings'
import { useExchangeRates } from './hooks/useExchangeRates'
import { CherryBlossom } from './components/CherryBlossomSVG'
import { loadNotifSettings, hasPermission, scheduleDailyCheckin } from './lib/notifications'

type Tab = 'home' | 'expenses' | 'savings' | 'calculator' | 'settings'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home')

  useEffect(() => {
    // Re-programar notificación diaria si el usuario ya la tenía activa
    const { daily_checkin } = loadNotifSettings()
    if (daily_checkin && hasPermission()) {
      scheduleDailyCheckin('20:00')
    }
  }, [])
  const { t, i18n } = useTranslation()
  const isKo = i18n.language === 'ko'

  const { settings, update } = useSettings()
  const {
    expenses, todayExpenses, todayTotal, weekTotal,
    monthTotal, impulseTotal, topCategory,
    addExpense, removeExpense
  } = useExpenses()
  const { rates, getCripto, manualRate, updateManualRate } = useExchangeRates()

  const criptoRate = getCripto()

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#FBF5E6' }}>
      <PetalBackground />

      {/* Header */}
      <header
        className="relative z-10 flex items-center gap-2 px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, #C0392B 0%, #8B2318 100%)',
          paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
        }}
      >
        <CherryBlossom size={22} />
        <div>
          <h1 className="font-serif font-bold text-lg leading-none" style={{ color: 'white', letterSpacing: '0.02em' }}>
            {isKo ? '하나' : '하나 Hana'}
          </h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {isKo ? '나의 금융 길' : 'Mi camino financiero'}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 relative z-10 overflow-hidden">
        {activeTab === 'home' && (
          <HomeTab
            todayTotal={todayTotal}
            weekTotal={weekTotal}
            settings={settings}
            criptoRate={criptoRate}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesTab
            expenses={expenses}
            todayTotal={todayTotal}
            criptoRate={criptoRate}
            onAdd={addExpense}
            onDelete={removeExpense}
          />
        )}
        {activeTab === 'savings' && (
          <SavingsTab
            settings={settings}
            monthTotal={monthTotal}
            impulseTotal={impulseTotal}
            topCategory={topCategory}
            criptoRate={criptoRate}
          />
        )}
        {activeTab === 'calculator' && <CalculatorTab />}
        {activeTab === 'settings' && (
          <SettingsTab settings={settings} onUpdate={update} manualRate={manualRate} updateManualRate={updateManualRate} />
        )}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
