// This endpoint is intentionally disabled.
// The NVIDIA key should never be sent to the browser.
// All NVIDIA calls go through /api/nvidia proxy instead.
export default function handler(req, res) {
  return res.status(403).json({ error: 'Direct key access is disabled for security.' });
}
