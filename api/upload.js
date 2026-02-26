const fetch = require('node-fetch');
const FormData = require('form-data');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const IMGBB_KEY = process.env.IMGBB_API_KEY;
  if (!IMGBB_KEY) return res.status(500).json({ error: 'ImgBB API key not configured' });

  try {
    const { image } = req.body; // base64 string
    if (!image) return res.status(400).json({ error: 'Image data zaroori hai!' });

    // Remove base64 prefix if present (data:image/jpeg;base64,)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const form = new FormData();
    form.append('image', base64Data);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
      method: 'POST',
      body: form,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return res.status(400).json({ error: data.error?.message || 'ImgBB upload failed' });
    }

    return res.status(200).json({
      success: true,
      url: data.data.url,
      display_url: data.data.display_url,
    });

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
};

