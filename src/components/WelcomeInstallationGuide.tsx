import React, { useState, useEffect } from 'react';
import { useUserRole } from '../context/UserRoleContext';
import { Sun, Moon, Check, Sparkles, X, Bell, Download, Smartphone, ChevronRight } from 'lucide-react';
import { UserRoleType } from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const WelcomeInstallationGuide: React.FC = () => {
  const { role, displayName, isPickerOpen, isConfigured, setRole, closeRolePicker } = useUserRole();

  const [step, setStep] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<UserRoleType>(role || 'sonne');
  const [nameInput, setNameInput] = useState<string>(displayName || '');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';
  });
  const [isNotifRequesting, setIsNotifRequesting] = useState<boolean>(false);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as any).deferredInstallPrompt) {
      return (window as any).deferredInstallPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isTriggeringInstall, setIsTriggeringInstall] = useState<boolean>(false);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);

  // Check initial PWA & Notification states
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const inApp = /wv|fbav|instagram|line|micromessenger|whatsapp/.test(ua);
    setIsInAppBrowser(inApp);

    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).deferredInstallPrompt = e;
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Update selected role name default
  const handleSelectRole = (r: UserRoleType) => {
    setSelectedRole(r);
    if (!nameInput || nameInput === 'Sonne (Stefanie)' || nameInput === 'Mond (Manuel)') {
      setNameInput(r === 'sonne' ? 'Sonne (Stefanie)' : 'Mond (Manuel)');
    }
  };

  // Step 1 -> Step 2
  const handleSaveStep1 = () => {
    setRole(selectedRole, nameInput.trim() || undefined);
    setStep(2);
  };

  // Step 2: Request Push Permission without explanation
  const handleRequestPushNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setStep(3);
      return;
    }

    setIsNotifRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
    } catch (err) {
      console.warn('Could not request notification permission:', err);
    } finally {
      setIsNotifRequesting(false);
    }
  };

  // Step 3: Trigger 1-Click Install
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

  // Close guide modal
  const handleFinishGuide = () => {
    setRole(selectedRole, nameInput.trim() || undefined);
    localStorage.setItem('welcome_guide_completed', 'true');
    closeRolePicker();
  };

  // If already configured and modal is not explicitly triggered, do not render
  if (isConfigured && !isPickerOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0a232c] border-2 border-[#dfba61] rounded-3xl p-5 sm:p-7 shadow-2xl text-white space-y-5 my-auto">
        
        {/* Close button if user wants to close */}
        {isConfigured && (
          <button
            onClick={closeRolePicker}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header & Step Indicator */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dfba61]/20 border border-[#dfba61]/40 text-[#f5d77f] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#dfba61]" />
            <span>Willkommen · Schritt {step} von 3</span>
          </div>

          <h3 className="font-serif-serif text-2xl sm:text-3xl font-bold gold-gradient-text leading-tight">
            {step === 1 && '1. Wähle deine Persona'}
            {step === 2 && '2. Push-Nachrichten'}
            {step === 3 && '3. App auf Startbildschirm'}
          </h3>

          {/* Step Progress Bar */}
          <div className="flex items-center justify-center gap-2 pt-1 max-w-xs mx-auto">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-[#dfba61]' : 'bg-white/10'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-[#dfba61]' : 'bg-white/10'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-[#dfba61]' : 'bg-white/10'}`} />
          </div>
        </div>

        {/* STEP 1: Persona Sonne oder Mond */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs sm:text-sm text-white/80 text-center">
              Wähle deine Persona, damit eure Nachrichten, Sterne und Gedanken immer richtig zugeordnet werden.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Sonne Option */}
              <button
                type="button"
                onClick={() => handleSelectRole('sonne')}
                className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center space-y-2.5 ${
                  selectedRole === 'sonne'
                    ? 'bg-[#071920] border-[#dfba61] shadow-[0_0_20px_rgba(223,186,97,0.35)] scale-[1.02]'
                    : 'bg-white/5 border-white/10 hover:border-white/30 opacity-80 hover:opacity-100'
                }`}
              >
                {selectedRole === 'sonne' && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#dfba61] text-[#0a232c] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-full bg-[#dfba61]/20 flex items-center justify-center text-[#dfba61] border border-[#dfba61]/40">
                  <Sun className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-serif-serif text-lg font-bold text-[#dfba61]">
                    Die Sonne
                  </div>
                  <p className="text-[11px] text-white/70">
                    Stefanie · Wärme, Tag & lebendige Energie
                  </p>
                </div>
              </button>

              {/* Mond Option */}
              <button
                type="button"
                onClick={() => handleSelectRole('mond')}
                className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center space-y-2.5 ${
                  selectedRole === 'mond'
                    ? 'bg-[#071920] border-[#f5d77f] shadow-[0_0_20px_rgba(245,215,127,0.35)] scale-[1.02]'
                    : 'bg-white/5 border-white/10 hover:border-white/30 opacity-80 hover:opacity-100'
                }`}
              >
                {selectedRole === 'mond' && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#f5d77f] text-[#0a232c] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-full bg-[#f5d77f]/20 flex items-center justify-center text-[#f5d77f] border border-[#f5d77f]/40">
                  <Moon className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-serif-serif text-lg font-bold text-[#f5d77f]">
                    Der Mond
                  </div>
                  <p className="text-[11px] text-white/70">
                    Manuel · Stille, Nacht & innere Ruhe
                  </p>
                </div>
              </button>
            </div>

            {/* Name input */}
            <div className="space-y-1">
              <label className="text-xs text-white/70 block font-medium">
                Dein Name:
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={selectedRole === 'sonne' ? 'Sonne (Stefanie)' : 'Mond (Manuel)'}
                className="w-full px-4 py-2.5 rounded-xl bg-[#071920] border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#dfba61] text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveStep1}
              className="w-full py-3 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-sm tracking-wide shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Weiter zu Schritt 2</span>
              <ChevronRight className="w-4 h-4 text-[#0a232c]" />
            </button>
          </div>
        )}

        {/* STEP 2: Push-Nachrichten zulassen (ohne Erklärung) */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#071920] border-2 border-[#dfba61] flex items-center justify-center text-[#f5d77f] shadow-xl">
              <Bell className="w-7 h-7 animate-pulse" />
            </div>

            <p className="text-xs sm:text-sm text-white/80 max-w-sm mx-auto">
              Erlaube Push-Nachrichten auf deinem Gerät für den Seelenraum.
            </p>

            {notifPermission === 'granted' ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Push-Nachrichten sind bereits zugelassen!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestPushNotifications}
                disabled={isNotifRequesting}
                className="w-full py-3 px-4 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs sm:text-sm tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4 text-[#0a232c] fill-[#0a232c]" />
                <span>{isNotifRequesting ? 'Anfragen...' : 'Push-Nachrichten zulassen'}</span>
              </button>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 text-xs font-medium transition"
              >
                Zurück
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs flex items-center gap-1.5 shadow-lg transition active:scale-95"
              >
                <span>Weiter zu Schritt 3</span>
                <ChevronRight className="w-4 h-4 text-[#0a232c]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: App symbol auf Smartphone Desktop legen */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Live App Icon Preview with complete golden emblem (100% visible, no green borders) */}
            <div className="p-4 rounded-2xl bg-[#071920] border border-[#c79b78]/40 flex items-center gap-3.5 shadow-inner">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#071920] border-2 border-[#c79b78] shadow-2xl shrink-0 overflow-hidden p-1 flex items-center justify-center">
                <img
                  src="/pwa-icon-192.png"
                  alt="Goldenes Sonne & Mond Icon"
                  className="w-full h-full object-contain rounded-xl select-none"
                />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 text-[#f5d77f] text-[11px] font-bold uppercase tracking-wider">
                  <Smartphone className="w-3.5 h-3.5 text-[#c79b78]" />
                  <span>1-Klick: App auf deinen Android-Bildschirm legen</span>
                </div>
                <p className="text-xs text-white/80 leading-snug">
                  Ein Klick lädt euer goldenes Sonne & Mond Icon direkt auf dein Handy!
                </p>
              </div>
            </div>

            {/* Main Action Button */}
            {isInstalled ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm text-center font-semibold flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Das App-Symbol liegt bereits auf deinem Bildschirm!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isTriggeringInstall}
                className="w-full py-3.5 px-4 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs sm:text-sm tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-75"
              >
                <Download className="w-4.5 h-4.5 text-[#0a232c] shrink-0" />
                <span>{isTriggeringInstall ? 'Wird geöffnet...' : 'JETZT AUF DEN STARTBILDSCHIRM LEGEN'}</span>
              </button>
            )}

            {/* Manual Fallback Guide */}
            {showManualGuide && (
              <div className="p-3 rounded-xl bg-[#dfba61]/15 border border-[#dfba61]/40 text-[#f5d77f] text-xs leading-relaxed flex items-start gap-2 animate-fade-in">
                <span className="text-base shrink-0">👉</span>
                <span>
                  {isInAppBrowser
                    ? 'In WhatsApp/Nachricht geöffnet: Tippe oben rechts auf die 3 Punkte (⋮) ➔ „In Chrome öffnen“, damit das Icon direkt abgelegt werden kann.'
                    : 'Tippe oben rechts in Chrome auf die 3 Punkte (⋮) ➔ „App installieren“ oder „Zum Startbildschirm hinzufügen“.'}
                </span>
              </div>
            )}

            <p className="text-[11px] text-white/60 text-center italic">
              Oder oben rechts im Chrome-Menü (⋮) auf „App installieren“ tippen.
            </p>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 text-xs font-medium transition"
              >
                Zurück
              </button>

              <button
                type="button"
                onClick={handleFinishGuide}
                className="px-5 py-2.5 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-[#0a232c]" />
                <span>In den Seelenraum eintreten</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
