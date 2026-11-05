import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, PlusSquare, Check, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
        setDeferredPrompt(null);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0a232c] border-2 border-[#dfba61] rounded-3xl p-6 shadow-2xl text-white space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto relative">
            <img
              src="/pwa-icon-512.png"
              alt="Sonne & Mond"
              className="w-20 h-20 rounded-2xl border-2 border-[#dfba61] shadow-xl object-cover"
            />
          </div>
          <h3 className="font-serif-serif text-2xl font-bold gold-gradient-text">
            App-Icon auf den Startbildschirm legen
          </h3>
          <p className="text-xs text-white/80 leading-relaxed">
            Füge <strong className="text-[#f5d77f]">Sonne & Mond</strong> direkt zu deinem Smartphone-Startbildschirm hinzu.
          </p>
        </div>

        {/* Action Area */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          
          {isInstalled ? (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Die App befindet sich bereits auf deinem Startbildschirm!</span>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-2">
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs sm:text-sm tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#0a232c]" />
                <span>JETZT AUF DEN STARTBILDSCHIRM LEGEN</span>
              </button>
              <p className="text-[11px] text-white/60 text-center">
                Ein Klick öffnet das native Android-Installationsfenster.
              </p>
            </div>
          ) : isIOS ? (
            <div className="space-y-2.5 text-xs text-white/80">
              <div className="font-bold text-[#f5d77f] flex items-center gap-1.5 text-xs">
                <Smartphone className="w-4 h-4 text-[#dfba61]" />
                <span>So geht's auf dem iPhone (Safari):</span>
              </div>
              <ol className="space-y-2 text-[11px] leading-relaxed pl-1">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#dfba61]/20 text-[#f5d77f] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tippe unten auf das <strong className="text-white">Teilen-Symbol</strong> (<Share className="w-3.5 h-3.5 inline text-[#dfba61]" /> Viereck mit Pfeil).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#dfba61]/20 text-[#f5d77f] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Wähle <strong className="text-[#f5d77f]">„Zum Home-Bildschirm“</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-[#dfba61]" />).
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-white/80">
              <div className="font-bold text-[#f5d77f] flex items-center gap-1.5 text-xs">
                <Smartphone className="w-4 h-4 text-[#dfba61]" />
                <span>Anleitung für deinen Browser (Chrome / Edge / Firefox):</span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Tippe oben rechts auf die <strong className="text-white">drei Punkte (⋮)</strong> und wähle <strong className="text-[#f5d77f]">„App installieren“</strong> oder <strong className="text-[#f5d77f]">„Zum Startbildschirm hinzufügen“</strong>.
              </p>
            </div>
          )}

        </div>

        {/* Bottom Close */}
        <div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-semibold transition"
          >
            Fertig
          </button>
        </div>

      </div>
    </div>
  );
};
