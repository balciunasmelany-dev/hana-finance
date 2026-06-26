import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

webpush.setVapidDetails(
  'mailto:balciunasmelany@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  const hasSecret    = req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`
  if (!isVercelCron && !hasSecret) return res.status(401).json({ error: 'Unauthorized' })

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  const r = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=data`, {
    headers: {
      'apikey':        SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  })

  if (!r.ok) return res.status(500).json({ error: await r.text() })

  const subs: Array<{ data: webpush.PushSubscription }> = await r.json()

  const payload = JSON.stringify({
    title: '하나 Hana 🌸',
    body:  '¡Es momento de registrar tus gastos del día! ¿Cómo te fue hoy?',
  })

  let sent = 0
  const stale: string[] = []

  for (const row of subs) {
    try {
      await webpush.sendNotification(row.data, payload)
      sent++
    } catch (err: unknown) {
      if ((err as { statusCode?: number }).statusCode === 410) {
        stale.push(row.data.endpoint)
      }
    }
  }

  for (const endpoint of stale) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
      {
        method: 'DELETE',
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
      }
    )
  }

  return res.json({ sent, stale: stale.length })
}
