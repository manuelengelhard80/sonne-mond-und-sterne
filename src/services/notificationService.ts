import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
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

export const getNotificationLogs = (): NotificationLogEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addNotificationLog = (
  title: string,
  body: string,
  isTest: boolean = false,
  type: NotificationLogEntry['type'] = 'system'
): NotificationLogEntry => {
  const newEntry: NotificationLogEntry = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    title,
    body,
    isTest,
    type,
  };

  if (typeof window !== 'undefined') {
    const existing = getNotificationLogs();
    const updated = [newEntry, ...existing].slice(0, 100);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('notification-log-updated', { detail: updated }));
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

let swRegistration: ServiceWorkerRegistration | null = null;
let morningTimerId: number | null = null;

// Register Service Worker
export const initServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
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
  logType: NotificationLogEntry['type'] = 'system'
): Promise<boolean> => {
  const bodyText = options?.body || '';

  // Always log the notification and trigger in-app visual toast
  addNotificationLog(title, bodyText, isTest, logType);

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    icon: '/pwa-icon-192.png',
    badge: '/badge-icon.png',
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
    'morgen_affirmation'
  );
};

// Helper to return the shooting star push notification title and body based on recipient user role
export const getShootingStarPushNotification = (
  userRole: UserRoleType,
  starTitle?: string
): { title: string; body: string } => {
  const title = '🌠 Neue Sternschnuppe am Himmel!';
  const defaultBody =
    userRole === 'sonne'
      ? 'Ein Wunsch vom Mond an dich, meine liebe Sonne. ☀️\nSchau ihn dir an!'
      : 'Ein Wunsch von der Sonne an dich, meine lieber Mond 🌕\nSchau ihn dir an!';

  const body = starTitle && starTitle.trim().length > 0
    ? `${starTitle.trim()}\n${defaultBody}`
    : defaultBody;

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
    },
    true,
    'sternschnuppe'
  );
};

// Helper to return the shared thought push notification title and body based on recipient user role
export const getSharedThoughtPushNotification = (
  userRole: UserRoleType,
  thoughtNote?: { title?: string; content?: string }
): { title: string; body: string } => {
  const isSonne = userRole === 'sonne';
  const title = '💌 Gedanken teilen...';

  const baseBody = isSonne
    ? 'Der Mond 🌕 hat einen Gedanken mit dir geteilt, meine liebe Sonne. ☀️\nSchau ihn dir an!'
    : 'Die Sonne ☀️ hat einen Gedanken mit dir geteilt, mein lieber Mond. 🌕\nSchau ihn dir an!';

  let body = baseBody;
  if (thoughtNote) {
    if (thoughtNote.title && thoughtNote.content) {
      body = `„${thoughtNote.title.trim()}“\n${thoughtNote.content.trim().slice(0, 100)}\n${baseBody}`;
    } else if (thoughtNote.title) {
      body = `„${thoughtNote.title.trim()}“\n${baseBody}`;
    } else if (thoughtNote.content) {
      body = `„${thoughtNote.content.trim().slice(0, 100)}“\n${baseBody}`;
    }
  }

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
    },
    true,
    'gedanken'
  );
};

// Helper to return the guided meditation push notification based on sender role
export const getGuidedMeditationPushNotification = (
  senderRole: UserRoleType
): { title: string; body: string } => {
  const isSonne = senderRole === 'sonne';
  const title = isSonne ? '🧘♀️🧘♂️ Geführten Meditation' : '🧘♂️🧘♀️ Geführten Meditation';
  const body = isSonne
    ? 'Die Sonne ☀️ lädt dich heute zu einer geführten Meditation ein, mein lieber Mond. 🌕 Nehmt euch einen Moment, schließt die Augen und findet Ruhe und neue Kraft.'
    : 'Der Mond 🌕 lädt dich heute zu einer geführten Meditation ein, meine liebe Sonne. ☀️ Nehmt euch einen Moment, schließt die Augen und findet Ruhe und neue Kraft.';

  return { title, body };
};

// Invitation 1: Geführte Meditation Einladung
export const sendGuidedMeditationInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const { title, body } = getGuidedMeditationPushNotification(userRole);
  return sendAppNotification(
    title,
    {
      body,
      tag: 'guided-meditation-invite',
    },
    false,
    'system'
  );
};

// Helper to return the couples meditation push notification based on sender role
export const getCouplesMeditationPushNotification = (
  senderRole: UserRoleType
): { title: string; body: string } => {
  const isSonne = senderRole === 'sonne';
  const title = '🧘♀️💞🧘♂️ Paar-Meditation';
  const body = isSonne
    ? 'Die Sonne ☀️ lädt dich heute zu einer Paar-Meditation ein, mein lieber Mond. 🌕 Lass uns gemeinsam in Verbundenheit und tiefe Nähe eintauchen.'
    : 'Der Mond 🌕 lädt dich heute zu einer Paar-Meditation ein, meine liebe Sonne. ☀️ Lass uns gemeinsam in Verbundenheit und tiefe Nähe eintauchen.';

  return { title, body };
};

// Invitation 2: Paar-Meditation Einladung
export const sendCouplesMeditationInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const { title, body } = getCouplesMeditationPushNotification(userRole);
  return sendAppNotification(
    title,
    {
      body,
      tag: 'couples-meditation-invite',
    },
    false,
    'system'
  );
};

// Invitation 3: Traumreise Einladung
export const sendDreamJourneyInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const senderName = userRole === 'sonne' ? 'Die Sonne' : 'Der Mond';
  return sendAppNotification(
    '✨ Einladung zu einer entspannenden Traumreise!',
    {
      body: `${senderName} lädt dich zu einer zauberhaften Traumreise ein. Lass deine Gedanken auf sanften Schwingen davontragen und genieße tiefe Entspannung.`,
      tag: 'dream-journey-invite',
    },
    false,
    'system'
  );
};

// Test 4: Geführte Meditation Test
export const sendTestGuidedMeditationInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const { title, body } = getGuidedMeditationPushNotification(userRole);
  return sendAppNotification(
    title,
    {
      body,
      tag: 'test-guided-meditation-invite',
    },
    true,
    'test'
  );
};

// Test 6: Himmelsbegegnung Test
export const sendTestHimmelsbegegnung = async (userRole: UserRoleType): Promise<boolean> => {
  const isSonne = userRole === 'sonne';
  return sendAppNotification(
    isSonne ? '☀️ Sanfte Himmelsbegegnung von deiner Sonne!' : '🌙 Sanfte Himmelsbegegnung von deinem Mond!',
    {
      body: 'Sonne & Mond berühren sich... "In den Momenten, in denen Tag und Nacht sich sanft berühren, begegnen sie sich in wahrhaftiger Liebe."',
      tag: 'test-himmelsbegegnung',
    },
    true,
    'himmelsbegegnung'
  );
};

// Test 7: Sommernacht am See Test
export const sendTestSommernachtAmSeeInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const senderName = userRole === 'sonne' ? 'Die Sonne' : 'Der Mond';
  return sendAppNotification(
    '🌊 Einladung zu einer Sommernacht am See',
    {
      body: `${senderName} lädt dich zu einer magischen Sommernacht am See ein. Lass den Alltag hinter dir und genieße die Stille und das sanfte Leuchten der Sterne über dem Wasser.`,
      tag: 'test-sommernacht-am-see',
    },
    true,
    'test'
  );
};

// Test 5: Paar-Meditation Test
export const sendTestCouplesMeditationInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const { title, body } = getCouplesMeditationPushNotification(userRole);
  return sendAppNotification(
    title,
    {
      body,
      tag: 'test-couples-meditation-invite',
    },
    true,
    'test'
  );
};

// Test 6: Traumreise Test
export const sendTestDreamJourneyInvite = async (userRole: UserRoleType): Promise<boolean> => {
  const senderName = userRole === 'sonne' ? 'Die Sonne' : 'Der Mond';
  return sendAppNotification(
    '✨ Einladung zu einer entspannenden Traumreise!',
    {
      body: `${senderName} lädt dich zu einer zauberhaften Traumreise ein. Lass deine Gedanken auf sanften Schwingen davontragen und genieße tiefe Entspannung.`,
      tag: 'test-dream-journey-invite',
    },
    true,
    'test'
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
              icon: '/app-icon-selected.jpg',
              badge: '/app-icon-selected.jpg',
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

// Real-Time Partner Listener for Shooting Stars & Shared Thoughts
export const listenForPartnerActivities = (
  userRole: UserRoleType,
  currentUserId: string | null
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  let isInitialStarsSnapshot = true;
  const knownStarIds = new Set<string>();

  let isInitialThoughtsSnapshot = true;
  const knownThoughtIds = new Set<string>();

  // 1. Listen for new shooting stars
  let unsubStars = () => {};
  try {
    unsubStars = onSnapshot(collection(db, 'shooting_stars'), (snapshot) => {
      if (isInitialStarsSnapshot) {
        snapshot.docs.forEach((d) => knownStarIds.add(d.id));
        isInitialStarsSnapshot = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !knownStarIds.has(change.doc.id)) {
          knownStarIds.add(change.doc.id);
          const data = change.doc.data();

          // Check if this star is from the partner
          const isFromPartner = data.authorRole ? data.authorRole !== userRole : (currentUserId ? data.authorUid !== currentUserId : true);
          if (isFromPartner) {
            const { title, body } = getShootingStarPushNotification(userRole, data.title);
            sendAppNotification(
              title,
              {
                body,
                tag: `star-${change.doc.id}`,
              },
              false,
              'sternschnuppe'
            );
          }
        }
      });
    }, (err) => console.warn('Stars listener notice:', err));
  } catch (err) {
    console.warn('Could not attach stars notification listener:', err);
  }

  // 2. Listen for new shared thoughts
  let unsubThoughts = () => {};
  try {
    unsubThoughts = onSnapshot(collection(db, 'shared_thoughts'), (snapshot) => {
      if (isInitialThoughtsSnapshot) {
        snapshot.docs.forEach((d) => knownThoughtIds.add(d.id));
        isInitialThoughtsSnapshot = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !knownThoughtIds.has(change.doc.id)) {
          knownThoughtIds.add(change.doc.id);
          const data = change.doc.data();

          // Check if this thought is from the partner
          const isFromPartner = data.authorRole ? data.authorRole !== userRole : (currentUserId ? data.authorUid !== currentUserId : true);
          if (isFromPartner) {
            const { title, body } = getSharedThoughtPushNotification(userRole, {
              title: data.title,
              content: data.content,
            });
            sendAppNotification(
              title,
              {
                body,
                tag: `thought-${change.doc.id}`,
              },
              false,
              'gedanken'
            );
          }
        }
      });
    }, (err) => console.warn('Thoughts listener notice:', err));
  } catch (err) {
    console.warn('Could not attach thoughts notification listener:', err);
  }

  // 3. Listen for interactive celestial touch encounters (Himmelsbegegnung)
  let unsubEncounters = () => {};
  let isInitialEncountersSnapshot = true;
  const knownEncounterIds = new Set<string>();

  try {
    unsubEncounters = onSnapshot(collection(db, 'celestial_touches'), (snapshot) => {
      if (isInitialEncountersSnapshot) {
        snapshot.docs.forEach((d) => knownEncounterIds.add(d.id));
        isInitialEncountersSnapshot = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !knownEncounterIds.has(change.doc.id)) {
          knownEncounterIds.add(change.doc.id);
          const data = change.doc.data();

          const isFromPartner = data.authorRole ? data.authorRole !== userRole : (currentUserId ? data.authorUid !== currentUserId : true);
          if (isFromPartner) {
            if (data.authorRole === 'sonne') {
              sendAppNotification('☀️ Sanfte Himmelsbegegnung von deiner Sonne!', {
                body: 'Sonne & Mond berühren sich... "In den Momenten, in denen Tag und Nacht sich sanft berühren, begegnen sie sich in wahrhaftiger Liebe."',
                tag: `encounter-${change.doc.id}`,
              });
            } else if (data.authorRole === 'mond') {
              sendAppNotification('🌙 Sanfte Himmelsbegegnung von deinem Mond!', {
                body: 'Mond & Sonne berühren sich... "In den Momenten, in denen Tag und Nacht sich sanft berühren, begegnen sie sich in wahrhaftiger Liebe."',
                tag: `encounter-${change.doc.id}`,
              });
            } else {
              sendAppNotification('✨ Sanfte Himmelsbegegnung!', {
                body: 'Sonne & Mond berühren sich in wahrhaftiger Liebe.',
                tag: `encounter-${change.doc.id}`,
              });
            }
          }
        }
      });
    }, (err) => console.warn('Encounters listener notice:', err));
  } catch (err) {
    console.warn('Could not attach encounters notification listener:', err);
  }

  return () => {
    unsubStars();
    unsubThoughts();
    unsubEncounters();
  };
};
