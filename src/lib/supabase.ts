import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL  as string
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = (url && key)
  ? createClient(url, key)
  : null

export type Expense = {
  id?:          string
  date:         string
  description:  string
  amount_ars:   number
  method:       'debito' | 'tarjeta'
  category:     string
  is_impulse:   boolean
  usd_equiv?:   number
  cripto_rate?: number
  week_number?: number
  month_label?: string
  created_at?:  string
}

export type SavingsGoal = {
  id?:          string
  name:         string
  name_ko?:     string
  emoji?:       string
  target_usd:   number
  current_usd:  number
  is_active?:   boolean
}

export async function getExpenses(monthLabel?: string): Promise<Expense[]> {
  if (!supabase) return []
  let q = supabase.from('expenses').select('*').order('created_at', { ascending: false })
  if (monthLabel) q = q.eq('month_label', monthLabel)
  const { data } = await q
  return data ?? []
}

export async function insertExpense(e: Expense): Promise<Expense | null> {
  if (!supabase) return null
  const { data } = await supabase.from('expenses').insert(e).select().single()
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  if (!supabase) return
  await supabase.from('expenses').delete().eq('id', id)
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  if (!supabase) return []
  const { data } = await supabase.from('savings_goals').select('*').eq('is_active', true)
  return data ?? []
}

export async function updateSavingsGoal(id: string, current_usd: number): Promise<void> {
  if (!supabase) return
  await supabase.from('savings_goals').update({ current_usd }).eq('id', id)
}

export async function getSettings(): Promise<Record<string, string>> {
  if (!supabase) return {}
  const { data } = await supabase.from('settings').select('*')
  if (!data) return {}
  return Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]))
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (!supabase) return
  await supabase.from('settings').upsert({ key, value })
}
