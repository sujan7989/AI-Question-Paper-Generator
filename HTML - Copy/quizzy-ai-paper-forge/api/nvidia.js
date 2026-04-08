// Vercel serverless function - proxies NVIDIA NIM API with streaming
import { setCors } from './_cors.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.VITE_NVIDIA_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'NVIDIA API key not configured' });

  try {
    // Force stream:false and use a smaller model that responds faster
    const body = {
      ...req.body,
      stream: false,
      max_tokens: Math.min(req.body.max_tokens || 3000, 3000),
    };

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
