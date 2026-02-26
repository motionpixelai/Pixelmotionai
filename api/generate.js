const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.VEO_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { prompt, image_url, tail_image_url, aspect_ratio, duration, resolution, generate_audio, task_type } = req.body;

    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt zaroori hai!' });
    if (!image_url?.trim()) return res.status(400).json({ error: 'Image URL zaroori hai!' });

    const body = {
      model: 'veo3.1',
      task_type: task_type || 'veo3.1-video-fast',
      input: {
        prompt: prompt.trim(),
        image_url: image_url.trim(),
        aspect_ratio: aspect_ratio || '16:9',
        duration: duration || '8s',
        resolution: resolution || '720p',
        generate_audio: generate_audio === true,
      },
    };

    if (tail_image_url?.trim()) body.input.tail_image_url = tail_image_url.trim();

    const response = await fetch('https://api.piapi.ai/api/v1/task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'API Error' });

    return res.status(200).json(data);
  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
