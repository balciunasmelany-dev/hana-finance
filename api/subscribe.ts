import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = {
  api: { bodyParser: true },
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

async function sbDelete(endpoint: string) {
  return fetch(
    `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
    {
      method: 'DELETE',
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    }
  )
}

async function sbInsert(endpoint: string, data: unknown) {
  return fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify({ endpoint, data }),
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

  try {
    if (req.method === 'POST') {
      const subscription = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription' })

      await sbDelete(subscription.endpoint)

      const r = await sbInsert(subscription.endpoint, subscription)
      const txt = await r.text()

      if (!r.ok) {
        console.error('Insert failed:', r.status, txt)
        return res.status(500).json({ error: txt })
      }

      return res.status(201).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      if (body?.endpoint) await sbDelete(body.endpoint)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).end()

  } catch (err: unknown) {
    console.error('Handler error:', err)
    return res.status(500).json({ error: String(err) })
  }
}
