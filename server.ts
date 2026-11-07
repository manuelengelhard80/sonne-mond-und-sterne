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

  const dropboxUrl = 'https://www.dropbox.com/scl/fi/g6r348wj1jvmudtzjfujd/Die-Geschichte-von-Sonne-Mond-und-Sternen.wav?rlkey=96zbrlfjd9mxkmgh1dnonexy1&st=ulwscj36&raw=1';
  
  let cachedAudioBuffer: Buffer | null = null;
  let audioFetchPromise: Promise<Buffer | null> | null = null;

  async function fetchAndCacheAudio(): Promise<Buffer | null> {
    if (cachedAudioBuffer) return cachedAudioBuffer;
    if (audioFetchPromise) return audioFetchPromise;

    audioFetchPromise = (async () => {
      try {
        console.log('Fetching audio from Dropbox...');
        const response = await fetch(dropboxUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) {
          console.error('Failed to fetch audio from Dropbox, status:', response.status);
          return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        cachedAudioBuffer = Buffer.from(arrayBuffer);
        console.log('Audio cached successfully, size:', cachedAudioBuffer.length);
        return cachedAudioBuffer;
      } catch (err) {
        console.error('Error pre-fetching audio:', err);
        return null;
      }
    })();

    return audioFetchPromise;
  }

  // Pre-fetch on startup
  fetchAndCacheAudio();

  // Audio proxy route with in-memory cache and Range request support for instant playback online & mobile
  app.get('/api/proxy-audio', async (req, res) => {
    try {
      let buffer = cachedAudioBuffer;
      if (!buffer) {
        buffer = await fetchAndCacheAudio();
      }

      if (!buffer) {
        // Fallback retry
        const response = await fetch(dropboxUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (response.ok) {
          const ab = await response.arrayBuffer();
          buffer = Buffer.from(ab);
          cachedAudioBuffer = buffer;
        } else {
          return res.status(500).send('Audio file unavailable');
        }
      }

      const total = buffer.length;
      const range = req.headers.range;

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Accept-Ranges', 'bytes');

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
        const chunksize = (end - start) + 1;
        const chunk = buffer.subarray(start, end + 1);

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'audio/wav',
        });
        return res.end(chunk);
      } else {
        res.writeHead(200, {
          'Content-Length': total,
          'Content-Type': 'audio/wav',
        });
        return res.end(buffer);
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
