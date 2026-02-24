module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const PIAPI_KEY = process.env.PIAPI_KEY;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'No task ID provided' });
  }

  try {
    const response = await fetch(`https://api.piapi.ai/api/kling/v1/video/${id}`, {
      headers: {
        'x-api-key': PIAPI_KEY
      }
    });

    const data = await response.json();

    const status = data?.data?.status;
    const output = data?.data?.output?.works?.[0]?.resource?.resource;

    if (status === "succeeded" && output) {
      return res.json({ status: "succeeded", output });
    }

    if (status === "failed") {
      return res.json({ status: "failed" });
    }

    return res.json({ status: "processing" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
