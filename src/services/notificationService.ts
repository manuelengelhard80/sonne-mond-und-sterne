import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, ensureAuthenticated } from './firebase';
import { NotificationLogEntry, UserRoleType } from '../types';

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
    // Avoid exact duplicate entries by ID
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

// Check if browser supports notifications
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

// Get current permission state
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

// Request Notification Permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      await initServiceWorker();
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return false;
  }
};

// Send an App Notification (Engineered for Google Chrome Mobile & Desktop)
export const sendAppNotification = async (
  title: string,
  options?: NotificationOptions,
  isTest: boolean = false,
  logType: NotificationLogEntry['type'] = 'system',
  targetRole?: UserRoleType,
  customId?: string,
  timestamp?: string
): Promise<boolean> => {
  const bodyText = options?.body || '';

  // Always log the notification locally
  addNotificationLog(title, bodyText, isTest, logType, targetRole, customId, timestamp);

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: any = {
    icon: APP_NOTIFICATION_ICON,
    badge: APP_NOTIFICATION_BADGE,
    vibrate: [200, 100, 200],
    ...options,
  };

  // 1. In Google Chrome for Android and modern PWAs, ServiceWorkerRegistration.showNotification is mandatory
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    }
  } catch (swErr) {
    console.warn('ServiceWorker showNotification skipped, trying fallback:', swErr);
  }

  // 2. Fallback for Desktop browsers that support the Notification constructor directly
  try {
    new Notification(title, notificationOptions);
    return true;
  } catch (err) {
    console.warn('Could not display notification:', err);
    return false;
  }
};

// Publish a partner notification to Firestore so it arrives instantly on partner's device
export const publishPartnerNotification = async (
  senderRole: UserRoleType,
  targetRole: UserRoleType,
  title: string,
  body: string,
  type: NotificationLogEntry['type'] = 'system',
  tag?: string,
  navTab?: string
): Promise<string | null> => {
  try {
    await ensureAuthenticated();
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, 'partner_notifications', notifId);
    await setDoc(docRef, {
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
    });
    return notifId;
  } catch (err) {
    console.warn('Could not publish partner notification to Firestore:', err);
    return null;
  }
};

// Send immediate generic test notification
export const sendTestNotification = async (userRole: UserRoleType): Promise<boolean> => {
  const partnerName = userRole === 'sonne' ? 'Der Mond' : 'Die Sonne';
  return sendAppNotification(
    '✨ Benachrichtigungstest aktiv',
    {
      body: `Mitteilungen sind erfolgreich auf deinem Gerät aktiviert! Du wirst informiert, wenn ${partnerName} eine Sternschnuppe oder einen Gedanken teilt.`,
      tag: 'test-notification',
    },
    true,
    'test'
  );
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
  return sendAppNotification(
    title,
    {
      body: `Dein positiver Gedanke für heute: "${message}"`,
      tag: 'test-morgen-affirmation',
    },
    true,
    'morgen_affirmation',
    userRole
  );
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
  return sendAppNotification(
    title,
    {
      body,
      tag: 'test-shooting-star',
      data: { tab: 'stars', url: '/?tab=stars' },
    },
    true,
    'sternschnuppe',
    userRole
  );
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
  return sendAppNotification(
    title,
    {
      body,
      tag: 'test-shared-thought',
      data: { tab: 'journal', url: '/?tab=journal' },
    },
    true,
    'gedanken',
    userRole
  );
};

// Helper to return the guided meditation push notification based on sender role
export const getGuidedMeditationPushNotification = (
  senderRole: UserRoleType
): { title: string; body: string } => {
  const isSonne = senderRole === 'sonne';
  const title = isSonne ? '🧘 Geführte Meditation' : '🧘 Geführte Meditation';
  const body = isSonne
    ? 'Die Sonne ☀️ lädt dich heute zu einer geführten Meditation ein, mein lieber Mond. 🌕 Nehmt euch einen Moment, schließt die Augen und findet Ruhe und neue Kraft.'
    : 'Der Mond 🌕 lädt dich heute zu einer geführten Meditation ein, meine liebe Sonne. ☀️ Nehmt euch einen Moment, schließt die Augen und findet Ruhe und neue Kraft.';

  return { title, body };
};

// Invitation 1: Geführte Meditation Einladung (cross-device to partner)
export const sendGuidedMeditationInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const targetRole: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getGuidedMeditationPushNotification(userRole);
  await publishPartnerNotification(
    userRole,
    targetRole,
    title,
    body,
    'system',
    `guided-meditation-${Date.now()}`
  );
  return true;
};

// Helper to return the couples meditation push notification based on sender role
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

// Invitation 2: Paar-Meditation Einladung (cross-device to partner)
export const sendCouplesMeditationInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const targetRole: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getCouplesMeditationPushNotification(userRole);
  await publishPartnerNotification(
    userRole,
    targetRole,
    title,
    body,
    'system',
    `couples-meditation-${Date.now()}`
  );
  return true;
};

// Helper to return the Traumreise push notification based on sender role
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

// Invitation 3: Traumreise Einladung (cross-device to partner)
export const sendDreamJourneyInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const targetRole: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getDreamJourneyPushNotification(userRole);
  await publishPartnerNotification(
    userRole,
    targetRole,
    title,
    body,
    'system',
    `dream-journey-${Date.now()}`
  );
  return true;
};



// Test 4: Geführte Meditation Test
export const sendTestGuidedMeditationInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const simulatedSender: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getGuidedMeditationPushNotification(simulatedSender);
  return sendAppNotification(
    title,
    {
      body,
      tag: 'test-guided-meditation-invite',
    },
    true,
    'test',
    userRole
  );
};

// Helper to return the Himmelsbegegnung push notification based on sender role
export const getHimmelsbegegnungPushNotification = (
  senderRole: UserRoleType
): { title: string; body: string } => {
  const isSonne = senderRole === 'sonne';
  const title = '☀️🌕  Himmelsbegegnung';
  const body = isSonne
    ? 'Die Sonne ☀️ zieht auf ihrer Bahn und möchte dir, lieber Mond, 🌕 gerne begegnen.  Verbindet eure Umlaufbahn für eine sanfte Berührung.'
    : 'Der Mond 🌕 zieht auf seiner Bahn und möchte dir, liebe Sonne. ☀️ gerne begegnen.   Verbindet eure Umlaufbahn für eine sanfte Berührung.';

  return { title, body };
};

// Test 5: Himmelsbegegnung Test
export const sendTestHimmelsbegegnung = async (userRole: UserRoleType): Promise<boolean> => {
  const simulatedSender: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getHimmelsbegegnungPushNotification(simulatedSender);
  return sendAppNotification(
    title,
    {
      body,
      tag: 'test-himmelsbegegnung',
    },
    true,
    'himmelsbegegnung',
    userRole
  );
};

// Helper to return the Sommernacht am See push notification based on sender role
export const getSommernachtAmSeePushNotification = (
  senderRole: UserRoleType
): { title: string; body: string } => {
  const isSonne = senderRole === 'sonne';
  const title = '✨ Sommernacht am See';
  const body = isSonne
    ? 'Die Sonne ☀️ lädt dich heute zu einer Sommernacht am See ein, mein lieber Mond. 🌕 Kehrt zusammen zurück an den Ort, an dem alles begann.'
    : 'Der Mond 🌕 lädt dich heute zu einer  Sommernacht am See ein, meine liebe Sonne. ☀️ Kehrt zusammen zurück an den Ort, an dem alles begann.';

  return { title, body };
};

// Test 6: Sommernacht am See Test
export const sendTestSommernachtAmSeeInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const simulatedSender: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getSommernachtAmSeePushNotification(simulatedSender);
  return sendAppNotification(
    title,
    {
      body,
      tag: 'test-sommernacht-am-see',
    },
    true,
    'lake',
    userRole
  );
};

// Real Sommernacht am See Invite (cross-device to partner)
export const sendSommernachtAmSeeInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const targetRole: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getSommernachtAmSeePushNotification(userRole);
  await publishPartnerNotification(
    userRole,
    targetRole,
    title,
    body,
    'lake',
    `sommernacht-am-see-${Date.now()}`
  );
  return true;
};

// Test 7: Paar-Meditation Test
export const sendTestCouplesMeditationInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const simulatedSender: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getCouplesMeditationPushNotification(simulatedSender);
  return sendAppNotification(
    title,
    {
      body,
      tag: 'test-couples-meditation-invite',
    },
    true,
    'test',
    userRole
  );
};

// Test 8: Traumreise Test
export const sendTestDreamJourneyInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const simulatedSender: UserRoleType = userRole === 'sonne' ? 'mond' : 'sonne';
  const { title, body } = getDreamJourneyPushNotification(simulatedSender);
  return sendAppNotification(
    title,
    {
      body,
      tag: 'test-dream-journey-invite',
    },
    true,
    'test',
    userRole
  );
};


// Calculate current date/time components in Europe/Berlin timezone
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
  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  let second = 0;

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

// Returns date string in Berlin timezone: 'YYYY-MM-DD'
export const getBerlinDateString = (date: Date = new Date()): string => {
  const { year, month, day } = getBerlinDateTimeParts(date);
  const m = month < 10 ? `0${month}` : `${month}`;
  const d = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${m}-${d}`;
};

// Returns exact UTC Date object for the next 05:00:00.000 in Europe/Berlin timezone
export const getNextBerlinFiveAmDate = (): Date => {
  const now = new Date();
  const currentBerlin = getBerlinDateTimeParts(now);

  // If currently before 5:00:00 Berlin time, target is today at 5:00:00.
  // If currently at or after 5:00:00 Berlin time, target is tomorrow at 5:00:00.
  const isBeforeFive =
    currentBerlin.hour < 5 ||
    (currentBerlin.hour === 5 && currentBerlin.minute === 0 && currentBerlin.second === 0);

  let targetYear = currentBerlin.year;
  let targetMonth = currentBerlin.month; // 1-indexed
  let targetDay = currentBerlin.day;

  if (!isBeforeFive) {
    // Tomorrow in Berlin
    const tomorrowRef = new Date(now.getTime() + 24 * 3600 * 1000);
    const tomorrowBerlin = getBerlinDateTimeParts(tomorrowRef);
    targetYear = tomorrowBerlin.year;
    targetMonth = tomorrowBerlin.month;
    targetDay = tomorrowBerlin.day;
  }

  // Start with UTC estimate: 5 AM Berlin is 3 AM (summer) or 4 AM (winter) UTC.
  let candidate = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay, 3, 0, 0));

  // Iteratively converge to exact 05:00:00 in Europe/Berlin
  for (let i = 0; i < 5; i++) {
    const candidateBerlin = getBerlinDateTimeParts(candidate);
    const diffSeconds =
      (5 - candidateBerlin.hour) * 3600 +
      (0 - candidateBerlin.minute) * 60 +
      (0 - candidateBerlin.second);

    if (diffSeconds === 0) break;
    candidate = new Date(candidate.getTime() + diffSeconds * 1000);
  }

  return candidate;
};

// 5:00 AM Berlin Time Morning Positive Message Scheduler
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

    // Pick random affirmation
    const randomIndex = Math.floor(Math.random() * MORNING_AFFIRMATIONS.length);
    const message = MORNING_AFFIRMATIONS[randomIndex];
    const title = getMorningAffirmationTitle(userRole);

    sendAppNotification(
      title,
      {
        body: `Dein positiver Gedanke für heute: "${message}"`,
        tag: `daily-morning-affirmation-${todayBerlinStr}`,
      },
      false,
      'morgen_affirmation'
    );

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

    // 1. In-page timer
    if (morningTimerId) {
      window.clearTimeout(morningTimerId);
    }
    morningTimerId = window.setTimeout(() => {
      triggerMorningMessage(targetBerlinDateStr);
    }, msUntilFive);

    // 2. Service Worker Native Scheduling & TimestampTrigger for exact arrival even in background
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        const randomIndex = Math.floor(Math.random() * MORNING_AFFIRMATIONS.length);
        const message = MORNING_AFFIRMATIONS[randomIndex];
        const title = getMorningAffirmationTitle(userRole);

        // A. Chromium Notification Triggers API (schedules directly in Android AlarmManager)
        if ('showTrigger' in Notification.prototype && typeof (window as any).TimestampTrigger !== 'undefined') {
          try {
            reg.showNotification(title, {
              body: `Dein positiver Gedanke für heute: "${message}"`,
              icon: APP_NOTIFICATION_ICON,
              badge: APP_NOTIFICATION_BADGE,
              tag: `daily-morning-affirmation-${targetBerlinDateStr}`,
              showTrigger: new (window as any).TimestampTrigger(targetDate.getTime()),
            } as any);
          } catch (e) {
            console.warn('TimestampTrigger notice:', e);
          }
        }

        // B. Send message to Service Worker for background timer check
        const sw = reg.active || navigator.serviceWorker.controller;
        if (sw) {
          sw.postMessage({
            type: 'SCHEDULE_MORNING_NOTIFICATION',
            targetTimestamp: targetDate.getTime(),
            title,
            body: `Dein positiver Gedanke für heute: "${message}"`,
            tag: `daily-morning-affirmation-${targetBerlinDateStr}`,
            icon: APP_NOTIFICATION_ICON,
            badge: APP_NOTIFICATION_BADGE,
          });
        }
      }).catch((err) => {
        console.warn('Service worker morning schedule notice:', err);
      });
    }
  };

  // Check if we are currently right at 5:00 AM (within 5:00 - 5:15 AM window)
  const now = new Date();
  const berlinNow = getBerlinDateTimeParts(now);
  const todayBerlinStr = getBerlinDateString(now);
  const lastSent = localStorage.getItem('last_morning_affirmation_sent');

  // ONLY catch up if currently between 05:00 and 05:15 Berlin time today.
  // Never fire hours late (e.g. at 8:00 AM or 11:00 AM) when user opens the app!
  if (berlinNow.hour === 5 && berlinNow.minute <= 15 && lastSent !== todayBerlinStr) {
    triggerMorningMessage(todayBerlinStr);
  } else {
    scheduleNextFiveAm();
  }
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

// Real-Time Partner Listener for all cross-device activities
export const listenForPartnerActivities = (
  userRole: UserRoleType,
  _currentUserId: string | null
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  // Listen directly to partner_notifications for all cross-device events
  let unsubPartnerNotifs = () => {};
  try {
    unsubPartnerNotifs = onSnapshot(collection(db, 'partner_notifications'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const notifId = change.doc.id;

          // Only process notifications targeted specifically for THIS device role
          if (data.targetRole === userRole) {
            const seenIds = getSeenPartnerNotificationIds();
            const alreadySeen = seenIds.includes(notifId);

            if (!alreadySeen) {
              markPartnerNotificationAsSeen(notifId);

              // Always add to local log so Messages inbox and Mitteilungs-Log have it immediately
              addNotificationLog(
                data.title,
                data.body,
                false,
                data.type || 'system',
                userRole,
                notifId,
                data.timestamp
              );

              // Trigger OS/Browser push notification banner if created recently (within last 30 minutes)
              const createdAtMs = data.createdAt ? new Date(data.createdAt).getTime() : Date.now();
              const isRecent = (Date.now() - createdAtMs) < 30 * 60 * 1000;

              if (isRecent) {
                // Display native system push notification
                if (isNotificationSupported() && Notification.permission === 'granted') {
                  const notificationOptions: any = {
                    body: data.body,
                    icon: APP_NOTIFICATION_ICON,
                    badge: APP_NOTIFICATION_BADGE,
                    tag: data.tag || `partner-${notifId}`,
                    data: data.navTab ? { tab: data.navTab, url: `/?tab=${data.navTab}` } : undefined,
                    vibrate: [200, 100, 200],
                  };

                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then((reg) => {
                      if (reg && 'showNotification' in reg) {
                        reg.showNotification(data.title, notificationOptions).catch(() => {});
                      }
                    }).catch(() => {});
                  } else {
                    try {
                      new Notification(data.title, notificationOptions);
                    } catch (_) {}
                  }
                }
              }
            }
          }
        }
      });
    }, (err) => console.warn('Partner notifications listener notice:', err));
  } catch (err) {
    console.warn('Could not attach partner notifications listener:', err);
  }

  return () => {
    unsubPartnerNotifs();
  };
};
