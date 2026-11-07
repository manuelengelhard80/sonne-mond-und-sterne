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

  // Audio proxy route to stream Dropbox WAV file with range support and instant streaming
  app.get('/api/proxy-audio', async (req, res) => {
    try {
      const dropboxUrl = 'https://www.dropbox.com/scl/fi/g6r348wj1jvmudtzjfujd/Die-Geschichte-von-Sonne-Mond-und-Sternen.wav?rlkey=96zbrlfjd9mxkmgh1dnonexy1&st=ulwscj36&raw=1';
      
      const fetchHeaders: HeadersInit = {};
      if (req.headers.range) {
        fetchHeaders['Range'] = req.headers.range;
      }

      const response = await fetch(dropboxUrl, { headers: fetchHeaders });
      if (!response.ok && response.status !== 206) {
        return res.status(response.status || 500).send('Failed to fetch audio from Dropbox');
      }

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Accept-Ranges', 'bytes');

      if (response.headers.get('content-range')) {
        res.setHeader('Content-Range', response.headers.get('content-range')!);
      }
      if (response.headers.get('content-length')) {
        res.setHeader('Content-Length', response.headers.get('content-length')!);
      }
      if (response.status === 206) {
        res.status(206);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                res.end();
                break;
              }
              res.write(value);
            }
          } catch (streamErr) {
            console.error('Stream reading error:', streamErr);
            res.end();
          }
        };
        pump();
      } else {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.end(buffer);
      }
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
