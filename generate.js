module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, prompt, style, duration } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const PIAPI_KEY = process.env.PIAPI_KEY;
    const HF_API_KEY = process.env.HF_API_KEY;
    const fullPrompt = `${prompt || 'cinematic motion'}, ${style || 'cinematic'} style`;

    // Try PiAPI Kling first
    if (PIAPI_KEY) {
      try {
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
              image_url: image,
              prompt: fullPrompt,
              duration: parseInt(duration) || 5,
              aspect_ratio: '16:9',
              negative_prompt: 'blur, distortion'
            }
          })
        });

        const klingData = await klingRes.json();
        console.log('Kling response:', JSON.stringify(klingData));
        const taskId = klingData?.data?.task_id;

        if (taskId) {
          // Poll for result every 5 seconds, max 30 times
          for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 5000));
            const statusRes = await fetch(`https://api.piapi.ai/api/kling/v1/video/${taskId}`, {
              headers: { 'x-api-key': PIAPI_KEY }
            });
            const statusData = await statusRes.json();
            console.log('Status:', statusData?.data?.status);
            
            if (statusData?.data?.status === 'completed') {
              const videoUrl = statusData?.data?.output?.video_url;
              if (videoUrl) return res.status(200).json({ videoUrl, source: 'kling' });
            }
            if (statusData?.data?.status === 'failed') break;
          }
        }
      } catch (e) {
        console.log('Kling error:', e.message);
      }
    }

    // Fallback: Hugging Face
    if (!HF_API_KEY) {
      return res.status(503).json({ error: 'Service busy. Please try again later.' });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const hfRes = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-video-diffusion-img2vid-xt',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/octet-stream'
        },
        body: imageBuffer
      }
    );

    if (!hfRes.ok) {
      return res.status(503).json({ error: 'AI servers busy. Please try again in a few minutes.' });
    }

    const videoBuffer = await hfRes.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    return res.status(200).json({ 
      videoUrl: `data:video/mp4;base64,${videoBase64}`, 
      source: 'huggingface' 
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
