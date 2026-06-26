// Gestión de Web Push real (VAPID) + fallback a Notification API local

const NOTIF_KEY   = 'hana_notifications'
const VAPID_KEY   = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type NotifSettings = {
  daily_checkin: boolean
  budget_alert:  boolean
  milestone:     boolean
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

export function hasPermission(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

// ── Web Push (server-side, funciona con app cerrada) ──────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function subscribeWebPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  if (!VAPID_KEY) return false

  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
    })

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    })

    return res.ok
  } catch {
    return false
  }
}

export async function unsubscribeWebPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await fetch('/api/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
    await sub.unsubscribe()
  } catch {}
}

// ── Fallback: notificación local (solo funciona con app abierta) ──────────────

let dailyTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleDailyCheckin(timeStr = '20:00') {
  cancelDailyCheckin()
  const schedule = () => {
    const now    = new Date()
    const [h, m] = timeStr.split(':').map(Number)
    const target = new Date(now)
    target.setHours(h, m, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1)
    dailyTimer = setTimeout(() => {
      if (hasPermission()) {
        new Notification('하나 Hana 🌸', {
          body: '¡Es momento de registrar tus gastos del día!',
          icon: '/icon-192.png',
        })
      }
      schedule()
    }, target.getTime() - now.getTime())
  }
  schedule()
}

export function cancelDailyCheckin() {
  if (dailyTimer !== null) { clearTimeout(dailyTimer); dailyTimer = null }
}

export function triggerBudgetAlert(spent: number, budget: number) {
  if (!hasPermission()) return
  const pct = Math.round((spent / budget) * 100)
  new Notification('⚠️ Presupuesto semanal', {
    body: `Llevás gastado $${spent.toLocaleString('es-AR')} (${pct}% del presupuesto).`,
    icon: '/icon-192.png',
  })
}

export function triggerMilestone(goalName: string, pct: number) {
  if (!hasPermission()) return
  new Notification('🎉 ¡Meta alcanzada!', {
    body: `Llegaste al ${pct}% de "${goalName}" 🌸`,
    icon: '/icon-192.png',
  })
}
