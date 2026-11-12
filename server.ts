import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin for background push triggers
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));

let adminApp: any = null;
let dbAdmin: any = null;
let messagingAdmin: any = null;

try {
  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0];
  } else {
    adminApp = initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
  // Initialize with named databaseId specified in firebase-applet-config.json
  dbAdmin = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
  messagingAdmin = getMessaging(adminApp);
  console.log('Firebase Admin initialized with databaseId:', firebaseConfig.firestoreDatabaseId);
} catch (err: any) {
  console.warn('Firebase Admin initialization notice (dev environment):', err?.message || err);
}

/**
 * Authority Background Listener:
 * Watches partner_notifications collection and sends FCM push to target role tokens.
 */
function setupPushService() {
  if (!dbAdmin || !messagingAdmin) {
    console.log('Background Push Authority Service inactive: dbAdmin or messagingAdmin not initialized.');
    return;
  }
  console.log('Starting Background Push Authority Service...');
  
  try {
    dbAdmin.collection('partner_notifications').onSnapshot((snapshot: any) => {
      snapshot.docChanges().forEach(async (change: any) => {
        // Only trigger for newly created documents
        if (change.type === 'added') {
          const data = change.doc.data();
          const { targetRole, title, body, type, navTab, tag } = data;

          if (!targetRole) return;

          try {
            console.log(`Processing push trigger for ${targetRole}: ${title}`);
            // 1. Fetch tokens for the target role
            const userRolesSnap = await dbAdmin.collection('user_roles')
              .where('role', '==', targetRole)
              .get();

            const allTokens: string[] = [];
            userRolesSnap.forEach((doc: any) => {
              const roleData = doc.data();
              if (roleData.pushTokens && Array.isArray(roleData.pushTokens)) {
                allTokens.push(...roleData.pushTokens);
              }
            });

            const uniqueTokens = Array.from(new Set(allTokens));
            console.log(`FCM tokens retrieved for ${targetRole}:`, uniqueTokens);
            if (uniqueTokens.length === 0) {
              console.log(`No push tokens found for role: ${targetRole}`);
              return;
            }

            // 2. Prepare FCM message
            const message: any = {
              tokens: uniqueTokens,
              notification: {
                title: title,
                body: body,
              },
              data: {
                type: type || 'system',
                tab: navTab || '',
                tag: tag || change.doc.id,
                click_action: navTab ? `/?tab=${navTab}` : '/',
              },
              webpush: {
                headers: {
                  Urgency: 'high'
                },
                notification: {
                  title: title,
                  body: body,
                  icon: '/app-icon-full.png?v=12',
                  badge: '/badge-icon.png?v=12',
                  tag: tag || change.doc.id,
                  renotify: true,
                  requireInteraction: true,
                },
                fcmOptions: {
                  link: navTab ? `/?tab=${navTab}` : '/',
                }
              }
            };

            // 3. Send via FCM
            console.log(`Sending FCM to ${uniqueTokens.length} tokens...`);
            const response = await messagingAdmin.sendEachForMulticast(message);
            console.log(`FCM Response: Success=${response.successCount}, Fail=${response.failureCount}`);
            
            if (response.failureCount > 0) {
              response.responses.forEach((resp: any, idx: number) => {
                if (!resp.success) {
                  console.warn(`FCM Send Failure for token ${uniqueTokens[idx]}:`, resp.error);
                }
              });
            }
          } catch (error) {
            console.error('Error sending background push:', error);
          }
        }
      });
    }, (err: any) => console.warn('Push Service Firestore stream notice:', err?.message || err));
  } catch (err: any) {
    console.warn('Could not attach background push listener:', err?.message || err);
  }
}

async function startServer() {
  setupPushService();

  const app = express();
  const PORT = 3000;

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
