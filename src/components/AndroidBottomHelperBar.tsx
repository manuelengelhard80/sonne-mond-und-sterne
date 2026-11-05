import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const AndroidBottomHelperBar: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as any).deferredInstallPrompt) {
      return (window as any).deferredInstallPrompt;
    }
    return null;
  });
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [justInstalled, setJustInstalled] = useState<boolean>(false);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isDismissed = localStorage.getItem('android_helper_dismissed') === 'true';

    // Detect if inside an in-app browser like WhatsApp, Instagram, FB, etc.
    const inApp = /wv|fbav|instagram|line|micromessenger|whatsapp/.test(ua);
    setIsInAppBrowser(inApp);

    // Show for Android / desktop Chrome if not dismissed
    if (!isIOSDevice && !isDismissed) {
      setShowBanner(true);
    }

    // Check if already captured in window
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

    const handlePromptReady = (e: any) => {
      const promptObj = e.detail || (window as any).deferredInstallPrompt;
      if (promptObj) {
        setDeferredPrompt(promptObj);
      }
      setShowBanner(true);
      setShowManualGuide(false);
    };

    const handleOpenBarEvent = () => {
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setJustInstalled(true);
      (window as any).deferredInstallPrompt = null;
      setDeferredPrompt(null);
      setTimeout(() => setShowBanner(false), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('deferred-prompt-ready', handlePromptReady);
    window.addEventListener('open-install-pwa', handleOpenBarEvent);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('app-installed-success', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('deferred-prompt-ready', handlePromptReady);
      window.removeEventListener('open-install-pwa', handleOpenBarEvent);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('app-installed-success', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(40); } catch (_) {}
    }

    const promptEvent: BeforeInstallPromptEvent | null =
      deferredPrompt || (window as any).deferredInstallPrompt;

    if (promptEvent && typeof promptEvent.prompt === 'function') {
      setIsTriggering(true);
      try {
        // Direct synchronous trigger within user gesture
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setJustInstalled(true);
          setIsInstalled(true);
          (window as any).deferredInstallPrompt = null;
          setDeferredPrompt(null);
          setTimeout(() => {
            setShowBanner(false);
          }, 4000);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowManualGuide(true);
      } finally {
        setIsTriggering(false);
      }
      return;
    }

    // Check if the app is already installed
    if ('getInstalledRelatedApps' in navigator) {
      try {
        const apps = await (navigator as any).getInstalledRelatedApps();
        if (apps && apps.length > 0) {
          setIsInstalled(true);
          setJustInstalled(true);
          setTimeout(() => setShowBanner(false), 4000);
          return;
        }
      } catch (_) {}
    }

    // If deferred prompt hasn't arrived yet, show manual guide indicator
    setShowManualGuide(true);
  };

  const handleDismiss = () => {
    localStorage.setItem('android_helper_dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner || (isInstalled && !justInstalled)) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 bg-gradient-to-t from-black via-[#071920] to-transparent pointer-events-auto animate-slide-up">
      <div className="max-w-md mx-auto bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl p-4 shadow-[0_-8px_25px_rgba(0,0,0,0.85)] text-white relative flex flex-col gap-3">
        
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 transition"
          title="Schließen"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>

        {justInstalled ? (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm text-center font-medium flex items-center justify-center gap-2">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Erfolgreich hinzugefügt! Das Icon liegt jetzt auf deinem Startbildschirm.</span>
          </div>
        ) : (
          <>
            {/* Title & Subtitle */}
            <div className="flex items-center gap-2.5 pr-6">
              <div className="w-8 h-8 rounded-full bg-[#dfba61]/20 border border-[#dfba61]/50 flex items-center justify-center text-[#dfba61] shrink-0">
                <Smartphone className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="font-serif-serif font-bold text-xs sm:text-sm text-[#f5d77f] block">
                  1-Klick: App auf deinen Android-Bildschirm legen
                </span>
                <span className="text-[11px] text-white/70">
                  Ein Klick lädt euer goldenes Sonne & Mond Icon direkt auf dein Handy!
                </span>
              </div>
            </div>

            {/* 1-Click Install Button */}
            <button
              onClick={handleInstallClick}
              disabled={isTriggering}
              className="w-full py-3 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs sm:text-sm tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-75"
            >
              <Download className="w-4 h-4 text-[#0a232c]" />
              <span>{isTriggering ? 'Wird geöffnet...' : 'JETZT AUF DEN STARTBILDSCHIRM LEGEN'}</span>
            </button>

            {showManualGuide && (
              <div className="p-2.5 rounded-xl bg-[#dfba61]/15 border border-[#dfba61]/40 text-[#f5d77f] text-[11px] leading-snug flex items-start gap-2 animate-fade-in">
                <span className="text-sm shrink-0">👉</span>
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
          </>
        )}

      </div>
    </div>
  );
};
