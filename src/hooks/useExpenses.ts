import { useState, useEffect, useCallback } from 'react'
import { Expense, getExpenses, insertExpense, deleteExpense } from '../lib/supabase'

function monthLabel() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function weekNumber(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1)
  return Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
}

const LOCAL_KEY = 'hana_expenses'

function loadLocal(): Expense[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') } catch { return [] }
}
function saveLocal(data: Expense[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const remote = await getExpenses(monthLabel())
    if (remote.length > 0) {
      setExpenses(remote)
      saveLocal(remote)
    } else {
      setExpenses(loadLocal())
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addExpense = async (e: Omit<Expense, 'date' | 'week_number' | 'month_label'>) => {
    const now  = new Date()
    const full: Expense = {
      ...e,
      date:        todayStr(),
      week_number: weekNumber(now),
      month_label: monthLabel(),
    }
    const saved = await insertExpense(full)
    const newList = [saved ?? { ...full, id: crypto.randomUUID() }, ...expenses]
    setExpenses(newList)
    saveLocal(newList)
    return saved
  }

  const removeExpense = async (id: string) => {
    await deleteExpense(id)
    const newList = expenses.filter(e => e.id !== id)
    setExpenses(newList)
    saveLocal(newList)
  }

  const todayExpenses  = expenses.filter(e => e.date === todayStr())
  const todayTotal     = todayExpenses.reduce((s, e) => s + e.amount_ars, 0)
  const monthTotal     = expenses.reduce((s, e) => s + e.amount_ars, 0)

  const now     = new Date()
  const weekDay = now.getDay() === 0 ? 7 : now.getDay()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - weekDay + 1)
  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekTotal = expenses
    .filter(e => e.date >= weekStartStr)
    .reduce((s, e) => s + e.amount_ars, 0)

  const impulseTotal = expenses
    .filter(e => e.is_impulse)
    .reduce((s, e) => s + e.amount_ars, 0)

  const topCategory = (() => {
    const map: Record<string, number> = {}
    expenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount_ars })
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  })()

  return {
    expenses, todayExpenses, todayTotal, monthTotal,
    weekTotal, impulseTotal, topCategory,
    loading, reload: load, addExpense, removeExpense
  }
}
