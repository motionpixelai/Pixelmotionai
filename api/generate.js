module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const PIAPI_KEY = process.env.PIAPI_KEY;
  const IMGBB_KEY = process.env.IMGBB_KEY;

  if (!PIAPI_KEY || !IMGBB_KEY) {
    return res.status(500).json({ error: "Server config error: API keys missing" });
  }

  try {
    let body = req.body;

if (!body || typeof body === "string") {
  let raw = "";
  await new Promise(resolve => {
    req.on("data", chunk => raw += chunk);
    req.on("end", resolve);
  });
  body = raw ? JSON.parse(raw) : {};
}
    const { image, prompt, style, duration } = body;

    if (!image) return res.status(400).json({ error: 'No image provided' });

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `image=${encodeURIComponent(base64Data)}`
    });

    const imgbbData = await imgbbRes.json();
    const imageUrl = imgbbData?.data?.url;

    if (!imageUrl)
      return res.status(500).json({ error: 'Image upload failed. Try again.' });

    const klingRes = await fetch('https://api.piapi.ai/api/kling/v1/video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PIAPI_KEY
      },
      body: JSON.stringify({
        model: 'kling-v1',
        task_type: 'img2video',
        input: {
          image_url: imageUrl,
          prompt: `${prompt || 'high quality cinematic motion animation'}, ${style || 'cinematic'} style`,
          duration: parseInt(duration) || 5,
          aspect_ratio: '16:9'
        }
      })
    });

    const klingData = await klingRes.json();
    const taskId = klingData?.data?.task_id;

    if (!taskId)
      return res.status(500).json({ error: 'Could not start video generation.' });

    return res.status(200).json({ id: taskId });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
