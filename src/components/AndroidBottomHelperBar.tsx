import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Sun, Moon, Bell, Sparkles, ChevronRight } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { UserRoleType } from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const AndroidBottomHelperBar: React.FC = () => {
  const { role, displayName, setRole, isConfigured } = useUserRole();

  // Current step in the bottom bar (1: Persona, 2: Push, 3: Desktop Icon)
  const [step, setStep] = useState<number>(() => {
    if (!isConfigured) return 1;
    return 3;
  });

  const [selectedRole, setSelectedRole] = useState<UserRoleType>(role || 'sonne');
  const [nameInput, setNameInput] = useState<string>(displayName || '');

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as any).deferredInstallPrompt) {
      return (window as any).deferredInstallPrompt;
    }
    return null;
  });

  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [justInstalled, setJustInstalled] = useState<boolean>(false);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);
  const [notifGranted, setNotifGranted] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isDismissed = localStorage.getItem('android_helper_dismissed') === 'true';

    const inApp = /wv|fbav|instagram|line|micromessenger|whatsapp/.test(ua);
    setIsInAppBrowser(inApp);

    if (!isIOSDevice && !isDismissed) {
      setShowBanner(true);
    }

    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).deferredInstallPrompt = e;
      setShowBanner(true);
      setShowManualGuide(false);
    };

    const handleOpenBarEvent = () => {
      setShowBanner(true);
      setStep(1);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setJustInstalled(true);
      (window as any).deferredInstallPrompt = null;
      setDeferredPrompt(null);
      setTimeout(() => setShowBanner(false), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('open-install-pwa', handleOpenBarEvent);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-install-pwa', handleOpenBarEvent);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Step 1: Handle Persona selection
  const handleSelectRole = (r: UserRoleType) => {
    setSelectedRole(r);
    const newName = r === 'sonne' ? 'Sonne (Stefanie)' : 'Mond (Manuel)';
    setNameInput(newName);
    setRole(r, newName);
    // Auto advance to Step 2
    setStep(2);
  };

  // Step 2: Handle Notification permission
  const handleRequestPush = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotifGranted(true);
        }
      } catch (err) {
        console.warn('Could not request notification permission:', err);
      }
    }
    // Advance to Step 3
    setStep(3);
  };

  // Step 3: Handle 1-Click Install
  const handleInstallClick = async () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(40); } catch (_) {}
    }

    const promptEvent: BeforeInstallPromptEvent | null =
      deferredPrompt || (window as any).deferredInstallPrompt;

    if (promptEvent && typeof promptEvent.prompt === 'function') {
      setIsTriggering(true);
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setJustInstalled(true);
          setIsInstalled(true);
          (window as any).deferredInstallPrompt = null;
          setDeferredPrompt(null);
          setTimeout(() => setShowBanner(false), 4000);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowManualGuide(true);
      } finally {
        setIsTriggering(false);
      }
      return;
    }

    setShowManualGuide(true);
  };

  const handleDismiss = () => {
    localStorage.setItem('android_helper_dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner || (isInstalled && !justInstalled && isConfigured && step === 3)) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-2 sm:p-3 bg-gradient-to-t from-black via-[#071920]/95 to-transparent pointer-events-auto animate-slide-up">
      <div className="max-w-md mx-auto bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] text-white relative flex flex-col gap-3 backdrop-blur-md">
        
        {/* Dismiss / Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 transition"
          title="Schließen"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>

        {justInstalled ? (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Erfolgreich hinzugefügt! Das Icon liegt jetzt auf deinem Startbildschirm.</span>
          </div>
        ) : (
          <>
            {/* Step Indicator Header */}
            <div className="flex items-center justify-between pr-7">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#dfba61]/20 border border-[#dfba61]/40 text-[#f5d77f] text-[10px] font-bold uppercase tracking-wider">
                  Schritt {step} von 3
                </span>
                <span className="text-xs text-white/80 font-medium">
                  {step === 1 && 'Persona wählen'}
                  {step === 2 && 'Push-Nachrichten'}
                  {step === 3 && 'App-Symbol ablegen'}
                </span>
              </div>

              {/* Progress Dots */}
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full transition-all ${step >= 1 ? 'bg-[#dfba61]' : 'bg-white/20'}`} />
                <div className={`w-2 h-2 rounded-full transition-all ${step >= 2 ? 'bg-[#dfba61]' : 'bg-white/20'}`} />
                <div className={`w-2 h-2 rounded-full transition-all ${step >= 3 ? 'bg-[#dfba61]' : 'bg-white/20'}`} />
              </div>
            </div>

            {/* STEP 1: Persona Sonne oder Mond */}
            {step === 1 && (
              <div className="space-y-2.5 animate-fade-in pt-1">
                <p className="text-xs text-white/90">
                  Wer bist du im gemeinsamen Seelenraum?
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('sonne')}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      selectedRole === 'sonne' && isConfigured
                        ? 'bg-[#071920] border-[#dfba61] text-[#dfba61] font-bold shadow-lg'
                        : 'bg-white/5 border-white/15 hover:border-[#dfba61]/60 text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-[#dfba61]" />
                    <span className="text-xs font-semibold">☀️ Sonne</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('mond')}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      selectedRole === 'mond' && isConfigured
                        ? 'bg-[#071920] border-[#f5d77f] text-[#f5d77f] font-bold shadow-lg'
                        : 'bg-white/5 border-white/15 hover:border-[#f5d77f]/60 text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-[#f5d77f]" />
                    <span className="text-xs font-semibold">🌙 Mond</span>
                  </button>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-[#f5d77f] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Weiter zu Schritt 2</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Push-Nachrichten (ohne Erklärtext) */}
            {step === 2 && (
              <div className="space-y-2.5 animate-fade-in pt-1">
                <button
                  type="button"
                  onClick={handleRequestPush}
                  className="w-full py-3 px-4 rounded-xl gold-gradient-btn font-bold text-xs sm:text-sm tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4 text-[#c79b78] fill-[#c79b78] shrink-0" />
                  <span className="gold-gradient-text">
                    {notifGranted ? '✓ Push-Nachrichten zugelassen' : 'Push-Nachrichten zulassen'}
                  </span>
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-white/60 hover:text-white"
                  >
                    Zurück
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-[#f5d77f] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Weiter zu Schritt 3</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: App symbol auf Desktop legen */}
            {step === 3 && (
              <div className="space-y-2.5 animate-fade-in">
                {/* Title & Subtitle with selected golden app icon preview */}
                <div className="flex items-center gap-3 pr-2">
                  {/* Selected Golden Sonne & Mond Icon Preview */}
                  <div className="w-12 h-12 rounded-xl bg-[#071920] border-2 border-[#dfba61] shadow-xl overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                    <img
                      src="/app-icon-selected.jpg"
                      alt="Golden Sonne & Mond App Icon"
                      className="w-full h-full object-cover rounded-lg select-none"
                    />
                  </div>

                  <div>
                    <span className="font-serif-serif font-bold text-xs sm:text-sm text-[#f5d77f] block leading-tight">
                      1-Klick: App auf deinen Android-Bildschirm legen
                    </span>
                    <span className="text-[11px] text-white/70 leading-tight block mt-0.5">
                      Ein Klick lädt euer goldenes Sonne & Mond Icon direkt auf dein Handy!
                    </span>
                  </div>
                </div>

                {/* 1-Click Install Button */}
                <button
                  onClick={handleInstallClick}
                  disabled={isTriggering}
                  className="w-full py-3 px-4 rounded-xl gold-gradient-btn font-bold text-xs sm:text-sm tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  <Download className="w-4 h-4 text-[#c79b78] shrink-0" />
                  <span className="gold-gradient-text">{isTriggering ? 'Wird geöffnet...' : 'JETZT AUF DEN STARTBILDSCHIRM LEGEN'}</span>
                </button>

                {showManualGuide && (
                  <div className="p-2 rounded-xl bg-[#dfba61]/15 border border-[#dfba61]/40 text-[#f5d77f] text-[11px] leading-snug flex items-start gap-1.5 animate-fade-in">
                    <span className="text-xs shrink-0">👉</span>
                    <span>
                      {isInAppBrowser
                        ? 'In WhatsApp/Nachricht geöffnet: Tippe oben rechts auf die drei Punkte (⋮) ➔ „In Chrome öffnen“, damit das Icon direkt abgelegt werden kann.'
                        : 'Tippe oben rechts in Chrome auf die 3 Punkte (⋮) ➔ „App installieren“ oder „Zum Startbildschirm hinzufügen“.'}
                    </span>
                  </div>
                )}

                <p className="text-[10px] text-white/60 text-center italic">
                  Oder oben rechts im Chrome-Menü (⋮) auf „App installieren“ tippen.
                </p>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-white/60 hover:text-white"
                  >
                    Zurück
                  </button>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-[#f5d77f] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#dfba61]" />
                    <span>Fertig</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
