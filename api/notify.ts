import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:balciunasmelany@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo Vercel cron puede llamar esto (header automático en crons de Vercel)
  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  const hasSecret    = req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron && !hasSecret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  const db = createClient(supabaseUrl, supabaseKey)
  const { data: subs, error } = await db.from('push_subscriptions').select('data')

  if (error) return res.status(500).json({ error: error.message })

  const payload = JSON.stringify({
    title: '하나 Hana 🌸',
    body: '¡Es momento de registrar tus gastos del día! ¿Cómo te fue hoy?',
  })

  let sent = 0
  const stale: string[] = []

  for (const row of subs ?? []) {
    try {
      await webpush.sendNotification(row.data, payload)
      sent++
    } catch (err: unknown) {
      // 410 Gone = suscripción expirada, limpiar
      if ((err as { statusCode?: number }).statusCode === 410) {
        stale.push(row.data.endpoint)
      }
    }
  }

  // Limpiar suscripciones expiradas
  for (const endpoint of stale) {
    await db.from('push_subscriptions').delete().eq('endpoint', endpoint)
  }

  return res.json({ sent, stale: stale.length })
}
