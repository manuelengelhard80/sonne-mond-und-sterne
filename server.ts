import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Dedicated endpoint for local meditation files with full Range support
  app.get('/meditations/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'public', 'meditations', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // Keep the generic proxy for any other external audio
  app.get('/api/proxy-audio', async (req, res) => {
    try {
      let dropboxUrl = req.query.url as string;
      if (!dropboxUrl) {
        dropboxUrl = 'https://www.dropbox.com/scl/fi/g6r348wj1jvmudtzjfujd/Die-Geschichte-von-Sonne-Mond-und-Sternen.wav?rlkey=96zbrlfjd9mxkmgh1dnonexy1&st=ulwscj36&raw=1';
      } else {
        if (dropboxUrl.includes('dl=0')) {
          dropboxUrl = dropboxUrl.replace('dl=0', 'raw=1');
        } else if (!dropboxUrl.includes('raw=1')) {
          dropboxUrl += (dropboxUrl.includes('?') ? '&' : '?') + 'raw=1';
        }
      }

      const fetchHeaders: HeadersInit = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      if (req.headers.range) {
        fetchHeaders['Range'] = req.headers.range;
      }

      const response = await fetch(dropboxUrl, { headers: fetchHeaders });
      if (!response.ok && response.status !== 206) {
        return res.status(response.status || 500).send('Failed to fetch audio');
      }

      const contentType = response.headers.get('content-type') || (dropboxUrl.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Accept-Ranges', 'bytes');

      if (response.headers.get('content-range')) {
        res.setHeader('Content-Range', response.headers.get('content-range')!);
      }
      if (response.headers.get('content-length')) {
        res.setHeader('Content-Length', response.headers.get('content-length')!);
      }
      
      res.status(response.status === 206 ? 206 : 200);

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
        res.end(Buffer.from(arrayBuffer));
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
