module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const PIAPI_KEY = process.env.PIAPI_KEY;
  const taskId = req.query.id;

  if (!taskId) return res.status(400).json({ error: 'No task ID' });

  try {
    const statusRes = await fetch(`https://api.piapi.ai/api/kling/v1/video/${taskId}`, {
      headers: { 'x-api-key': PIAPI_KEY }
    });
    const data = await statusRes.json();
    const status = data?.data?.status;
    
    if (status === 'completed') {
      const videoUrl = data?.data?.output?.video_url || 
                       data?.data?.output?.works?.[0]?.resource?.resource;
      if (videoUrl) return res.status(200).json({ status: 'succeeded', output: videoUrl });
      return res.status(200).json({ status: 'failed' });
    }
    if (status === 'failed') return res.status(200).json({ status: 'failed' });
    return res.status(200).json({ status: 'processing' });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
