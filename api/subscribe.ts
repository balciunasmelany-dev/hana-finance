import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const supabaseUrl  = process.env.VITE_SUPABASE_URL
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  const db = createClient(supabaseUrl, supabaseKey)

  if (req.method === 'POST') {
    const subscription = req.body
    if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription' })

    // Borrar si ya existe y reinsertar
    await db.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
    const { error } = await db
      .from('push_subscriptions')
      .insert({ endpoint: subscription.endpoint, data: subscription })

    if (error) {
      console.error('Supabase error:', JSON.stringify(error))
      return res.status(500).json({ error: error.message, code: error.code, details: error.details })
    }
    return res.status(201).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body ?? {}
    if (endpoint) await db.from('push_subscriptions').delete().eq('endpoint', endpoint)
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
