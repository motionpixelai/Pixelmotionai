const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.VEO_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { taskId } = req.query;
    if (!taskId) return res.status(400).json({ error: 'Task ID required' });

    const response = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
      method: 'GET',
      headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'Status error' });

    return res.status(200).json(data);
  } catch (err) {
    console.error('Status error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
