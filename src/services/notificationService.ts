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

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('show-in-app-toast', {
        detail: { title, body: bodyText, isTest },
      })
    );
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    icon: '/assets/aistudio/sms_52ac56d3.png',
    badge: '/assets/aistudio/sms_52ac56d3.png',
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
  const partnerName = userRole === 'sonne' ? 'Mond (Manuel)' : 'Sonne (Stefanie)';
  return sendAppNotification(
    '[TEST] ✨ Benachrichtigungstest aktiv',
    {
      body: `Mitteilungen sind erfolgreich auf deinem Gerät aktiviert! Du wirst informiert, wenn ${partnerName} eine Sternschnuppe oder einen Gedanken teilt.`,
      tag: 'test-notification',
    },
    true,
    'test'
  );
};

// Test 1: Morgen Affirmation Test
export const sendTestMorningAffirmation = async (userRole: UserRoleType): Promise<boolean> => {
  const randomIndex = Math.floor(Math.random() * MORNING_AFFIRMATIONS.length);
  const message = MORNING_AFFIRMATIONS[randomIndex];
  const partnerGreeting = userRole === 'sonne' ? 'meine Sonne ☀️' : 'mein Mond 🌙';
  return sendAppNotification(
    `[TEST] 🌅 Guten Morgen, ${partnerGreeting}!`,
    {
      body: `Dein positiver Gedanke für heute: "${message}"`,
      tag: 'test-morgen-affirmation',
    },
    true,
    'morgen_affirmation'
  );
};

// Test 2: Sternschnuppen Test
export const sendTestShootingStar = async (userRole: UserRoleType): Promise<boolean> => {
  const partnerName = userRole === 'sonne' ? 'dem Mond (Manuel)' : 'der Sonne (Stefanie)';
  return sendAppNotification(
    `[TEST] ✨ Neue Sternschnuppe am Himmel!`,
    {
      body: `Eine neue Wunschnote wurde von ${partnerName} an euren gemeinsamen Sternenhimmel gesetzt.`,
      tag: 'test-shooting-star',
    },
    true,
    'sternschnuppe'
  );
};

// Test 3: Gedanken Teilen Test
export const sendTestSharedThought = async (userRole: UserRoleType): Promise<boolean> => {
  const partnerName = userRole === 'sonne' ? 'Mond (Manuel)' : 'Sonne (Stefanie)';
  return sendAppNotification(
    `[TEST] 💬 Gedanken geteilt von ${partnerName}`,
    {
      body: `„In der Stille des Abends spüre ich unsere tiefe Verbundenheit.“ – Neuer Gedanke im SoulSpace.`,
      tag: 'test-shared-thought',
    },
    true,
    'gedanken'
  );
};


// 5:00 AM Morning Positive Message Scheduler
export const scheduleDailyMorningAffirmation = (
  userRole: UserRoleType,
  onAffirmationTriggered?: (msg: string) => void
) => {
  if (typeof window === 'undefined') return;

  if (morningTimerId) {
    window.clearTimeout(morningTimerId);
    morningTimerId = null;
  }

  const triggerMorningMessage = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastSent = localStorage.getItem('last_morning_affirmation_sent');
    if (lastSent === todayStr) return;

    // Pick random affirmation
    const randomIndex = Math.floor(Math.random() * MORNING_AFFIRMATIONS.length);
    const message = MORNING_AFFIRMATIONS[randomIndex];

    const partnerGreeting = userRole === 'sonne' ? 'meine Sonne ☀️' : 'mein Mond 🌙';
    sendAppNotification(`🌅 Guten Morgen, ${partnerGreeting}!`, {
      body: `Dein positiver Gedanke für heute: "${message}"`,
      tag: 'daily-morning-affirmation',
    });

    localStorage.setItem('last_morning_affirmation_sent', todayStr);
    if (onAffirmationTriggered) {
      onAffirmationTriggered(message);
    }

    scheduleNextFiveAm();
  };

  const scheduleNextFiveAm = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(5, 0, 0, 0);

    // If 5:00 AM already passed today, target tomorrow 5:00 AM
    if (now.getTime() >= target.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const msUntilFive = target.getTime() - now.getTime();
    morningTimerId = window.setTimeout(triggerMorningMessage, msUntilFive);
  };

  // If user opens the app in the morning (5:00 AM - 11:59 AM) and hasn't received today's message:
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const lastSent = localStorage.getItem('last_morning_affirmation_sent');
  if (now.getHours() >= 5 && now.getHours() < 12 && lastSent !== todayStr) {
    setTimeout(triggerMorningMessage, 2500);
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
            const authorTitle = data.authorRole === 'sonne' ? 'der Sonne ☀️' : 'dem Mond 🌙';
            sendAppNotification('✨ Eine neue Sternschnuppe am Himmel!', {
              body: `"${data.title || 'Neuer Wunsch'}" – von ${data.author || authorTitle}`,
              tag: `star-${change.doc.id}`,
            });
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
            const authorTitle = data.authorRole === 'sonne' ? 'Sonne ☀️' : 'Mond 🌙';
            sendAppNotification(`💌 Neuer Gedanke von ${data.authorName || authorTitle}!`, {
              body: `"${data.title || 'Gedanke'}" – ${data.content ? data.content.slice(0, 90) : ''}`,
              tag: `thought-${change.doc.id}`,
            });
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
