import { useState, useEffect } from 'react'
import { getSettings, setSetting } from '../lib/supabase'
import { FINANCIAL_PROFILE } from '../constants/fixedExpenses'

export type AppSettings = {
  name:                    string
  salary_base_usd:         number
  salary_bonus_usd:        number
  weekly_budget_ars:       number
  monthly_saving_goal_usd: number
  emergency_fund_usd:      number
  current_savings_usd:     number
  language:                string
}

const DEFAULTS: AppSettings = {
  name:                    'Mel',
  salary_base_usd:         FINANCIAL_PROFILE.salary_base_usd,
  salary_bonus_usd:        FINANCIAL_PROFILE.salary_bonus_usd,
  weekly_budget_ars:       FINANCIAL_PROFILE.weekly_budget_ars,
  monthly_saving_goal_usd: FINANCIAL_PROFILE.monthly_saving_goal_usd,
  emergency_fund_usd:      FINANCIAL_PROFILE.emergency_fund_goal_usd,
  current_savings_usd:     FINANCIAL_PROFILE.initial_savings_usd,
  language:                'es',
}

const LOCAL_KEY = 'hana_settings'

function loadLocal(): AppSettings {
  try {
    const s = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}')
    return { ...DEFAULTS, ...s }
  } catch { return DEFAULTS }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadLocal)

  useEffect(() => {
    getSettings().then(remote => {
      if (Object.keys(remote).length === 0) return
      const merged: AppSettings = {
        name:                    remote.name                    ?? DEFAULTS.name,
        salary_base_usd:         Number(remote.salary_base_usd)         || DEFAULTS.salary_base_usd,
        salary_bonus_usd:        Number(remote.salary_bonus_usd)        || DEFAULTS.salary_bonus_usd,
        weekly_budget_ars:       Number(remote.weekly_budget_ars)       || DEFAULTS.weekly_budget_ars,
        monthly_saving_goal_usd: Number(remote.monthly_saving_goal_usd) || DEFAULTS.monthly_saving_goal_usd,
        emergency_fund_usd:      Number(remote.emergency_fund_usd)      || DEFAULTS.emergency_fund_usd,
        current_savings_usd:     Number(remote.current_savings_usd)     || DEFAULTS.current_savings_usd,
        language:                remote.language                         ?? DEFAULTS.language,
      }
      setSettings(merged)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(merged))
    })
  }, [])

  const update = async (key: keyof AppSettings, value: string | number) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
    await setSetting(key, String(value))
  }

  return { settings, update }
}
