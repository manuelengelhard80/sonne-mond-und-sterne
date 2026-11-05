import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, ArrowDown, X, Sparkles } from 'lucide-react';

export const IosBottomHelperBar: React.FC = () => {
  const [showHelper, setShowHelper] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running on iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);

    // Check if running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    // Check if dismissed previously
    const isDismissed = localStorage.getItem('ios_helper_dismissed') === 'true';

    if (isIOSDevice && !isStandalone && !isDismissed) {
      setShowHelper(true);
    }
  }, []);

  if (!showHelper) return null;

  const handleDismiss = () => {
    localStorage.setItem('ios_helper_dismissed', 'true');
    setShowHelper(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 bg-gradient-to-t from-black via-[#071920] to-transparent pointer-events-auto animate-slide-up">
      <div className="max-w-md mx-auto bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl p-3.5 shadow-[0_-8px_25px_rgba(0,0,0,0.8)] text-white relative flex flex-col gap-2">
        
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 transition"
          title="Schließen"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 pr-6">
          <div className="w-7 h-7 rounded-full bg-[#dfba61]/20 border border-[#dfba61]/50 flex items-center justify-center text-[#dfba61] shrink-0">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          </div>
          <span className="font-serif-serif font-bold text-xs sm:text-sm text-[#f5d77f]">
            App-Icon auf den iPhone-Bildschirm legen:
          </span>
        </div>

        {/* Instructions */}
        <p className="text-xs text-white/90 leading-relaxed pl-1">
          Tippe <strong className="text-[#f5d77f]">direkt unten</strong> in der Safari-Leiste auf das <strong className="text-white">Teilen-Symbol</strong> (<Share className="w-3.5 h-3.5 inline text-[#dfba61]" />) und wähle <strong className="text-[#f5d77f]">„Zum Home-Bildschirm“</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-[#dfba61]" />).
        </p>

        {/* Bouncing Pointer Arrow towards Safari Share Button at bottom center */}
        <div className="flex justify-center items-center pt-0.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dfba61]/20 border border-[#dfba61]/50 text-[#f5d77f] text-[11px] font-bold animate-bounce">
            <span>Hier unten tippen</span>
            <ArrowDown className="w-4 h-4 text-[#f5d77f]" />
          </div>
        </div>

      </div>
    </div>
  );
};
