import React, { useState, useEffect } from 'react';
import { Download, X, Check, Sun, Moon, Bell, Sparkles, ChevronRight } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { UserRoleType } from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const AndroidBottomHelperBar: React.FC = () => {
  const { role, displayName, setRole, isConfigured } = useUserRole();

  // Current step in the guide (1: Persona, 2: Push, 3: Desktop Icon)
  const [step, setStep] = useState<number>(() => {
    if (!isConfigured) return 1;
    return 3;
  });

  const [selectedRole, setSelectedRole] = useState<UserRoleType>(role || 'sonne');

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
    const inApp = /wv|fbav|instagram|line|micromessenger|whatsapp/.test(ua);
    setIsInAppBrowser(inApp);

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
      localStorage.setItem('onboarding_3steps_done', 'true');
      window.dispatchEvent(new Event('onboarding-completed'));
      setTimeout(() => setShowBanner(false), 3000);
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
    setRole(r, newName);
    // Auto advance to Step 2
    setStep(2);
  };

  // Step 2: Handle Notification permission (without explanation)
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
          localStorage.setItem('onboarding_3steps_done', 'true');
          window.dispatchEvent(new Event('onboarding-completed'));
          setTimeout(() => setShowBanner(false), 3000);
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

  const handleFinishGuide = () => {
    localStorage.setItem('onboarding_3steps_done', 'true');
    window.dispatchEvent(new Event('onboarding-completed'));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="w-full max-w-md mx-auto p-2 sm:p-3 pointer-events-auto animate-fade-in my-4">
      <div className="bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.85)] text-white relative flex flex-col gap-3.5 backdrop-blur-md">
        
        {/* Dismiss / Close Button */}
        {isConfigured && (
          <button
            onClick={handleFinishGuide}
            className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 transition"
            title="Schließen"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Welcoming Message Above 3 Steps */}
        <div className="text-center space-y-1.5 pr-2">
          <div className="inline-flex items-center gap-1.5 text-[#ebd8c8] text-[11px] font-bold uppercase tracking-wider">
            <span className="text-xs">💫</span>
            <span>SoulSpace ONBOARDING</span>
          </div>
          <h2 className="font-serif-serif text-xl sm:text-2xl font-bold gold-gradient-text leading-snug">
            Herzlich Willkommen<br />bei Sonne, Mond und Sterne
          </h2>
        </div>

        {justInstalled ? (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Erfolgreich hinzugefügt! Das Icon liegt jetzt auf deinem Bildschirm.</span>
          </div>
        ) : (
          <>
            {/* Step Indicator Header */}
            <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#dfba61]/20 border border-[#dfba61]/40 text-[#f5d77f] text-[10px] font-bold uppercase tracking-wider">
                  Schritt {step} von 3
                </span>
                <span className="text-xs text-white/90 font-medium">
                  {step === 1 && 'Persona wählen'}
                  {step === 2 && 'Push-Nachrichten'}
                  {step === 3 && 'App-Symbol ablegen'}
                </span>
              </div>

              {/* Green Progress Dots */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full transition-all ${step >= 1 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-white/20'}`} />
                <div className={`w-2.5 h-2.5 rounded-full transition-all ${step >= 2 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-white/20'}`} />
                <div className={`w-2.5 h-2.5 rounded-full transition-all ${step >= 3 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-white/20'}`} />
              </div>
            </div>

            {/* STEP 1: Persona Sonne oder Mond */}
            {step === 1 && (
              <div className="space-y-2.5 animate-fade-in pt-1">
                <p className="text-xs text-white/90 text-center">
                  Wähle deine Persona im gemeinsamen SoulSpace:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('sonne')}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      selectedRole === 'sonne'
                        ? 'bg-[#071920] border-[#c79b78] text-[#ebd8c8] font-bold shadow-lg ring-1 ring-[#c79b78]/50'
                        : 'bg-white/5 border-white/15 hover:border-[#c79b78]/60 text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-[#c79b78]" />
                    <span className="text-xs font-semibold">Sonne (Stefanie)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('mond')}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      selectedRole === 'mond'
                        ? 'bg-[#071920] border-[#c79b78] text-[#ebd8c8] font-bold shadow-lg ring-1 ring-[#c79b78]/50'
                        : 'bg-white/5 border-white/15 hover:border-[#c79b78]/60 text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-[#c79b78]" />
                    <span className="text-xs font-semibold">Mond (Manuel)</span>
                  </button>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-[#ebd8c8] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Weiter zu Schritt 2</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Push-Nachrichten */}
            {step === 2 && (
              <div className="space-y-3 animate-fade-in pt-1">
                <p className="text-[11px] text-white/70 text-center leading-snug">
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
                    className="text-[#ebd8c8] hover:underline flex items-center gap-1 font-semibold"
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
                      1-Klick: App auf deinen Bildschirm legen
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
                  <span className="gold-gradient-text">{isTriggering ? 'Wird geöffnet...' : 'JETZT AUF DEN BILDSCHIRM LEGEN'}</span>
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

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-white/60 hover:text-white"
                  >
                    Zurück
                  </button>

                  <button
                    type="button"
                    onClick={handleFinishGuide}
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
