import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

function sbFetch(path: string, method: string, body?: unknown) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer':        'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  if (req.method === 'POST') {
    const subscription = req.body
    if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription' })

    // Borrar si ya existe
    await sbFetch(
      `/push_subscriptions?endpoint=eq.${encodeURIComponent(subscription.endpoint)}`,
      'DELETE'
    )

    // Insertar nueva
    const r = await sbFetch('/push_subscriptions', 'POST', {
      endpoint: subscription.endpoint,
      data: subscription,
    })

    if (!r.ok) {
      const txt = await r.text()
      console.error('Supabase insert error:', txt)
      return res.status(500).json({ error: txt })
    }

    return res.status(201).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body ?? {}
    if (endpoint) {
      await sbFetch(
        `/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
        'DELETE'
      )
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
