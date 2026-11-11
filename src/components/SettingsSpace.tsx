import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Bell,
  BellRing,
  Sparkles,
  Download,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Clock,
  MessageSquare,
  Smartphone,
  RefreshCw,
  Heart
} from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestMorningAffirmation,
  sendTestShootingStar,
  sendTestSharedThought,
  sendTestGuidedMeditationInvite,
  sendTestCouplesMeditationInvite,
  sendTestDreamJourneyInvite,
  sendTestHimmelsbegegnung,
  sendTestSommernachtAmSeeInvite,
  isNotificationSupported,
  getNotificationLogs,
  clearNotificationLogs,
} from '../services/notificationService';
import { UserRoleType, NotificationLogEntry } from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const SettingsSpace: React.FC = () => {
  const { role, setRole, isConfigured } = useUserRole();

  const [selectedRole, setSelectedRole] = useState<UserRoleType>(role || 'sonne');
  const [roleFeedback, setRoleFeedback] = useState<string | null>(null);

  // Notification state
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  // Log state & collapsible toggle (default closed)
  const [logs, setLogs] = useState<NotificationLogEntry[]>([]);
  const [isLogOpen, setIsLogOpen] = useState<boolean>(false);

  // Install / PWA prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as any).deferredInstallPrompt) {
      return (window as any).deferredInstallPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isTriggeringInstall, setIsTriggeringInstall] = useState<boolean>(false);
  const [justInstalled, setJustInstalled] = useState<boolean>(false);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load initial permission & logs
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }
    setLogs(getNotificationLogs());

    // Listen for log updates
    const handleLogsUpdate = (e: any) => {
      if (e.detail) {
        setLogs(e.detail);
      } else {
        setLogs(getNotificationLogs());
      }
    };

    // Check standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).deferredInstallPrompt = e;
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setJustInstalled(true);
      (window as any).deferredInstallPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('notification-log-updated', handleLogsUpdate);
    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('notification-log-updated', handleLogsUpdate);
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle persona change
  const handleSelectRole = async (r: UserRoleType) => {
    setSelectedRole(r);
    const defaultName = r === 'sonne' ? 'Die Sonne' : 'Der Mond';
    await setRole(r, defaultName);
    setRoleFeedback(`Rolle gewechselt zu ${r === 'sonne' ? 'Die Sonne' : 'Der Mond'}`);
    setTimeout(() => setRoleFeedback(null), 3000);
  };

  // Handle push notification permission
  const handleRequestPush = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : getNotificationPermission());
    if (granted) {
      setTestFeedback('Push-Nachrichten erfolgreich auf diesem Gerät aktiviert!');
      setTimeout(() => setTestFeedback(null), 4000);
    }
  };

  const ensurePermissionAndSend = async (sendFn: () => Promise<any>) => {
    if (!isNotificationSupported()) {
      alert('Dein Browser unterstützt keine Benachrichtigungen.');
      return;
    }
    if (Notification.permission !== 'granted') {
      const granted = await requestNotificationPermission();
      setPermission(granted ? 'granted' : getNotificationPermission());
      if (!granted) {
        alert('Bitte erlaube Push-Benachrichtigungen in deinem Browser, um Mitteilungen zu erhalten.');
        return;
      }
    }
    await sendFn();
  };

  // Test triggers
  const handleTestAffirmation = async () => {
    await ensurePermissionAndSend(() => sendTestMorningAffirmation(selectedRole));
    setTestFeedback('Test: Morgen Affirmation gesendet & im Log vermerkt!');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleTestStar = async () => {
    await ensurePermissionAndSend(() => sendTestShootingStar(selectedRole));
    setTestFeedback('Test: Sternschnuppen-Mitteilung gesendet & im Log vermerkt!');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleTestThought = async () => {
    await ensurePermissionAndSend(() => sendTestSharedThought(selectedRole));
    setTestFeedback('Test: Gedanken Teilen Mitteilung gesendet & im Log vermerkt!');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleTestGuidedMeditationInvite = async () => {
    await ensurePermissionAndSend(() => sendTestGuidedMeditationInvite(selectedRole));
    setTestFeedback('Test: Geführte Meditation Einladung gesendet & im Log vermerkt!');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleTestHimmelsbegegnung = async () => {
    await ensurePermissionAndSend(() => sendTestHimmelsbegegnung(selectedRole));
    setTestFeedback('Test: Himmelsbegegnung-Mitteilung gesendet & im Log vermerkt!');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleTestSommernachtAmSee = async () => {
    await ensurePermissionAndSend(() => sendTestSommernachtAmSeeInvite(selectedRole));
    setTestFeedback('Test: Sommernacht-Einladung gesendet & im Log vermerkt!');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleTestCouplesMeditationInvite = async () => {
    await ensurePermissionAndSend(() => sendTestCouplesMeditationInvite(selectedRole));
    setTestFeedback('Test: Paar-Meditation Einladung gesendet & im Log vermerkt!');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleTestDreamJourneyInvite = async () => {
    await ensurePermissionAndSend(() => sendTestDreamJourneyInvite(selectedRole));
    setTestFeedback('Test: Traumreise Einladung gesendet & im Log vermerkt!');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  // 1-Click Install handler
  const handleInstallClick = async () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(40); } catch (_) {}
    }

    const promptEvent: BeforeInstallPromptEvent | null =
      deferredPrompt || (window as any).deferredInstallPrompt;

    if (promptEvent && typeof promptEvent.prompt === 'function') {
      setIsTriggeringInstall(true);
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          setJustInstalled(true);
          (window as any).deferredInstallPrompt = null;
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowManualGuide(true);
      } finally {
        setIsTriggeringInstall(false);
      }
      return;
    }

    setShowManualGuide(true);
  };

  const handleClearLogs = () => {
    clearNotificationLogs();
    setLogs([]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in pb-16 px-2 sm:px-0">
      
      {/* Page Header */}
      <div className="text-center space-y-1">
        <div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0a232c] border-2 border-[#c79b78] text-[#ebd8c8] shadow-xl">
            <Settings className="w-6 h-6 animate-spin-slow text-[#c79b78]" />
          </div>
        </div>
        <br />
        <h2 className="text-2xl sm:text-3xl font-serif-serif font-bold gold-gradient-text tracking-wide pt-1">
          Einstellungen
        </h2>
        <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto">
          Passe deine Rolle an, verwalte Mitteilungen, lege das App-Icon auf dein Handy oder teste versendete Benachrichtigungen.
        </p>
      </div>

      {/* Global Feedback Banner */}
      {(roleFeedback || testFeedback) && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm text-center font-medium animate-fade-in flex items-center justify-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{roleFeedback || testFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3 ONBOARDING WINDOWS STACKED VERTICALLY (UNTEREINANDER)                  */}
      {/* ========================================================================= */}
      
      <div className="space-y-4">

        {/* FENSTER 1: Schritt 1 - Persona wählen */}
        <section className="bg-[#0a232c]/90 border-2 border-[#c79b78] rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-3.5 relative">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#c79b78]/20 border border-[#c79b78]/50 text-[#ebd8c8] text-[10px] font-bold uppercase tracking-wider">
                Schritt 1 von 3
              </span>
              <h3 className="font-serif-serif font-bold text-base sm:text-lg text-white flex items-center gap-1.5">
                <span>Persona wählen</span>
              </h3>
            </div>
            <span className="text-[11px] text-[#ebd8c8] font-semibold">
              Aktuell: {selectedRole === 'sonne' ? 'Die Sonne' : 'Der Mond'}
            </span>
          </div>

          <p className="text-xs text-white/80">
            Wähle deine Persona im gemeinsamen SoulSpace:
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleSelectRole('sonne')}
              className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-center gap-2.5 ${
                selectedRole === 'sonne'
                  ? 'bg-[#071920] border-[#c79b78] text-[#ebd8c8] font-bold shadow-lg ring-1 ring-[#c79b78]/60'
                  : 'bg-white/5 border-white/15 hover:border-[#c79b78]/60 text-white/80'
              }`}
            >
              <Sun className="w-4 h-4 text-[#ffe89c] shrink-0" />
              <span className="text-xs font-semibold">Die Sonne</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('mond')}
              className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-center gap-2.5 ${
                selectedRole === 'mond'
                  ? 'bg-[#071920] border-[#c79b78] text-[#ebd8c8] font-bold shadow-lg ring-1 ring-[#c79b78]/60'
                  : 'bg-white/5 border-white/15 hover:border-[#c79b78]/60 text-white/80'
              }`}
            >
              <Moon className="w-4 h-4 text-[#c79b78] shrink-0" />
              <span className="text-xs font-semibold">Der Mond</span>
            </button>
          </div>
        </section>

        {/* FENSTER 2: Schritt 2 - Push-Nachrichten */}
        <section className="bg-[#0a232c]/90 border-2 border-[#c79b78] rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-3.5">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#c79b78]/20 border border-[#c79b78]/50 text-[#ebd8c8] text-[10px] font-bold uppercase tracking-wider">
                Schritt 2 von 3
              </span>
              <h3 className="font-serif-serif font-bold text-base sm:text-lg text-white flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-[#c79b78]" />
                <span>Push-Nachrichten</span>
              </h3>
            </div>

            {permission === 'granted' ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-400/30">
                <Check className="w-3 h-3 text-emerald-400" /> Aktiv
              </span>
            ) : permission === 'denied' ? (
              <span className="flex items-center gap-1 text-[11px] text-rose-400 font-bold bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-400/30">
                <AlertCircle className="w-3 h-3 text-rose-400" /> Blockiert
              </span>
            ) : (
              <span className="text-[11px] text-[#ebd8c8] font-semibold">
                Ausstehend
              </span>
            )}
          </div>

          <p className="text-xs text-white/80 leading-snug">
            {selectedRole === 'sonne' ? (
              <>
                Lass die Nachrichten zu, damit dir der Mond
                <br />
                Mitteilungen senden kann.
              </>
            ) : (
              <>
                Lass die Nachrichten zu, damit dir die Sonne
                <br />
                Mitteilungen senden kann.
              </>
            )}
          </p>

          <button
            type="button"
            onClick={handleRequestPush}
            className="w-full py-3 px-4 rounded-xl gold-gradient-btn font-bold text-xs sm:text-sm tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4 text-[#c79b78] shrink-0" />
            <span className="gold-gradient-text">
              {permission === 'granted' ? '✓ Push-Nachrichten zugelassen & voll aktiv' : 'Push-Nachrichten zulassen'}
            </span>
          </button>
        </section>

        {/* FENSTER 3: Schritt 3 - App-Symbol auf den Bildschirm legen */}
        <section className="bg-[#0a232c]/90 border-2 border-[#c79b78] rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-3.5">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#c79b78]/20 border border-[#c79b78]/50 text-[#ebd8c8] text-[10px] font-bold uppercase tracking-wider">
                Schritt 3 von 3
              </span>
              <h3 className="font-serif-serif font-bold text-base sm:text-lg text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#c79b78]" />
                <span>App-Symbol ablegen</span>
              </h3>
            </div>

            {isInstalled || justInstalled ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-400/30">
                <Check className="w-3 h-3" /> Auf dem Bildschirm
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {/* Selected Golden App Icon Preview */}
            <div className="w-12 h-12 rounded-xl bg-[#071920] border-2 border-[#c79b78] shadow-xl overflow-hidden shrink-0 flex items-center justify-center p-0.5">
              <img
                src="/app-icon-selected.jpg"
                alt="Golden Sonne & Mond App Icon"
                className="w-full h-full object-cover rounded-lg select-none"
              />
            </div>

            <div className="space-y-0.5">
              <span className="font-serif-serif font-bold text-xs sm:text-sm text-[#ebd8c8] block leading-tight">
                1-Klick: App auf deinen Bildschirm legen
              </span>
              <span className="text-[11px] text-white/70 leading-tight block">
                Ein Klick lädt euer goldenes Sonne & Mond Icon direkt auf dein Handy!
              </span>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            disabled={isTriggeringInstall}
            className="w-full py-3 px-4 rounded-xl gold-gradient-btn font-bold text-xs sm:text-sm tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-75"
          >
            <Download className="w-4 h-4 text-[#c79b78] shrink-0" />
            <span className="gold-gradient-text">
              {isTriggeringInstall ? 'Wird geöffnet...' : 'JETZT AUF DEN BILDSCHIRM LEGEN'}
            </span>
          </button>

          {showManualGuide && (
            <div className="p-2.5 rounded-xl bg-[#c79b78]/15 border border-[#c79b78]/40 text-[#ebd8c8] text-[11px] leading-snug flex items-start gap-2 animate-fade-in">
              <span className="text-xs shrink-0">👉</span>
              <span>
                Tippe oben rechts in Chrome auf die 3 Punkte (⋮) ➔ „App installieren“ oder „Zum Startbildschirm hinzufügen“.
              </span>
            </div>
          )}

          <p className="text-[10px] text-white/60 text-center italic">
            Oder oben rechts im Chrome-Menü (⋮) auf „App installieren“ tippen.
          </p>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* TEST BEREICH FÜR NACHRICHTEN (UNTER DEN 3 ONBOARDING FENSTERN)            */}
      {/* ========================================================================= */}
      
      <section className="bg-[#0a232c]/90 border-2 border-[#c79b78]/60 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-4">
        <div className="border-b border-white/10 pb-2.5">
          <h3 className="font-serif-serif font-bold text-lg text-[#ebd8c8] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#c79b78]" />
            <span>Mitteilungen & Nachrichten testen</span>
          </h3>
          <p className="text-xs text-white/70 mt-0.5">
            Klicke auf die Test-Buttons, um Benachrichtigungen auszulösen und im untenstehenden Log-Fenster zu überprüfen:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          
          {/* Test 1: Morgen Affirmation */}
          <button
            type="button"
            onClick={handleTestAffirmation}
            className="p-3 rounded-2xl bg-white/5 border border-[#c79b78]/40 hover:border-[#c79b78] hover:bg-white/10 text-left transition space-y-1.5 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">🌅</span>
              <span className="px-2 py-0.5 rounded-full bg-[#c79b78]/20 text-[#ebd8c8] text-[9px] font-bold uppercase">
                Test
              </span>
            </div>
            <div className="font-bold text-xs text-[#ebd8c8] group-hover:underline">
              Morgen Affirmation
            </div>
            <p className="text-[10px] text-white/60 leading-tight">
              Testet den täglichen 5:00 Uhr Morgen-Impuls.
            </p>
          </button>

          {/* Test 2: Sternschnuppen */}
          <button
            type="button"
            onClick={handleTestStar}
            className="p-3 rounded-2xl bg-white/5 border border-[#c79b78]/40 hover:border-[#c79b78] hover:bg-white/10 text-left transition space-y-1.5 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">🌠</span>
              <span className="px-2 py-0.5 rounded-full bg-[#c79b78]/20 text-[#ebd8c8] text-[9px] font-bold uppercase">
                Test
              </span>
            </div>
            <div className="font-bold text-xs text-[#ebd8c8] group-hover:underline">
              Sternschnuppen
            </div>
            <p className="text-[10px] text-white/60 leading-tight">
              Testet Mitteilungen bei neuen Sternenwünschen.
            </p>
          </button>

          {/* Test 3: Gedanken Teilen */}
          <button
            type="button"
            onClick={handleTestThought}
            className="p-3 rounded-2xl bg-white/5 border border-[#c79b78]/40 hover:border-[#c79b78] hover:bg-white/10 text-left transition space-y-1.5 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">💌</span>
              <span className="px-2 py-0.5 rounded-full bg-[#c79b78]/20 text-[#ebd8c8] text-[9px] font-bold uppercase">
                Test
              </span>
            </div>
            <div className="font-bold text-xs text-[#ebd8c8] group-hover:underline">
              Gedanken Teilen
            </div>
            <p className="text-[10px] text-white/60 leading-tight">
              Testet Benachrichtigung bei neuen Journal-Gedanken.
            </p>
          </button>

          {/* Test 4: Geführte Meditation Einladung */}
          <button
            type="button"
            onClick={handleTestGuidedMeditationInvite}
            className="p-3 rounded-2xl bg-white/5 border border-[#c79b78]/40 hover:border-[#c79b78] hover:bg-white/10 text-left transition space-y-1.5 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">🧘</span>
              <span className="px-2 py-0.5 rounded-full bg-[#c79b78]/20 text-[#ebd8c8] text-[9px] font-bold uppercase">
                Test
              </span>
            </div>
            <div className="font-bold text-xs text-[#ebd8c8] group-hover:underline">
              Geführte Meditation
            </div>
            <p className="text-[10px] text-white/60 leading-tight">
              Testet die Einladung zu einer Geführten Meditation.
            </p>
          </button>

          {/* Test 5: Himmelsbegegnung */}
          <button
            type="button"
            onClick={handleTestHimmelsbegegnung}
            className="p-3 rounded-2xl bg-white/5 border border-[#c79b78]/40 hover:border-[#c79b78] hover:bg-white/10 text-left transition space-y-1.5 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">☀️🌕</span>
              <span className="px-2 py-0.5 rounded-full bg-[#c79b78]/20 text-[#ebd8c8] text-[9px] font-bold uppercase">
                Test
              </span>
            </div>
            <div className="font-bold text-xs text-[#ebd8c8] group-hover:underline">
              Himmelsbegegnung
            </div>
            <p className="text-[10px] text-white/60 leading-tight">
              Testet Himmelsbegegnungs-Mitteilungen.
            </p>
          </button>

          {/* Test 6: Sommernacht am See */}
          <button
            type="button"
            onClick={handleTestSommernachtAmSee}
            className="p-3 rounded-2xl bg-white/5 border border-[#c79b78]/40 hover:border-[#c79b78] hover:bg-white/10 text-left transition space-y-1.5 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">✨</span>
              <span className="px-2 py-0.5 rounded-full bg-[#c79b78]/20 text-[#ebd8c8] text-[9px] font-bold uppercase">
                Test
              </span>
            </div>
            <div className="font-bold text-xs text-[#ebd8c8] group-hover:underline">
              Sommernacht am See
            </div>
            <p className="text-[10px] text-white/60 leading-tight">
              Testet Sommernacht am See Einladungen.
            </p>
          </button>

          {/* Test 5: Paar-Meditation Einladung */}
          <button
            type="button"
            onClick={handleTestCouplesMeditationInvite}
            className="p-3 rounded-2xl bg-white/5 border border-[#c79b78]/40 hover:border-[#c79b78] hover:bg-white/10 text-left transition space-y-1.5 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">🧘💞</span>
              <span className="px-2 py-0.5 rounded-full bg-[#c79b78]/20 text-[#ebd8c8] text-[9px] font-bold uppercase">
                Test
              </span>
            </div>
            <div className="font-bold text-xs text-[#ebd8c8] group-hover:underline">
              Paar-Meditation
            </div>
            <p className="text-[10px] text-white/60 leading-tight">
              Testet die Einladung zu einer Tantra Paar-Meditation.
            </p>
          </button>

          {/* Test 6: Traumreise Einladung */}
          <button
            type="button"
            onClick={handleTestDreamJourneyInvite}
            className="p-3 rounded-2xl bg-white/5 border border-[#c79b78]/40 hover:border-[#c79b78] hover:bg-white/10 text-left transition space-y-1.5 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">🛋️</span>
              <span className="px-2 py-0.5 rounded-full bg-[#c79b78]/20 text-[#ebd8c8] text-[9px] font-bold uppercase">
                Test
              </span>
            </div>
            <div className="font-bold text-xs text-[#ebd8c8] group-hover:underline">
              Traumreise
            </div>
            <p className="text-[10px] text-white/60 leading-tight">
              Testet die Einladung zu einer entspannenden Traumreise.
            </p>
          </button>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* AUSKLAPPBARES LOG FENSTER (NOTIFICATION HISTORY LOG)                      */}
      {/* ========================================================================= */}
      
      <section className="bg-[#071920]/95 border-2 border-[#c79b78] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md transition-all">
        
        {/* Collapsible Header */}
        <div className="p-4 bg-[#0a232c] border-b border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsLogOpen(!isLogOpen)}
            className="flex items-center gap-2.5 text-left flex-1"
          >
            <MessageSquare className="w-5 h-5 text-[#c79b78] shrink-0" />
            <div>
              <div className="font-serif-serif font-bold text-base text-white flex items-center gap-2">
                <span>Mitteilungs-Log & Nachrichtenhistorie</span>
                <span className="px-2 py-0.5 rounded-full bg-[#c79b78]/20 text-[#ebd8c8] text-[10px] font-bold">
                  {logs.length} {logs.length === 1 ? 'Eintrag' : 'Einträge'}
                </span>
              </div>
              <span className="text-[11px] text-white/60 block">
                Übersicht aller versendeten Mitteilungen und durchgeführten Tests
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-rose-300 transition"
                title="Log leeren"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsLogOpen(!isLogOpen)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#ebd8c8] transition"
              title={isLogOpen ? 'Log einklappen' : 'Log ausklappen'}
            >
              {isLogOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isLogOpen && (
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto custom-scrollbar animate-fade-in">
            {logs.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Clock className="w-8 h-8 text-white/30 mx-auto" />
                <p className="text-xs text-white/60">
                  Noch keine Mitteilungen im Log vorhanden.
                </p>
                <p className="text-[11px] text-[#ebd8c8]/80">
                  Nutze die Test-Buttons oben, um Benachrichtigungen zu simulieren!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-2xl border text-xs space-y-1 transition ${
                      log.isTest
                        ? 'bg-[#c79b78]/10 border-[#c79b78]/40 text-white'
                        : 'bg-white/5 border-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {log.isTest ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#c79b78] text-[#071920] font-bold text-[9px] uppercase tracking-wider">
                            [TEST]
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-300 font-bold text-[9px] uppercase tracking-wider">
                            [SYSTEM]
                          </span>
                        )}
                        <span className="font-bold text-[#ebd8c8] truncate">
                          {log.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/50 shrink-0">
                        {log.timestamp}
                      </span>
                    </div>

                    {log.body && (
                      <p className="text-[11px] text-white/80 leading-snug pl-1 pt-0.5">
                        {log.body}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </section>

    </div>
  );
};
