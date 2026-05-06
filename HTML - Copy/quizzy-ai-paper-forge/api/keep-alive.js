// Keep-alive endpoint — pinged by cron-job.org every 3 days
// This prevents Supabase free tier from pausing due to inactivity

import { setCors } from './_cors.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Ping Supabase with a lightweight query
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ status: 'error', message: 'Missing env vars' });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    return res.status(200).json({
      status: 'alive',
      supabase: response.ok ? 'online' : 'responded',
      timestamp: new Date().toISOString(),
      message: 'QuestionCraft AI is alive and Supabase is active.',
    });

  } catch (error) {
    return res.status(200).json({
      status: 'pinged',
      timestamp: new Date().toISOString(),
      message: 'Keep-alive ping sent.',
    });
  }
}
