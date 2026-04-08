/**
 * Shared CORS helper for all API routes.
 * Allows requests only from the production domain and localhost dev.
 */
const ALLOWED_ORIGINS = [
  'https://quizzy-ai-paper-forge.vercel.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

export function setCors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}
