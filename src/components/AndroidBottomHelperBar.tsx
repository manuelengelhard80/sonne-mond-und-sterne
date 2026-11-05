import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Sparkles, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const AndroidBottomHelperBar: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if Android device or Chrome/Firefox/Samsung Internet
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isDismissed = localStorage.getItem('android_helper_dismissed') === 'true';

    // If NOT iOS (i.e. Android or Desktop Chrome) and not dismissed
    if (!isIOSDevice && !isDismissed) {
      setShowBanner(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowBanner(false);
        setDeferredPrompt(null);
      }
    } else {
      // Fallback: trigger browser install prompt or open settings modal
      const installBtn = document.querySelector("button[aria-label='App-Icon']");
      if (installBtn) {
        (installBtn as HTMLButtonElement).click();
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('android_helper_dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 bg-gradient-to-t from-black via-[#071920] to-transparent pointer-events-auto animate-slide-up">
      <div className="max-w-md mx-auto bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl p-4 shadow-[0_-8px_25px_rgba(0,0,0,0.85)] text-white relative flex flex-col gap-3">
        
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 transition"
          title="Schließen"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
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

        <p className="text-[10px] text-white/60 text-center italic">
          Oder oben rechts im Chrome-Menü (⋮) auf „App installieren“ tippen.
        </p>

      </div>
    </div>
  );
};
