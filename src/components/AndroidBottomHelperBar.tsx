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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (already installed on homescreen)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isDismissed = localStorage.getItem('android_helper_dismissed') === 'true';

    // Show for Android/desktop Chrome if not dismissed
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
    };

    const handlePromptReady = (e: any) => {
      if (e.detail) {
        setDeferredPrompt(e.detail);
      } else if ((window as any).deferredInstallPrompt) {
        setDeferredPrompt((window as any).deferredInstallPrompt);
      }
      setShowBanner(true);
    };

    const handleOpenBarEvent = () => {
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setJustInstalled(true);
      (window as any).deferredInstallPrompt = null;
      setDeferredPrompt(null);
      setTimeout(() => setShowBanner(false), 3500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('deferred-prompt-ready', handlePromptReady);
    window.addEventListener('open-install-pwa', handleOpenBarEvent);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('deferred-prompt-ready', handlePromptReady);
      window.removeEventListener('open-install-pwa', handleOpenBarEvent);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredInstallPrompt;
    if (promptEvent) {
      setIsTriggering(true);
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setJustInstalled(true);
          setIsInstalled(true);
          (window as any).deferredInstallPrompt = null;
          setDeferredPrompt(null);
          setTimeout(() => {
            setShowBanner(false);
          }, 3500);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        setIsTriggering(false);
      }
    } else {
      // If promptEvent is not ready yet, poll for it up to 1.5 seconds
      setIsTriggering(true);
      let attempts = 0;
      const checkInterval = setInterval(async () => {
        attempts++;
        const readyPrompt = (window as any).deferredInstallPrompt;
        if (readyPrompt) {
          clearInterval(checkInterval);
          setIsTriggering(false);
          try {
            await readyPrompt.prompt();
            const { outcome } = await readyPrompt.userChoice;
            if (outcome === 'accepted') {
              setJustInstalled(true);
              setIsInstalled(true);
              (window as any).deferredInstallPrompt = null;
              setDeferredPrompt(null);
              setTimeout(() => setShowBanner(false), 3500);
            }
          } catch (e) {
            console.warn(e);
          }
        } else if (attempts >= 8) {
          clearInterval(checkInterval);
          setIsTriggering(false);
        }
      }, 200);
    }
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

            <p className="text-[10px] text-white/60 text-center italic">
              Oder oben rechts im Chrome-Menü (⋮) auf „App installieren“ tippen.
            </p>
          </>
        )}

      </div>
    </div>
  );
};
