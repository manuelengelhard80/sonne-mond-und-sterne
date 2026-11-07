import express from 'express';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Audio proxy route to stream Dropbox WAV file without CORS restrictions
  app.get('/api/proxy-audio', async (req, res) => {
    try {
      const dropboxUrl = 'https://www.dropbox.com/scl/fi/g6r348wj1jvmudtzjfujd/Die-Geschichte-von-Sonne-Mond-und-Sternen.wav?rlkey=96zbrlfjd9mxkmgh1dnonexy1&st=ulwscj36&raw=1';
      const response = await fetch(dropboxUrl);
      if (!response.ok || !response.body) {
        return res.status(response.status || 500).send('Failed to fetch audio from Dropbox');
      }

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (err) {
      console.error('Audio proxy error:', err);
      res.status(500).send('Error proxying audio');
    }
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
