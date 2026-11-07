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

  // ROBUST STREAMING ROUTE with full RFC 7233 Range Support (Essential for MP3 seeking & metadata)
  app.all(['/*.mp3', '/*.wav'], (req, res, next) => {
    const filePath = path.join(process.cwd(), 'public', decodeURIComponent(req.path));

    if (!fs.existsSync(filePath)) {
      return next();
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const isWav = req.path.toLowerCase().endsWith('.wav');
    const contentType = isWav ? 'audio/wav' : 'audio/mpeg';

    // Standard headers for all audio streaming
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range, Accept-Ranges, Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    const range = req.headers.range;

    if (range) {
      // Parse Range header according to RFC 7233: bytes=start-end, bytes=start-, bytes=-suffix
      const matches = range.match(/bytes=(\d*)-(\d*)/);
      if (!matches) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).send('Requested range not satisfiable');
        return;
      }

      let start: number;
      let end: number;

      if (matches[1] === '' && matches[2] !== '') {
        // Suffix range: bytes=-128 (last 128 bytes, e.g. ID3v1 trailer check by browsers for MP3)
        const suffix = parseInt(matches[2], 10);
        start = Math.max(0, fileSize - suffix);
        end = fileSize - 1;
      } else if (matches[1] !== '' && matches[2] === '') {
        // Open range: bytes=500- (from 500 to end of file)
        start = parseInt(matches[1], 10);
        end = fileSize - 1;
      } else {
        // Closed range: bytes=0-1000
        start = parseInt(matches[1], 10);
        end = parseInt(matches[2], 10);
      }

      if (isNaN(start) || isNaN(end) || start > end || start >= fileSize) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).send('Requested range not satisfiable');
        return;
      }

      end = Math.min(end, fileSize - 1);
      const chunkSize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const fileStream = fs.createReadStream(filePath, { start, end });
      fileStream.on('error', () => {
        if (!res.headersSent) res.status(500).end();
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      });

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', () => {
        if (!res.headersSent) res.status(500).end();
      });
      fileStream.pipe(res);
    }
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
