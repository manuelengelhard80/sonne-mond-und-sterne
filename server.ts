import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import webpush from 'web-push';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// VAPID keys generated for this applet
const VAPID_PUBLIC_KEY = 'BNYNBlRJ_waZlCuJnNHZEn2mbRac1k5CVJqwRJmRmwYp-JcvnxkaQoYDHDl0p4i4dA63zJ1OrHRq4Nn0YFzsv3k';
const VAPID_PRIVATE_KEY = '-VzuUgxsHgHRf2b_gHPVaSoexia1OOiDXitXWDdeMsk';

webpush.setVapidDetails(
  'mailto:manuel.engelhard80@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Initialize Firebase Admin (uses default credentials in Google Cloud environment)
const firebaseApp = getApps().length === 0 ? initializeApp() : getApp();
const db = getFirestore(firebaseApp);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Web Push Public Key endpoint
  app.get('/api/vapid-public-key', (_req, res) => {
    res.send(VAPID_PUBLIC_KEY);
  });

  // Web Push Ping endpoint: Sends a push to all users with the target role
  app.post('/api/push-ping', async (req, res) => {
    const { targetRole, title, body, navTab, tag } = req.body;
    if (!targetRole) {
      return res.status(400).send('Missing targetRole');
    }

    try {
      // Find all users with this role and a valid push subscription
      const usersSnap = await db.collection('user_roles')
        .where('role', '==', targetRole)
        .get();

      if (usersSnap.empty) {
        return res.status(200).send({ success: true, sentTo: 0 });
      }

      let sentCount = 0;
      const payload = JSON.stringify({
        title,
        body,
        tag: tag || `partner-${Date.now()}`,
        navTab: navTab || null,
        icon: '/app-icon-full.png',
        badge: '/badge-icon.png'
      });

      const pushPromises = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        if (userData.pushSubscription) {
          pushPromises.push(
            webpush.sendNotification(userData.pushSubscription, payload)
              .then(() => sentCount++)
              .catch(err => {
                console.warn(`Push failed for user ${userDoc.id}:`, err.statusCode);
                // If the subscription is no longer valid, we could remove it here
                if (err.statusCode === 410 || err.statusCode === 404) {
                   db.collection('user_roles').doc(userDoc.id).update({
                     pushSubscription: FieldValue.delete()
                   }).catch(() => {});
                }
              })
          );
        }
      }

      await Promise.all(pushPromises);
      res.send({ success: true, sentTo: sentCount });
    } catch (err) {
      console.error('Error sending push ping:', err);
      res.status(500).send('Internal server error');
    }
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Ensure search engines do not index this private site (HTTP header level)
  app.use((req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    next();
  });

  // Serve robots.txt directly to block all crawlers
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow: /\n');
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
