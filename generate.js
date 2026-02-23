export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, prompt } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const HF_API_KEY = process.env.HF_API_KEY;

    if (!HF_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Try primary model first
    let videoData = await tryModel(
      'stabilityai/stable-video-diffusion-img2vid-xt',
      imageBuffer,
      HF_API_KEY
    );

    // If primary fails, try backup model
    if (!videoData) {
      videoData = await tryModel(
        'damo-vilab/i2vgen-xl',
        imageBuffer,
        HF_API_KEY
      );
    }

    if (!videoData) {
      return res.status(503).json({
        error: 'Server busy',
        message: 'Our AI servers are busy right now. Please try again in a moment.'
      });
    }

    // Return video as base64
    const videoBase64 = videoData.toString('base64');
    return res.status(200).json({
      success: true,
      video: `data:video/mp4;base64,${videoBase64}`
    });

  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({
      error: 'Generation failed',
      message: 'Something went wrong. Please try again.'
    });
  }
}

async function tryModel(modelId, imageBuffer, apiKey) {
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${modelId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
      }
    );

    if (!response.ok) {
      console.log(`Model ${modelId} failed:`, response.status);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('video')) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    return null;
  } catch (err) {
    console.log(`Model ${modelId} error:`, err.message);
    return null;
  }
}
