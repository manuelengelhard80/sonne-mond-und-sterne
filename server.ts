import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import * as webpush from 'web-push';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));

// VAPID Key Pair for Web Push
export const VAPID_PUBLIC_KEY = 'BKDGl7c3RPjL_Te5Ysx--vJgqravzRooqxnjFGj9d8Ftf9aRFmLCkm_yzB1j920womuLxlXQ0nXfavVFq_8VNYU';
export const VAPID_PRIVATE_KEY = 'ZiV0jyTk3h_1M41iCDohRTthwSUwiipNfl9XC4nUmhk';

try {
  webpush.setVapidDetails(
    'mailto:sonne-mond-sterne@applet.internal',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('[Web Push] VAPID details initialized successfully.');
} catch (err) {
  console.warn('[Web Push] Could not initialize VAPID details:', err);
}

// Client SDK for server-side push query (handles Firestore permissions gracefully)
let appClient: any = null;
let dbClient: any = null;
let authClient: any = null;

try {
  const apps = getApps();
  if (apps.length > 0) {
    appClient = apps[0];
  } else {
    appClient = initializeApp(firebaseConfig, 'server-push-app');
  }
  authClient = getAuth(appClient);
  dbClient = getFirestore(appClient, firebaseConfig.firestoreDatabaseId);
} catch (err: any) {
  console.warn('[Server SDK] Initialization notice:', err?.message || err);
}

async function ensureServerAuth() {
  if (!authClient) return;
  if (!authClient.currentUser) {
    try {
      await signInAnonymously(authClient);
    } catch (err: any) {
      console.warn('[Server Auth] Anonymous auth notice:', err?.message || err);
    }
  }
}

async function sendWebPushToRole(
  targetRole: string,
  title: string,
  body: string,
  type?: string,
  tag?: string,
  navTab?: string
) {
  try {
    await ensureServerAuth();
    if (!dbClient) {
      console.warn('[Web Push] Cannot send push: dbClient not ready.');
      return { successCount: 0, failCount: 0, error: 'dbClient not ready' };
    }

    const targetSubscriptions: any[] = [];

    // 1. Primary lookup: Dedicated push_subscriptions collection (tagged directly by device role)
    try {
      const pushSubSnap = await getDocs(collection(dbClient, 'push_subscriptions'));
      pushSubSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.role === targetRole && data.subscription) {
          const parsed = typeof data.subscription === 'string' ? JSON.parse(data.subscription) : data.subscription;
          if (parsed && parsed.endpoint) {
            targetSubscriptions.push(parsed);
          }
        }
      });
    } catch (err) {
      console.warn('[Web Push] Error reading push_subscriptions collection:', err);
    }

    // 2. Secondary fallback lookup: user_roles collection
    if (targetSubscriptions.length === 0) {
      try {
        const snap = await getDocs(collection(dbClient, 'user_roles'));
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.role === targetRole && data.pushSubscriptions && Array.isArray(data.pushSubscriptions)) {
            for (const rawSub of data.pushSubscriptions) {
              try {
                const parsed = typeof rawSub === 'string' ? JSON.parse(rawSub) : rawSub;
                if (parsed && parsed.endpoint) {
                  targetSubscriptions.push(parsed);
                }
              } catch (_) {}
            }
          }
        });
      } catch (_) {}
    }

    console.log(`[Web Push] Found ${targetSubscriptions.length} subscriptions targeting role "${targetRole}": "${title}"`);

    if (targetSubscriptions.length === 0) {
      console.log(`[Web Push] No push subscriptions registered for role: ${targetRole}`);
      return { successCount: 0, failCount: 0, notice: 'No push subscriptions found for target role' };
    }

    const pushPayload = JSON.stringify({
      title,
      body,
      type: type || 'system',
      tag: tag || `push-${Date.now()}`,
      navTab: navTab || '',
    });

    let successCount = 0;
    let failCount = 0;

    for (const sub of targetSubscriptions) {
      try {
        await webpush.sendNotification(sub, pushPayload);
        successCount++;
      } catch (err: any) {
        failCount++;
        console.warn(`[Web Push] Delivery notice (status ${err?.statusCode || 'err'}):`, err?.message || err);
      }
    }

    console.log(`[Web Push] Summary for ${targetRole}: ${successCount} sent, ${failCount} failed.`);
    return { successCount, failCount };
  } catch (err) {
    console.error('[Web Push] Error in sendWebPushToRole:', err);
    return { successCount: 0, failCount: 0, error: String(err) };
  }
}

function setupPushService() {
  console.log('[Push Service] Starting Firestore background listener for partner_notifications...');
  try {
    ensureServerAuth().then(() => {
      if (!dbClient) return;
      onSnapshot(collection(dbClient, 'partner_notifications'), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const { targetRole, title, body, type, navTab, tag } = data;
            if (targetRole && title) {
              console.log(`[Push Service] Firestore trigger received for ${targetRole}: ${title}`);
              sendWebPushToRole(targetRole, title, body, type, tag, navTab).catch((err) => {
                console.warn('[Push Service] Listener dispatch notice:', err);
              });
            }
          }
        });
      }, (err) => {
        console.warn('[Push Service] Listener stream notice:', err?.message || err);
      });
    }).catch(() => {});
  } catch (err: any) {
    console.warn('[Push Service] Could not attach listener:', err?.message || err);
  }
}

async function startServer() {
  setupPushService();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Direct Push Dispatch Route
  app.post('/api/send-push', async (req, res) => {
    try {
      const { targetRole, title, body, type, tag, navTab } = req.body || {};
      if (!targetRole || !title) {
        return res.status(400).json({ error: 'Missing targetRole or title' });
      }
      const result = await sendWebPushToRole(targetRole, title, body, type, tag, navTab);
      return res.json(result);
    } catch (err: any) {
      console.error('/api/send-push error:', err);
      return res.status(500).json({ error: err?.message || String(err) });
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
