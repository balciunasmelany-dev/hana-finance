// Gestión de notificaciones push locales con Web Notifications API

const NOTIF_KEY = 'hana_notifications'
const TIMER_IDS_KEY = 'hana_notif_timers'

export type NotifSettings = {
  daily_checkin: boolean   // Recordatorio diario 20:00
  budget_alert:  boolean   // Alerta al superar presupuesto semanal
  milestone:     boolean   // Logros de ahorro
}

export function loadNotifSettings(): NotifSettings {
  try {
    const s = localStorage.getItem(NOTIF_KEY)
    if (s) return JSON.parse(s)
  } catch {}
  return { daily_checkin: false, budget_alert: false, milestone: false }
}

export function saveNotifSettings(s: NotifSettings) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(s))
}

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function hasPermission(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

function sendNotif(title: string, body: string, icon = '/icon-192.png') {
  if (!hasPermission()) return
  new Notification(title, { body, icon, badge: '/icon-192.png' })
}

// Programa el recordatorio diario a una hora específica (HH:MM)
// Devuelve el id del timeout para poder cancelarlo
let dailyTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleDailyCheckin(timeStr = '20:00') {
  cancelDailyCheckin()

  const schedule = () => {
    const now    = new Date()
    const [h, m] = timeStr.split(':').map(Number)
    const target = new Date(now)
    target.setHours(h, m, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1)

    const ms = target.getTime() - now.getTime()

    dailyTimer = setTimeout(() => {
      sendNotif(
        '하나 Hana 🌸',
        '¡Es momento de registrar tus gastos del día! ¿Cómo te fue hoy?',
      )
      // Re-programar para mañana
      schedule()
    }, ms)
  }

  schedule()
}

export function cancelDailyCheckin() {
  if (dailyTimer !== null) {
    clearTimeout(dailyTimer)
    dailyTimer = null
  }
}

export function triggerBudgetAlert(spent: number, budget: number) {
  if (!hasPermission()) return
  const pct = Math.round((spent / budget) * 100)
  sendNotif(
    '⚠️ Presupuesto semanal',
    `Llevás gastado $${spent.toLocaleString('es-AR')} (${pct}% del presupuesto).`,
  )
}

export function triggerMilestone(goalName: string, pct: number) {
  if (!hasPermission()) return
  sendNotif(
    '🎉 ¡Meta alcanzada!',
    `Llegaste al ${pct}% de "${goalName}" 🌸`,
  )
}
