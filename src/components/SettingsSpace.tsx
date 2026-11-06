import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Bell,
  BellRing,
  Sparkles,
  Clock,
  Check,
  Smartphone,
  AlertCircle,
  Download,
  Share2,
  Heart,
  Edit3,
  Palette
} from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { useTheme } from '../context/ThemeContext';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
} from '../services/notificationService';
import { UserRoleType } from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const SettingsSpace: React.FC = () => {
  const { role, displayName, setRole, openRolePicker } = useUserRole();
  const { colorScheme, setColorScheme, isCopper } = useTheme();

  // Theme feedback state
  const [themeFeedback, setThemeFeedback] = useState<string | null>(null);

  // Notification state
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState<boolean>(false);
  const [roleChangeFeedback, setRoleChangeFeedback] = useState<string | null>(null);

  // Install / PWA state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as any).deferredInstallPrompt) {
      return (window as any).deferredInstallPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isTriggeringInstall, setIsTriggeringInstall] = useState<boolean>(false);
  const [justInstalled, setJustInstalled] = useState<boolean>(false);
  const [installHelperMessage, setInstallHelperMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check Notification support
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }

    // Check standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Listen for install prompt events
    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).deferredInstallPrompt = e;
    };

    const handlePromptReady = (e: any) => {
      if (e.detail) {
        setDeferredPrompt(e.detail);
      } else if ((window as any).deferredInstallPrompt) {
        setDeferredPrompt((window as any).deferredInstallPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setJustInstalled(true);
      (window as any).deferredInstallPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    window.addEventListener('deferred-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('app-installed-success', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('deferred-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('app-installed-success', handleAppInstalled);
    };
  }, []);

  // Handle switching role directly
  const handleSelectRole = async (newRole: UserRoleType) => {
    const defaultName = newRole === 'sonne' ? 'Sonne (Stefanie)' : 'Mond (Manuel)';
    await setRole(newRole, defaultName);
    setRoleChangeFeedback(`Rolle gewechselt zu ${newRole === 'sonne' ? 'Sonne (Stefanie)' : 'Mond (Manuel)'}!`);
    setTimeout(() => setRoleChangeFeedback(null), 3000);
  };

  // Handle switching color scheme
  const handleSelectTheme = (scheme: 'copper' | 'gold') => {
    setColorScheme(scheme);
    setThemeFeedback(
      scheme === 'copper'
        ? 'Kupfer-Farbschema aktiviert! Menüs, Überschriften, Rahmen & Buttons strahlen jetzt im warmen Kupferglanz.'
        : 'Klassisches Gold-Farbschema aktiviert!'
    );
    setTimeout(() => setThemeFeedback(null), 3500);
  };

  // Request notifications
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : getNotificationPermission());
    if (granted) {
      await sendTestNotification(role);
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  // Send test notification
  const handleSendTestNotification = async () => {
    const sent = await sendTestNotification(role);
    if (sent) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
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
      } finally {
        setIsTriggeringInstall(false);
      }
      return;
    }

    // Check if already installed
    if ('getInstalledRelatedApps' in navigator) {
      try {
        const apps = await (navigator as any).getInstalledRelatedApps();
        if (apps && apps.length > 0) {
          setIsInstalled(true);
          setJustInstalled(true);
          return;
        }
      } catch (_) {}
    }

    // Gentle fallback message if browser doesn't supply event
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    if (isIOS) {
      setInstallHelperMessage('Auf dem iPhone: Tippe unten auf Teilen (Quadrat mit Pfeil) ➔ „Zum Home-Bildschirm“.');
    } else {
      setInstallHelperMessage('Tippe oben rechts in Chrome auf die 3 Punkte (⋮) ➔ „App installieren“ oder „Zum Startbildschirm hinzufügen“.');
    }
    setTimeout(() => setInstallHelperMessage(null), 6000);
  };

  const partnerLabel = role === 'sonne' ? 'Mond (Manuel)' : 'Sonne (Stefanie)';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* 1. Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0a232c] border-2 border-[#dfba61] text-[#dfba61] shadow-xl">
          <Settings className="w-7 h-7 animate-spin-slow" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif-serif font-bold gold-gradient-text tracking-wide">
          Einstellungen
        </h2>
        <p className="text-sm sm:text-base text-white/80 max-w-lg mx-auto">
          Verwalte hier eure Rollen, Handy-Benachrichtigungen und das App-Icon für euren Startbildschirm.
        </p>
      </div>

      {/* 2. SECTION: Neues Farbschema (Kupfer-Relief vs. Gold) */}
      <section className="bg-[#0a232c]/90 border-2 border-[#dfba61]/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-serif-serif font-bold text-[#f5d77f] flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#dfba61]" />
                <span>Neues Farbschema wählen</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#ebd8c8] to-[#c79b78] text-[#1a0f0a] text-[10px] font-bold shadow uppercase tracking-wider">
                Jetzt zum Testen
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/70 mt-1">
              Farbverläufe direkt aus eurem Berg- & Himmelsbild (Manuel & Stefanie): Menüpunkte, Überschriften, Rahmen, Buttons und Icons.
            </p>
          </div>
        </div>

        {themeFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm text-center font-medium animate-fade-in flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{themeFeedback}</span>
          </div>
        )}

        {/* 2 Theme Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Card 1: Edles Kupfer (Kupfer-Relief aus dem Bild) */}
          <div
            onClick={() => handleSelectTheme('copper')}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
              isCopper
                ? 'bg-[#87583b]/20 border-[#c79b78] shadow-[0_0_25px_rgba(199,155,120,0.35)] ring-1 ring-[#c79b78]'
                : 'bg-white/5 border-white/10 hover:border-[#c79b78]/50 hover:bg-white/10'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#c79b78]/25 border border-[#c79b78]/60 flex items-center justify-center text-[#c79b78]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-serif-serif font-bold text-white">Edler Kupfer-Glanz</h4>
                    <span className="text-[10px] text-[#c79b78] font-semibold block">Aus eurem Kupferbild</span>
                  </div>
                </div>

                {isCopper && (
                  <span className="flex items-center gap-1 text-xs font-bold text-[#1a0f0a] bg-gradient-to-r from-[#ebd8c8] to-[#c79b78] px-2.5 py-1 rounded-full shadow">
                    <Check className="w-3.5 h-3.5" /> Aktiv
                  </span>
                )}
              </div>

              {/* Embedded preview of the user's uploaded image */}
              <div className="w-full h-28 rounded-xl bg-white/95 border border-[#c79b78]/40 overflow-hidden flex items-center justify-center p-2 shadow-inner">
                <img
                  src="/assets/aistudio/1_0ac96aa9.png"
                  alt="Kupfer-Originalbild Manuel & Stefanie"
                  className="max-h-full max-w-full object-contain select-none"
                />
              </div>

              {/* Color Gradient Swatches */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-white/60 font-medium">Extrahiertes Kupfer-Spektrum:</div>
                <div className="flex items-center gap-1.5 w-full">
                  <div className="h-4 flex-1 rounded bg-[#ebd8c8]" title="#ebd8c8 Champagner-Licht" />
                  <div className="h-4 flex-1 rounded bg-[#d6c5b4]" title="#d6c5b4 Rosé-Kupfer" />
                  <div className="h-4 flex-1 rounded bg-[#c79b78]" title="#c79b78 Strahlendes Kupfer" />
                  <div className="h-4 flex-1 rounded bg-[#b88562]" title="#b88562 Brüniertes Kupfer" />
                  <div className="h-4 flex-1 rounded bg-[#87583b]" title="#87583b Terrakotta-Tiefe" />
                </div>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                Warme, erdende Kupfer- und Terrakotta-Töne. Verleiht Menüs, Überschriften, Rahmen und Buttons ein harmonisches, kostbares Relief.
              </p>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleSelectTheme('copper'); }}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                isCopper
                  ? 'bg-gradient-to-r from-[#ebd8c8] via-[#c79b78] to-[#a27b5c] text-[#1a0f0a] shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              {isCopper ? 'Aktives Farbschema' : 'Kupfer-Farbschema aktivieren'}
            </button>
          </div>

          {/* Card 2: Klassisches Gold */}
          <div
            onClick={() => handleSelectTheme('gold')}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
              !isCopper
                ? 'bg-[#dfba61]/15 border-[#dfba61] shadow-[0_0_20px_rgba(223,186,97,0.3)] ring-1 ring-[#dfba61]'
                : 'bg-white/5 border-white/10 hover:border-[#dfba61]/50 hover:bg-white/10'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#dfba61]/20 border border-[#dfba61]/50 flex items-center justify-center text-[#dfba61]">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-serif-serif font-bold text-white">Klassisches Gold</h4>
                    <span className="text-[10px] text-[#f5d77f] font-semibold block">Petrol & Sonnen-Gold</span>
                  </div>
                </div>

                {!isCopper && (
                  <span className="flex items-center gap-1 text-xs font-bold text-[#0a232c] bg-[#dfba61] px-2.5 py-1 rounded-full shadow">
                    <Check className="w-3.5 h-3.5" /> Aktiv
                  </span>
                )}
              </div>

              {/* Gold Palette Box */}
              <div className="w-full h-28 rounded-xl bg-[#071920] border border-[#dfba61]/40 flex flex-col items-center justify-center p-3 text-center space-y-2 shadow-inner">
                <span className="font-serif-serif text-lg font-bold text-[#f5d77f]">
                  Sonne, Mond & Sterne
                </span>
                <span className="text-[11px] text-[#e6d3a3]/80 italic">
                  Klassisches Leuchten
                </span>
              </div>

              {/* Color Swatches */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-white/60 font-medium">Gold-Spektrum:</div>
                <div className="flex items-center gap-1.5 w-full">
                  <div className="h-4 flex-1 rounded bg-[#f5d77f]" title="#f5d77f Sonnen-Gold" />
                  <div className="h-4 flex-1 rounded bg-[#dfba61]" title="#dfba61 Gold-Folie" />
                  <div className="h-4 flex-1 rounded bg-[#e6d3a3]" title="#e6d3a3 Helles Gold" />
                  <div className="h-4 flex-1 rounded bg-[#b09b69]" title="#b09b69 Warmes Gold" />
                </div>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                Der vertraute, sonnige Goldglanz mit kräftigem Kontrast auf tiefem Nacht-Petrol.
              </p>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleSelectTheme('gold'); }}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                !isCopper
                  ? 'gold-gradient-btn text-[#0a232c] shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              {!isCopper ? 'Aktives Farbschema' : 'Gold-Farbschema aktivieren'}
            </button>
          </div>

        </div>

        {/* Live-Vorschau Bar */}
        <div className="p-4 rounded-2xl bg-[#071920] border border-white/10 space-y-3">
          <div className="text-xs font-semibold text-white/80 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#dfba61]" />
              <span>Live-Vorschau der angepassten Elemente:</span>
            </span>
            <span className="text-[11px] text-white/50">
              {isCopper ? 'Kupfer aktiv' : 'Gold aktiv'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* 1. Preview Heading */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">Überschrift</span>
              <span className="gold-gradient-text font-serif-serif font-bold text-base sm:text-lg leading-tight">
                Liebe, Freiheit, Achtsamkeit
              </span>
            </div>

            {/* 2. Preview Nav Pill */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
              <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">Menüpunkt</span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#071920] border-2 border-[#dfba61] shadow">
                <Sun className="w-3.5 h-3.5 text-[#dfba61]" />
                <span className="gold-gradient-text text-xs font-bold">Sonnenstrahl</span>
              </div>
            </div>

            {/* 3. Preview Button */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
              <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">Button & Icon</span>
              <button className="gold-gradient-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow">
                <Heart className="w-3 h-3 text-[#1a0f0a] fill-[#1a0f0a]" />
                <span>Muster-Button</span>
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* 3. SECTION: Rolle wählen (Sonne oder Mond) */}
      <section className="bg-[#0a232c]/90 border-2 border-[#dfba61]/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-serif-serif font-bold text-[#f5d77f] flex items-center gap-2">
              <Sun className="w-5 h-5 text-[#dfba61]" />
              <span>Auswahl: Sonne oder Mond</span>
            </h3>
            <p className="text-xs sm:text-sm text-white/70">
              Wähle aus, mit welcher Rolle du diesen Rückzugsort betrittst.
            </p>
          </div>
          
          <button
            onClick={openRolePicker}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#f5d77f] text-xs font-semibold border border-[#dfba61]/40 transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Namen anpassen</span>
          </button>
        </div>

        {/* Current status indicator */}
        <div className="p-3 rounded-2xl bg-[#071920] border border-[#dfba61]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
              role === 'sonne' ? 'bg-[#dfba61]/20 text-[#dfba61] border border-[#dfba61]/50' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
            }`}>
              {role === 'sonne' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[11px] text-white/50 block">Aktuell angemeldet als:</span>
              <span className="font-bold text-[#f5d77f] text-sm sm:text-base">{displayName}</span>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
            Aktiv
          </span>
        </div>

        {roleChangeFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs text-center font-medium animate-fade-in flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            <span>{roleChangeFeedback}</span>
          </div>
        )}

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Sonne Card (Stefanie) */}
          <div
            onClick={() => handleSelectRole('sonne')}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between gap-4 ${
              role === 'sonne'
                ? 'bg-[#dfba61]/15 border-[#dfba61] shadow-[0_0_20px_rgba(223,186,97,0.3)] ring-1 ring-[#dfba61]'
                : 'bg-white/5 border-white/10 hover:border-[#dfba61]/50 hover:bg-white/10'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-[#dfba61]">
                  <Sun className="w-6 h-6 animate-pulse" />
                </div>
                {role === 'sonne' && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-400/40">
                    <Check className="w-3.5 h-3.5" /> Ausgewählt
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-lg font-serif-serif font-bold text-white">Sonne (Stefanie)</h4>
                <p className="text-xs text-white/70 leading-relaxed mt-1">
                  Wärmespenderin, Licht, Lebensfreude und ermutigende Kraft für jeden neuen Tag.
                </p>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleSelectRole('sonne'); }}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                role === 'sonne'
                  ? 'gold-gradient-btn text-[#0a232c] shadow'
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              {role === 'sonne' ? 'Aktive Rolle' : 'Als Sonne auswählen'}
            </button>
          </div>

          {/* Mond Card (Manuel) */}
          <div
            onClick={() => handleSelectRole('mond')}
            className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between gap-4 ${
              role === 'mond'
                ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400'
                : 'bg-white/5 border-white/10 hover:border-cyan-400/50 hover:bg-white/10'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Moon className="w-6 h-6 animate-pulse" />
                </div>
                {role === 'mond' && (
                  <span className="flex items-center gap-1 text-xs font-bold text-cyan-300 bg-cyan-400/20 px-2.5 py-1 rounded-full border border-cyan-400/40">
                    <Check className="w-3.5 h-3.5" /> Ausgewählt
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-lg font-serif-serif font-bold text-white">Mond (Manuel)</h4>
                <p className="text-xs text-white/70 leading-relaxed mt-1">
                  Ruhepol, Sanftmut, tiefe Gelassenheit und schützender Begleiter durch die Nacht.
                </p>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleSelectRole('mond'); }}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                role === 'mond'
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-[#0a232c] shadow'
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              {role === 'mond' ? 'Aktive Rolle' : 'Als Mond auswählen'}
            </button>
          </div>

        </div>
      </section>

      {/* 3. SECTION: Handy-Benachrichtigungen */}
      <section className="bg-[#0a232c]/90 border-2 border-[#dfba61]/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-xl sm:text-2xl font-serif-serif font-bold text-[#f5d77f] flex items-center gap-2">
            <BellRing className="w-5 h-5 text-[#dfba61]" />
            <span>Handy-Benachrichtigungen & Morgen-Botschaft</span>
          </h3>
          <p className="text-xs sm:text-sm text-white/70">
            Bleibt sanft und verlässlich miteinander verbunden – egal wo ihr euch befindet.
          </p>
        </div>

        {/* Status & Control Panel */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#071920] border border-[#dfba61]/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
            <span className="text-white/70">Aktueller Mitteilungs-Status:</span>
            {permission === 'granted' ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Check className="w-4 h-4 text-emerald-400" /> Erlaubt & Voll Aktiv
              </span>
            ) : permission === 'denied' ? (
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-400" /> Im Browser blockiert
              </span>
            ) : (
              <span className="text-[#fae298] font-bold">
                Noch nicht aktiviert
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {permission !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="flex-1 py-3 px-4 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs sm:text-sm tracking-wide shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4 text-[#0a232c]" />
                <span>Benachrichtigungen auf dem Handy erlauben</span>
              </button>
            ) : (
              <button
                onClick={handleSendTestNotification}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-[#f5d77f] border border-[#dfba61]/40 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-[#dfba61]" />
                <span>Test-Mitteilung aufs Handy senden</span>
              </button>
            )}
          </div>

          {testSent && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm text-center font-medium animate-fade-in flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Test-Benachrichtigung gesendet! Prüfe den Sperrbildschirm deines Handys.</span>
            </div>
          )}
        </div>

        {/* The 4 magical notification services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#dfba61]/20 text-[#dfba61] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#f5d77f] block">Neue Sternschnuppen</span>
              <p className="text-white/70 leading-relaxed mt-0.5">
                Sofortige Mitteilung, wenn {partnerLabel} einen Stern mit einer lieben Botschaft an den Himmel setzt.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#dfba61]/20 text-[#dfba61] shrink-0 mt-0.5">
              <Heart className="w-4 h-4 text-[#f5d77f]" />
            </div>
            <div>
              <span className="font-bold text-[#f5d77f] block">Geteilte Gedanken</span>
              <p className="text-white/70 leading-relaxed mt-0.5">
                Mitteilung aufs Handy, wenn {partnerLabel} einen neuen Gedanken oder eine Notiz verfasst.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#dfba61]/20 text-[#dfba61] shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#f5d77f] block">Täglich um 5:00 Uhr morgens</span>
              <p className="text-white/70 leading-relaxed mt-0.5">
                Jeden Morgen um 5:00 Uhr ein stärkender, liebevoller Morgen-Impuls für einen geborgenen Tag.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#dfba61]/20 text-[#dfba61] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <span className="font-bold text-[#f5d77f] block">Himmelsbegegnung</span>
              <p className="text-white/70 leading-relaxed mt-0.5">
                Wenn ihr Sonne und Mond virtuell zusammenführt, spürt der Partner sofort eure liebevolle Nähe.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. SECTION: App-Icon & Installation auf dem Startbildschirm */}
      <section className="bg-[#0a232c]/90 border-2 border-[#dfba61]/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-xl sm:text-2xl font-serif-serif font-bold text-[#f5d77f] flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#dfba61]" />
            <span>App-Icon & Auf den Startbildschirm legen</span>
          </h3>
          <p className="text-xs sm:text-sm text-white/70">
            Öffne euren digitalen Rückzugsort wie eine echte Handy-App direkt vom Startbildschirm.
          </p>
        </div>

        {/* Selected App Icon Showcase */}
        <div className="p-5 rounded-2xl bg-[#071920] border border-[#dfba61]/40 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#0a232c] border-2 border-[#dfba61] shadow-[0_0_25px_rgba(223,186,97,0.4)] flex items-center justify-center overflow-hidden p-1.5 transition-transform group-hover:scale-105">
              <img
                src="/pwa-icon-192.png"
                alt="Sonne, Mond & Sterne App-Icon"
                className="w-full h-full object-contain rounded-2xl select-none"
              />
            </div>
            <div className="absolute -bottom-2 inset-x-0 text-center">
              <span className="px-2 py-0.5 rounded-full bg-[#dfba61] text-[#0a232c] text-[10px] font-bold shadow uppercase tracking-wider">
                Motiv 3 (Fixiert)
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <h4 className="text-lg font-serif-serif font-bold text-[#f5d77f]">
              Kupfer-Sonne & Mond über den Bergen
            </h4>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Dieses Motiv liegt als offizielles Icon für euer Handy bereit. Mit echten transparenten Ecken, damit es sich nahtlos an euren Android- oder iPhone-Startbildschirm anpasst.
            </p>
            <div className="text-[11px] text-white/50 pt-1">
              Startet ohne Browserleiste · Vollbild-Erlebnis · Sofort griffbereit
            </div>
          </div>
        </div>

        {/* 1-Click Install Button & Status */}
        <div className="space-y-3">
          {justInstalled || isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm text-center font-medium flex items-center justify-center gap-2">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Das Icon ist auf deinem Startbildschirm bereit! Du kannst die App direkt von dort öffnen.</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              disabled={isTriggeringInstall}
              className="w-full py-4 rounded-2xl gold-gradient-btn text-[#0a232c] font-bold text-sm sm:text-base tracking-wide shadow-2xl transition active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-75"
            >
              <Download className="w-5 h-5 text-[#0a232c]" />
              <span>{isTriggeringInstall ? 'Wird geöffnet...' : 'JETZT AUF DEN STARTBILDSCHIRM LEGEN'}</span>
            </button>
          )}

          {installHelperMessage && (
            <div className="p-3 rounded-xl bg-[#dfba61]/15 border border-[#dfba61]/40 text-[#f5d77f] text-xs text-center font-medium animate-fade-in flex items-center justify-center gap-2">
              <span>👉 {installHelperMessage}</span>
            </div>
          )}
        </div>

        {/* Step-by-Step Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          
          {/* Android Guide */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-[#dfba61] font-bold text-xs sm:text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Für Android (Google Chrome):</span>
            </div>
            <ol className="text-xs text-white/70 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Klicke auf den goldenen Button oben oder</li>
              <li>Tippe oben rechts auf die drei Punkte <strong className="text-white">(⋮)</strong></li>
              <li>Wähle <strong className="text-[#f5d77f]">„App installieren“</strong> oder <strong className="text-[#f5d77f]">„Zum Startbildschirm hinzufügen“</strong></li>
            </ol>
          </div>

          {/* iPhone Guide */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs sm:text-sm">
              <Share2 className="w-4 h-4" />
              <span>Für iPhone & iPad (Safari):</span>
            </div>
            <ol className="text-xs text-white/70 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Tippe unten in Safari auf das <strong className="text-white">Teilen-Symbol</strong> (Quadrat mit Pfeil)</li>
              <li>Scrolle nach unten und tippe auf <strong className="text-[#f5d77f]">„Zum Home-Bildschirm“</strong></li>
              <li>Tippe oben rechts auf <strong className="text-white">„Hinzufügen“</strong></li>
            </ol>
          </div>

        </div>
      </section>

    </div>
  );
};
