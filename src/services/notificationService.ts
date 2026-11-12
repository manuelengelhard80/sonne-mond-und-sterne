import { collection, onSnapshot, doc, setDoc, getDoc, arrayUnion, query, where, orderBy, limit } from 'firebase/firestore';
import { db, ensureAuthenticated, messaging, auth } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { NotificationLogEntry, UserRoleType } from '../types';

// VAPID Public Key for Web Push (Required for Chrome, Safari, Firefox OS background notifications)
export const VAPID_PUBLIC_KEY = 'BKDGl7c3RPjL_Te5Ysx--vJgqravzRooqxnjFGj9d8Ftf9aRFmLCkm_yzB1j920womuLxlXQ0nXfavVFq_8VNYU';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Request Notification Permission and setup FCM / Web Push
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      const reg = await initServiceWorker();
      if (reg) {
        await setupFCM(reg);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return false;
  }
};

// Register a push token for the current user in Firestore
export const registerPushToken = async (token: string, userId: string) => {
  try {
    const userRoleDoc = doc(db, 'user_roles', userId);
    await setDoc(userRoleDoc, {
      pushTokens: arrayUnion(token),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('Push token registered successfully.');
  } catch (err) {
    console.warn('Could not register push token:', err);
  }
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  // In dev/applet mode, we also alert if it's a critical sync failure for better visibility
  if (operationType === OperationType.LIST) {
    console.warn(`Critical Sync Failure on ${path}: ${errInfo.error}`);
  }
}

function getSubscriptionDocId(endpoint: string): string {
  const parts = endpoint.split('/');
  const lastSegment = parts[parts.length - 1] || 'sub';
  return 'sub-' + lastSegment.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 100);
}

export const registerDevicePushSubscription = async (
  registration: ServiceWorkerRegistration,
  userRole?: UserRoleType
): Promise<boolean> => {
  try {
    const currentRole = userRole || (typeof window !== 'undefined' ? (localStorage.getItem('sonne_mond_user_role') as UserRoleType || 'sonne') : 'sonne');
    let sub = await registration.pushManager.getSubscription();
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any
      });
    }
    if (sub) {
      const subJson = sub.toJSON();
      if (subJson.endpoint) {
        const docId = getSubscriptionDocId(subJson.endpoint);
        const subDocRef = doc(db, 'push_subscriptions', docId);
        await setDoc(subDocRef, {
          id: docId,
          role: currentRole,
          subscription: subJson,
          endpoint: subJson.endpoint,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`[Push Reg] Device push subscription registered for role "${currentRole}" in push_subscriptions/${docId}.`);
        return true;
      }
    }
  } catch (err) {
    console.warn('[Push Reg] Could not register device push subscription:', err);
  }
  return false;
};

// Initialize Web Push & FCM for closed app background notifications
export const setupFCM = async (registration: ServiceWorkerRegistration) => {
  try {
    const user = await ensureAuthenticated();
    if (!user) {
      console.warn('Push setup skipped: No authenticated user.');
      return;
    }

    const currentRole = typeof window !== 'undefined' ? (localStorage.getItem('sonne_mond_user_role') as UserRoleType || 'sonne') : 'sonne';

    // 1. Register W3C PushSubscription in dedicated push_subscriptions collection
    await registerDevicePushSubscription(registration, currentRole);

    // Also backup in user_roles doc
    try {
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        const subJson = sub.toJSON();
        const userRoleDoc = doc(db, 'user_roles', user.uid);
        await setDoc(userRoleDoc, {
          role: currentRole,
          pushSubscriptions: arrayUnion(JSON.stringify(subJson)),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (_) {}

    // 2. Also register FCM token if messaging is active
    if (messaging) {
      try {
        const token = await getToken(messaging, {
          vapidKey: VAPID_PUBLIC_KEY,
          serviceWorkerRegistration: registration,
        });
        if (token) {
          console.log('FCM Token generated.');
          await registerPushToken(token, user.uid);
        }
      } catch (fcmErr) {
        console.warn('FCM getToken notice:', fcmErr);
      }

      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
      });
    }
  } catch (err) {
    console.warn('Push setup error:', err);
  }
};

export const MORNING_AFFIRMATIONS: string[] = [
  "So wie die Sonne jeden Morgen verlässlich aufgeht, darfst auch du deinem ganz eigenen Rhythmus vertrauen.",
  "Du musst heute niemandem etwas beweisen. Dein Dasein allein ist wertvoll und vollkommen genug.",
  "Atme tief ein: Du bist geliebt, beschützt und sanft getragen – genau so, wie du jetzt bist.",
  "Nimm dir den Tag in Ruhe. Die Welt wartet auf dich, ganz ohne Eile und ohne Erwartungsdruck.",
  "In deinem Herzen liegt eine wunderschöne Ruhe. Schenke dir selbst heute Wärme und Sanftheit.",
  "Deine Wärme macht das Leben so viel schöner. Schön, dass es dich gibt!",
  "Lass alle Sorgen sanft verfliegen. Heute ist ein neuer, liebevoller Tag nur für dich.",
  "Wie Sonne, Mond und Sterne ihren festen Platz am Himmel haben, gehörst du unersetzbar hierher.",
  "Erlaube dir heute immer wieder kurze Momente zum Innehalten und Durchatmen.",
  "Ein neuer Tag voller Möglichkeiten, von Liebe getragen und beschützt."
];

const LOG_STORAGE_KEY = 'sonne_mond_notification_logs';
const SEEN_NOTIFS_KEY = 'sonne_mond_seen_partner_notifs';

export const getNotificationLogs = (): NotificationLogEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const addNotificationLog = (
  title: string,
  body: string,
  isTest: boolean = false,
  type: NotificationLogEntry['type'] = 'system',
  targetRole?: UserRoleType,
  customId?: string,
  timestamp?: string
): NotificationLogEntry => {
  const currentRole = typeof window !== 'undefined' ? (localStorage.getItem('sonne_mond_user_role') as UserRoleType || 'sonne') : 'sonne';
  const entryId = customId || ('log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));
  const entryTime = timestamp || new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const newEntry: NotificationLogEntry = {
    id: entryId,
    timestamp: entryTime,
    title,
    body,
    isTest,
    type,
    targetRole: targetRole || currentRole,
  };

  if (typeof window !== 'undefined') {
    const existing = getNotificationLogs();
    const exists = existing.some((e) => e.id === entryId);
    if (!exists) {
      const updated = [newEntry, ...existing].slice(0, 100);
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('notification-log-updated', { detail: updated }));
    }
  }

  return newEntry;
};

export const clearNotificationLogs = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOG_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('notification-log-updated', { detail: [] }));
  }
};

export const removeNotificationLogEntry = (id: string): void => {
  if (typeof window !== 'undefined') {
    const existing = getNotificationLogs();
    const updated = existing.filter((entry) => entry.id !== id);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('notification-log-updated', { detail: updated }));
  }
};

export const APP_NOTIFICATION_ICON = '/app-icon-full.png?v=12';
export const APP_NOTIFICATION_BADGE = '/badge-icon.png?v=12';

let swRegistration: ServiceWorkerRegistration | null = null;
let morningTimerId: number | null = null;

// Register Service Worker
export const initServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    if (reg) {
      reg.update().catch(() => {});
    }
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('Service Worker registration notice:', err);
    return null;
  }
};

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

// Display local system notification (OS banner) via Service Worker or Notification API
export const displayLocalNotification = async (
  title: string,
  body: string,
  tag?: string,
  navTab?: string
): Promise<boolean> => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('DIAGNOSTIC: Notifications not supported in this browser environment.');
      return false;
    }
    if (Notification.permission !== 'granted') {
      console.warn('DIAGNOSTIC: Notification permission not granted (current state: ' + Notification.permission + ')');
      return false;
    }

    const notifOptions: any = {
      body,
      icon: APP_NOTIFICATION_ICON,
      badge: APP_NOTIFICATION_BADGE,
      tag: tag || `notif-${Date.now()}`,
      vibrate: [200, 100, 200],
      data: {
        tab: navTab || '',
        url: navTab ? `/?tab=${navTab}` : '/',
      },
      renotify: true,
      requireInteraction: false,
    };

    if ('serviceWorker' in navigator) {
      try {
        let reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          reg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>((r) => setTimeout(() => r(null), 1500))
          ]) as any;
        }
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, notifOptions);
          console.log('DIAGNOSTIC: System notification successfully displayed via Service Worker:', title);
          return true;
        }
      } catch (swErr) {
        console.warn('DIAGNOSTIC: SW showNotification notice:', swErr);
      }
    }

    try {
      new Notification(title, notifOptions);
      console.log('DIAGNOSTIC: System notification successfully displayed via Notification API:', title);
      return true;
    } catch (notifErr) {
      console.warn('DIAGNOSTIC: Notification constructor notice (expected on Android Chrome):', notifErr);
    }
    return false;
  } catch (err) {
    console.warn('DIAGNOSTIC: Could not display local notification:', err);
    return false;
  }
};

// Publish a partner notification to Firestore
export const publishPartnerNotification = async (
  senderRole: UserRoleType,
  targetRole: UserRoleType,
  title: string,
  body: string,
  type: NotificationLogEntry['type'] = 'system',
  tag?: string,
  navTab?: string
): Promise<string | null> => {
  const path = 'partner_notifications';
  try {
    const user = await ensureAuthenticated();
    if (!user) {
      console.error('DIAGNOSTIC: Cannot publish notification: Not authenticated.');
      return null;
    }
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, path, notifId);
    const payload = {
      id: notifId,
      senderRole,
      targetRole,
      title,
      body,
      type,
      tag: tag || `partner-${Date.now()}`,
      navTab: navTab || null,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    await setDoc(docRef, payload);
    console.log('DIAGNOSTIC: Notification successfully written to Firestore:', notifId);

    // Call server Web Push route to deliver OS push notification even if partner app/browser is completely closed
    fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderRole,
        targetRole,
        title,
        body,
        type,
        tag: payload.tag,
        navTab,
      }),
    }).catch((pushErr) => {
      console.warn('Push dispatch notice:', pushErr);
    });

    return notifId;
  } catch (err) {
    console.error('DIAGNOSTIC: Firestore write error:', err);
    handleFirestoreError(err, OperationType.WRITE, path);
    return null;
  }
};

// Helper to return the morning affirmation title based on user role
export const getMorningAffirmationTitle = (userRole: UserRoleType): string => {
  return userRole === 'sonne'
    ? '🌅 Guten Morgen, meine liebe Sonne! ☀️'
    : '🌅 Guten Morgen, mein lieber Mond! 🌕';
};

// Test 1: Morgen Affirmation Test
export const sendTestMorningAffirmation = async (userRole: UserRoleType): Promise<boolean> => {
  const randomIndex = Math.floor(Math.random() * MORNING_AFFIRMATIONS.length);
  const message = MORNING_AFFIRMATIONS[randomIndex];
  const title = getMorningAffirmationTitle(userRole);
  const body = `Dein positiver Gedanke für heute: "${message}"`;
  addNotificationLog(title, body, true, 'morgen_affirmation', userRole);
  displayLocalNotification(title, body, 'morgen-affirmation-test', 'meditation').catch(() => {});
  requestNotificationPermission().catch(() => {});
  return true;
};

// Helper to return the shooting star push notification title and body based on recipient user role
export const getShootingStarPushNotification = (
  userRole: UserRoleType
): { title: string; body: string } => {
  const title = '🌠 Neue Sternschnuppe am Himmel!';
  const body =
    userRole === 'sonne'
      ? 'Ein Wunsch vom Mond 🌕 an dich, meine liebe Sonne. ☀️\n\n➡️ Schau ihn dir an!'
      : 'Ein Wunsch von der Sonne ☀️ an dich, mein lieber Mond 🌕\n\n➡️ Schau ihn dir an!';

  return { title, body };
};

// Test 2: Sternschnuppen Test
export const sendTestShootingStar = async (userRole: UserRoleType): Promise<boolean> => {
  const { title, body } = getShootingStarPushNotification(userRole);
  addNotificationLog(title, body, true, 'sternschnuppe', userRole);
  displayLocalNotification(title, body, 'sternschnuppe-test', 'stars').catch(() => {});
  requestNotificationPermission().catch(() => {});
  return true;
};

// Helper to return the shared thought push notification title and body based on recipient user role
export const getSharedThoughtPushNotification = (
  userRole: UserRoleType
): { title: string; body: string } => {
  const isSonne = userRole === 'sonne';
  const title = '💌 Gedanken teilen...';

  const body = isSonne
    ? 'Der Mond 🌕 hat einen Gedanken mit dir geteilt, meine liebe Sonne. ☀️\n\n➡️ Schau ihn dir an!'
    : 'Die Sonne ☀️ hat einen Gedanken mit dir geteilt, mein lieber Mond. 🌕\n\n➡️ Schau ihn dir an!';

  return { title, body };
};

// Test 3: Gedanken Teilen Test
export const sendTestSharedThought = async (userRole: UserRoleType): Promise<boolean> => {
  const { title, body } = getSharedThoughtPushNotification(userRole);
  addNotificationLog(title, body, true, 'gedanken', userRole);
  displayLocalNotification(title, body, 'gedanken-test', 'journal').catch(() => {});
  requestNotificationPermission().catch(() => {});
  return true;
};

// Helper to return the guided meditation push notification based on sender role
export const getGuidedMeditationPushNotification = (
  senderRole: UserRoleType
): { title: string; body: string } => {
  const isSonne = senderRole === 'sonne';
  const title = '🧘 Geführte Meditation';
  const body = isSonne
    ? 'Die Sonne ☀️ lädt dich heute zu einer geführten Meditation ein, mein lieber Mond. 🌕 Nehmt euch einen Moment, schließt die Augen und findet Ruhe und neue Kraft.'
    : 'Der Mond 🌕 lädt dich heute zu einer geführten Meditation ein, meine liebe Sonne. ☀️ Nehmt euch einen Moment, schließt die Augen und findet Ruhe und neue Kraft.';

  return { title, body };
};

// Invitation 1: Geführte Meditation Einladung
export const sendGuidedMeditationInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const targetRole: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getGuidedMeditationPushNotification(userRole);
  await publishPartnerNotification(userRole, targetRole, title, body, 'system', `guided-meditation-${Date.now()}`, 'meditation');
  return true;
};

// Test 4: Geführte Meditation Test
export const sendTestGuidedMeditationInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const simulatedSender: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getGuidedMeditationPushNotification(simulatedSender);
  addNotificationLog(title, body, true, 'test', userRole);
  displayLocalNotification(title, body, 'guided-meditation-test', 'meditation').catch(() => {});
  return true;
};

// Helper to return the couples meditation push notification
export const getCouplesMeditationPushNotification = (
  senderRole: UserRoleType
): { title: string; body: string } => {
  const isSonne = senderRole === 'sonne';
  const title = '🧘💞 Paar-Meditation';
  const body = isSonne
    ? 'Die Sonne ☀️ lädt dich heute zu einer Paar-Meditation ein, mein lieber Mond. 🌕 Lass uns gemeinsam in Verbundenheit und tiefe Nähe eintauchen.'
    : 'Der Mond 🌕 lädt dich heute zu einer Paar-Meditation ein, meine liebe Sonne. ☀️ Lass uns gemeinsam in Verbundenheit und tiefe Nähe eintauchen.';

  return { title, body };
};

// Invitation 2: Paar-Meditation Einladung
export const sendCouplesMeditationInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const targetRole: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getCouplesMeditationPushNotification(userRole);
  await publishPartnerNotification(userRole, targetRole, title, body, 'system', `couples-meditation-${Date.now()}`, 'meditation');
  return true;
};

// Test 7: Paar-Meditation Test
export const sendTestCouplesMeditationInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const simulatedSender: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getCouplesMeditationPushNotification(simulatedSender);
  addNotificationLog(title, body, true, 'test', userRole);
  displayLocalNotification(title, body, 'couples-meditation-test', 'meditation').catch(() => {});
  return true;
};

// Helper to return the Traumreise push notification
export const getDreamJourneyPushNotification = (
  senderRole: UserRoleType
): { title: string; body: string } => {
  const isSonne = senderRole === 'sonne';
  const title = '🛋️ Traumreise';
  const body = isSonne
    ? 'Die Sonne ☀️ lädt dich heute zu einer Traumreise ein, mein lieber Mond. 🌕 Gönnt euch eine Auszeit voller Fantasie und tiefer Entspannung.'
    : 'Der Mond 🌕 lädt dich heute zu einer Traumreise ein, meine liebe Sonne. ☀️ Gönnt euch eine Auszeit voller Fantasie und tiefer Entspannung.';

  return { title, body };
};

// Invitation 3: Traumreise Einladung
export const sendDreamJourneyInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const targetRole: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getDreamJourneyPushNotification(userRole);
  await publishPartnerNotification(userRole, targetRole, title, body, 'system', `dream-journey-${Date.now()}`, 'traumreisen');
  return true;
};

// Test 8: Traumreise Test
export const sendTestDreamJourneyInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const simulatedSender: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getDreamJourneyPushNotification(simulatedSender);
  addNotificationLog(title, body, true, 'test', userRole);
  displayLocalNotification(title, body, 'dream-journey-test', 'traumreisen').catch(() => {});
  return true;
};

// Helper for Himmelsbegegnung
export const getHimmelsbegegnungPushNotification = (
  senderRole: UserRoleType
): { title: string; body: string } => {
  const isSonne = senderRole === 'sonne';
  const title = '☀️🌕 Himmelsbegegnung';
  const body = isSonne
    ? 'Die Sonne ☀️ zieht auf ihrer Bahn und möchte dir, lieber Mond, 🌕 gerne begegnen. Verbindet eure Umlaufbahn für eine sanfte Berührung.'
    : 'Der Mond 🌕 zieht auf seiner Bahn und möchte dir, liebe Sonne. ☀️ gerne begegnen. Verbindet eure Umlaufbahn für eine sanfte Berührung.';

  return { title, body };
};

// Test 5: Himmelsbegegnung Test
export const sendTestHimmelsbegegnung = async (userRole: UserRoleType): Promise<boolean> => {
  const simulatedSender: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getHimmelsbegegnungPushNotification(simulatedSender);
  addNotificationLog(title, body, true, 'himmelsbegegnung', userRole);
  displayLocalNotification(title, body, 'himmelsbegegnung-test', 'himmel').catch(() => {});
  return true;
};

// Helper for Sommernacht am See
export const getSommernachtAmSeePushNotification = (
  senderRole: UserRoleType
): { title: string; body: string } => {
  const isSonne = senderRole === 'sonne';
  const title = '✨ Sommernacht am See';
  const body = isSonne
    ? 'Die Sonne ☀️ lädt dich heute zu einer Sommernacht am See ein, mein lieber Mond. 🌕 Kehrt zusammen zurück an den Ort, an dem alles begann.'
    : 'Der Mond 🌕 lädt dich heute zu einer Sommernacht am See ein, meine liebe Sonne. ☀️ Kehrt zusammen zurück an den Ort, an dem alles begann.';

  return { title, body };
};

// Test 6: Sommernacht am See Test
export const sendTestSommernachtAmSeeInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const simulatedSender: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getSommernachtAmSeePushNotification(simulatedSender);
  addNotificationLog(title, body, true, 'lake', userRole);
  displayLocalNotification(title, body, 'sommernacht-test', 'see').catch(() => {});
  return true;
};

// Real Sommernacht am See Invite
export const sendSommernachtAmSeeInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const targetRole: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getSommernachtAmSeePushNotification(userRole);
  await publishPartnerNotification(userRole, targetRole, title, body, 'lake', `sommernacht-am-see-${Date.now()}`, 'see');
  return true;
};

// Test Notification general
export const sendTestNotification = async (userRole: UserRoleType): Promise<boolean> => {
  const partnerName = userRole === 'sonne' ? 'Der Mond' : 'Die Sonne';
  const title = '✨ Benachrichtigungstest aktiv';
  const body = `Mitteilungen sind erfolgreich auf deinem Gerät aktiviert! Du wirst informiert, wenn ${partnerName} eine Sternschnuppe oder einen Gedanken teilt.`;
  addNotificationLog(title, body, true, 'test', userRole);
  displayLocalNotification(title, body, 'test-general').catch(() => {});
  return true;
};

// Helper to track which partner notification IDs have been processed locally
const getSeenPartnerNotificationIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SEEN_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const markPartnerNotificationAsSeen = (id: string) => {
  if (typeof window === 'undefined') return;
  try {
    const seen = getSeenPartnerNotificationIds();
    if (!seen.includes(id)) {
      const updated = [id, ...seen].slice(0, 300);
      localStorage.setItem(SEEN_NOTIFS_KEY, JSON.stringify(updated));
    }
  } catch {}
};

// Real-Time Partner Listener for all cross-device activities (Foreground sync only)
export const listenForPartnerActivities = (
  userRole: UserRoleType,
  _currentUserId: string | null
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const path = 'partner_notifications';
  let unsubPartnerNotifs = () => {};
  try {
    console.log(`DIAGNOSTIC: Attaching partner listener for role: ${userRole}`);
    
    // Simplest possible listener to avoid any index or query failures
    unsubPartnerNotifs = onSnapshot(collection(db, path), (snapshot) => {
      console.log(`DIAGNOSTIC: Listener snapshot received. Docs: ${snapshot.size}`);
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const notifId = change.doc.id;
          console.log(`DIAGNOSTIC: New doc added: ${notifId}, targetRole: ${data.targetRole}`);
          
          // Only process notifications for the correct target role
          if (data.targetRole === userRole) {
            const seenIds = getSeenPartnerNotificationIds();
            const alreadySeen = seenIds.includes(notifId);

            if (!alreadySeen) {
              console.log('DIAGNOSTIC: New partner activity received:', data.title);
              markPartnerNotificationAsSeen(notifId);
              // CRITICAL: Ensure the message is added to the log so the Messages component can see it.
              // We pass 'false' for isTest to make it a 'real' system message.
              addNotificationLog(data.title, data.body, false, data.type || 'system', userRole, notifId, data.timestamp);
              displayLocalNotification(data.title, data.body, data.tag || notifId, data.navTab).catch(() => {});
            } else {
              console.log('DIAGNOSTIC: Notification already seen, skipping:', notifId);
            }
          } else {
            console.log(`DIAGNOSTIC: Mitteilung richtet sich an Partnerrolle "${data.targetRole}". Da dieses Gerät auf "${userRole}" eingestellt ist, wird die Benachrichtigung auf dem Partner-Gerät (${data.targetRole === 'sonne' ? 'Sonne' : 'Mond'}) empfangen.`);
          }
        }
      });
    }, (err) => {
      console.error('DIAGNOSTIC: Messages sync error:', err);
      handleFirestoreError(err, OperationType.LIST, path);
    });
  } catch (err) {
    console.warn('DIAGNOSTIC: Could not attach partner notifications listener:', err);
  }

  return () => {
    console.log('DIAGNOSTIC: Detaching partner listener.');
    unsubPartnerNotifs();
  };
};

// Affirmation Scheduler (local only)
export const scheduleDailyMorningAffirmation = (
  userRole: UserRoleType,
  onAffirmationTriggered?: (msg: string) => void
) => {
  if (typeof window === 'undefined') return;

  if (morningTimerId) {
    window.clearTimeout(morningTimerId);
    morningTimerId = null;
  }

  const triggerMorningMessage = (targetBerlinDateStr?: string) => {
    const todayBerlinStr = targetBerlinDateStr || getBerlinDateString(new Date());
    const lastSent = localStorage.getItem('last_morning_affirmation_sent');
    if (lastSent === todayBerlinStr) return;

    const randomIndex = Math.floor(Math.random() * MORNING_AFFIRMATIONS.length);
    const message = MORNING_AFFIRMATIONS[randomIndex];
    const title = getMorningAffirmationTitle(userRole);

    addNotificationLog(title, `Dein positiver Gedanke für heute: "${message}"`, false, 'morgen_affirmation', userRole);

    localStorage.setItem('last_morning_affirmation_sent', todayBerlinStr);
    if (onAffirmationTriggered) {
      onAffirmationTriggered(message);
    }
    scheduleNextFiveAm();
  };

  const scheduleNextFiveAm = () => {
    const targetDate = getNextBerlinFiveAmDate();
    const targetBerlinDateStr = getBerlinDateString(targetDate);
    const msUntilFive = Math.max(1000, targetDate.getTime() - Date.now());

    if (morningTimerId) {
      window.clearTimeout(morningTimerId);
    }
    morningTimerId = window.setTimeout(() => {
      triggerMorningMessage(targetBerlinDateStr);
    }, msUntilFive);
  };

  const now = new Date();
  const berlinNow = getBerlinDateTimeParts(now);
  const todayBerlinStr = getBerlinDateString(now);
  const lastSent = localStorage.getItem('last_morning_affirmation_sent');

  if (berlinNow.hour === 5 && berlinNow.minute <= 15 && lastSent !== todayBerlinStr) {
    triggerMorningMessage(todayBerlinStr);
  } else {
    scheduleNextFiveAm();
  }
};

// Date helpers
export const getBerlinDateTimeParts = (date: Date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  let year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0;
  for (const part of parts) {
    if (part.type === 'year') year = parseInt(part.value, 10);
    else if (part.type === 'month') month = parseInt(part.value, 10);
    else if (part.type === 'day') day = parseInt(part.value, 10);
    else if (part.type === 'hour') {
      const h = parseInt(part.value, 10);
      hour = h === 24 ? 0 : h;
    } else if (part.type === 'minute') minute = parseInt(part.value, 10);
    else if (part.type === 'second') second = parseInt(part.value, 10);
  }
  return { year, month, day, hour, minute, second };
};

export const getBerlinDateString = (date: Date = new Date()): string => {
  const { year, month, day } = getBerlinDateTimeParts(date);
  const m = month < 10 ? `0${month}` : `${month}`;
  const d = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${m}-${d}`;
};

export const getNextBerlinFiveAmDate = (): Date => {
  const now = new Date();
  const currentBerlin = getBerlinDateTimeParts(now);
  const isBeforeFive = currentBerlin.hour < 5 || (currentBerlin.hour === 5 && currentBerlin.minute === 0 && currentBerlin.second === 0);
  let targetYear = currentBerlin.year, targetMonth = currentBerlin.month, targetDay = currentBerlin.day;
  if (!isBeforeFive) {
    const tomorrowRef = new Date(now.getTime() + 24 * 3600 * 1000);
    const tomorrowBerlin = getBerlinDateTimeParts(tomorrowRef);
    targetYear = tomorrowBerlin.year; targetMonth = tomorrowBerlin.month; targetDay = tomorrowBerlin.day;
  }
  let candidate = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay, 3, 0, 0));
  for (let i = 0; i < 5; i++) {
    const candidateBerlin = getBerlinDateTimeParts(candidate);
    const diffSeconds = (5 - candidateBerlin.hour) * 3600 + (0 - candidateBerlin.minute) * 60 + (0 - candidateBerlin.second);
    if (diffSeconds === 0) break;
    candidate = new Date(candidate.getTime() + diffSeconds * 1000);
  }
  return candidate;
};
