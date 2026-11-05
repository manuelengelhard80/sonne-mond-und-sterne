import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, HelpCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const AndroidBottomHelperBar: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showManualHint, setShowManualHint] = useState<boolean>(false);
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

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const handleOpenBarEvent = () => {
      setShowBanner(true);
      setShowManualHint(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('open-install-pwa', handleOpenBarEvent);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-install-pwa', handleOpenBarEvent);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setJustInstalled(true);
          setIsInstalled(true);
          setDeferredPrompt(null);
          setTimeout(() => {
            setShowBanner(false);
          }, 4000);
        }
      } catch (err) {
        setShowManualHint(true);
      }
    } else {
      // Browser hasn't exposed beforeinstallprompt yet or user is on Firefox/Samsung browser
      setShowManualHint(true);
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
              className="w-full py-3 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs sm:text-sm tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-[#0a232c]" />
              <span>JETZT AUF DEN STARTBILDSCHIRM LEGEN</span>
            </button>

            {/* Helper Hint */}
            {showManualHint ? (
              <div className="p-2.5 rounded-xl bg-[#dfba61]/20 border border-[#dfba61]/50 text-[#f5d77f] text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>So klappt es sofort:</span>
                </div>
                <p className="text-[11px] text-white/90 leading-relaxed">
                  Tippe oben rechts in Chrome auf die <strong className="text-white">drei Punkte (⋮)</strong> und wähle <strong className="text-[#f5d77f]">„App installieren“</strong> oder <strong className="text-[#f5d77f]">„Zum Startbildschirm hinzufügen“</strong>.
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-white/60 text-center italic">
                Oder oben rechts im Chrome-Menü (⋮) auf „App installieren“ tippen.
              </p>
            )}
          </>
        )}

      </div>
    </div>
  );
};
