import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, PlusSquare, Check, X, Sparkles, Eye, Compass, MessageCircle, Calendar } from 'lucide-react';

import copperSunV1 from '../assets/images/mountain_v5_copper_sun_1_1793916868691.jpg';
import copperSunV2 from '../assets/images/mountain_v5_copper_sun_2_1793916868587.jpg';
import copperSunV3 from '../assets/images/mountain_v5_copper_sun_3_1793916869205.jpg';
import copperSunV4 from '../assets/images/mountain_v5_copper_sun_4_1793916869428.jpg';
import copperSunV5 from '../assets/images/mountain_v5_copper_sun_5_1793916885075.jpg';
import copperSunV6 from '../assets/images/mountain_v5_copper_sun_6_1793916885976.jpg';

import mountainEmbossV1 from '../assets/images/mountain_emboss_v1_bold_top_sun_1793916418831.jpg';
import mountainEmbossV3 from '../assets/images/mountain_emboss_v3_gold_relief_coin_1793916419612.jpg';
import iconBoldEmbrace from '../assets/images/mobile_icon_bold_embrace_1793915567718.jpg';
import iconGoldEmbrace from '../assets/images/icon_variant_gold_embrace_1793913727986.jpg';

export const ICON_VARIANTS = [
  {
    id: 'copper-sun-v3',
    title: '🏆 Gewähltes App-Icon: Kompakte Kupfer-Sonne mit Strahlen',
    subtitle: 'Elegante, verkleinerte Rosé-Kupfer-Sonne – perfekt ausbalanciert über Mond & Bergen!',
    src: copperSunV3,
    selected: true,
  },
  {
    id: 'copper-sun-v1',
    title: '2. Rosé-Kupfer Filigran-Sonne',
    subtitle: 'Kupfer-Sonne verkleinert & farblich exakt an die Mondsichel angepasst',
    src: copperSunV1,
  },
  {
    id: 'copper-sun-v2',
    title: '3. Kupfer-Sonne & Harmonische Proportion',
    subtitle: 'Ausgewogene Proportionen zwischen Sonne, Mond & Bergen',
    src: copperSunV2,
  },
  {
    id: 'copper-sun-v4',
    title: '4. Barocke Kupfer-Sonne mit Ornamenten',
    subtitle: 'Zarte Verzierungen im Rosé-Kupferton der Mondsichel',
    src: copperSunV4,
  },
  {
    id: 'copper-sun-v5',
    title: '5. Filigrane Kupfer-Sonnenmünze',
    subtitle: 'Ausbalancierte Dreieinigkeit von Sonne, Mond und Bergmassiv',
    src: copperSunV5,
  },
  {
    id: 'copper-sun-v6',
    title: '6. Minimalistischer Kupfer-Strahlenkranz',
    subtitle: 'Klassisch-klarer Kupferglanz über den bekannten Bergen',
    src: copperSunV6,
  },
  {
    id: 'mountain-v1',
    title: '7. Gold-Prägung: Sonne oben & Berge unten (Goldscheibe)',
    subtitle: 'Ursprüngliche Variante mit leuchtendem Sonnengold',
    src: mountainEmbossV1,
  },
  {
    id: 'mountain-v3',
    title: '8. Gold-Prägung: 3D Relief-Medaillon',
    subtitle: 'Schweres Relief-Sonnengold mit tiefen Schatten über Bergmassiv',
    src: mountainEmbossV3,
  },
  {
    id: 'mobile-bold-embrace',
    title: '9. Handy-Optimiert: Sonne & Mond (Thick Gold)',
    subtitle: 'Extrastarke Gold-Silhouette',
    src: iconBoldEmbrace,
  },
  {
    id: 'gold-embrace',
    title: '10. Goldene Umarmung (Filigran)',
    subtitle: 'Klassisches Filigran-Gold auf Nachtblau',
    src: iconGoldEmbrace,
  },
];

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
  const [selectedIconId, setSelectedIconId] = useState<string>(() => {
    return localStorage.getItem('selected_app_icon_id') || 'copper-sun-v3';
  });
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

  const handleSelectIcon = (iconId: string, src: string) => {
    setSelectedIconId(iconId);
    localStorage.setItem('selected_app_icon_id', iconId);
    localStorage.setItem('selected_app_icon_src', src);

    let link: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
    if (link) {
      link.href = src;
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  if (!isOpen) return null;

  const currentVariant = ICON_VARIANTS.find((v) => v.id === selectedIconId) || ICON_VARIANTS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0a232c] border-2 border-[#dfba61] rounded-3xl p-5 sm:p-7 shadow-2xl text-white space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#dfba61]/20 border border-[#dfba61]/40 flex items-center justify-center text-[#dfba61]">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-serif-serif text-2xl sm:text-3xl font-bold gold-gradient-text">
            Feinabstimmung: Rosé-Kupfer Sonne & Berge
          </h3>
          <p className="text-xs sm:text-sm text-white/80 max-w-md mx-auto leading-relaxed">
            Berge, Mond & Sterne unverändert beibehalten – <strong className="text-[#f5d77f]">die Sonne verkleinert & farblich exakt an die Kupfer-Mondsichel angepasst</strong>!
          </p>
        </div>

        {/* REALISTIC SMARTPHONE HOME SCREEN MOCKUP PREVIEW */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] border-2 border-[#dfba61] shadow-2xl space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#f5d77f] uppercase tracking-wider">
            <Eye className="w-4 h-4 text-[#dfba61]" />
            <span>1:1 Vorschau auf dem Handy-Bildschirm</span>
          </div>

          {/* Smartphone Screen Icon Row Grid Simulation */}
          <div className="bg-black/60 rounded-2xl p-4 border border-white/10 flex items-center justify-around max-w-sm mx-auto shadow-inner">
            <div className="flex flex-col items-center space-y-1 opacity-50">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center shadow">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] text-white/70">Safari</span>
            </div>

            {/* DEDICATED APP ICON PREVIEW (1:1 Small Mobile Scale) */}
            <div className="flex flex-col items-center space-y-1 transform scale-110">
              <div className="relative group">
                <img
                  src={currentVariant.src}
                  alt={currentVariant.title}
                  className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl border-2 border-[#f5d77f] shadow-[0_0_18px_rgba(245,215,127,0.7)] object-cover ring-2 ring-[#dfba61]/60"
                />
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-[9px] font-bold text-white shadow">
                  ✓
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#f5d77f] tracking-tight">Sonne & Mond</span>
            </div>

            <div className="flex flex-col items-center space-y-1 opacity-50">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] text-white/70">Mitteilungen</span>
            </div>

            <div className="flex flex-col items-center space-y-1 opacity-50">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center shadow">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] text-white/70">Kalender</span>
            </div>
          </div>

          <p className="text-[11px] text-white/70 italic">
            So harmonisch wirkt <strong className="text-[#f5d77f]">{currentVariant.title}</strong> im Kleinformat.
          </p>
        </div>

        {/* Icon Selection Gallery (Grid) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#f5d77f] font-semibold px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#dfba61]" />
              Wähle eine Kupfer-Sonnen-Variante aus:
            </span>
            <span className="text-[10px] text-white/50">10 Motive</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {ICON_VARIANTS.map((v) => {
              const isSelected = v.id === selectedIconId;
              return (
                <button
                  key={v.id}
                  onClick={() => handleSelectIcon(v.id, v.src)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-[#071920] border-2 border-[#dfba61] shadow-lg scale-[1.01]'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                  }`}
                >
                  <img
                    src={v.src}
                    alt={v.title}
                    className="w-14 h-14 rounded-xl border border-white/20 object-cover shrink-0 shadow-md"
                  />
                  <div className="min-w-0 text-xs space-y-0.5">
                    <div className={`font-bold truncate ${isSelected ? 'text-[#f5d77f]' : 'text-white'}`}>
                      {v.title}
                    </div>
                    <div className="text-[10px] text-white/60 line-clamp-2 leading-snug">{v.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Installation Instructions / Action Area */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 text-left">
          
          {isInstalled ? (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Die App befindet sich bereits mit deinem gewählten Motiv auf dem Home-Bildschirm!</span>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-2">
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs sm:text-sm tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#0a232c]" />
                <span>App-Icon jetzt auf den Bildschirm legen</span>
              </button>
              <p className="text-[11px] text-white/60 text-center">
                Ein Klick platziert das gewählte Icon direkt auf deinem Handy-Startbildschirm.
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
                    Tippe unten in der Safari-Leiste auf das <strong className="text-white">Teilen-Symbol</strong> (<Share className="w-3.5 h-3.5 inline text-[#dfba61]" /> Viereck mit Pfeil).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#dfba61]/20 text-[#f5d77f] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scrolle nach unten und wähle <strong className="text-[#f5d77f]">„Zum Home-Bildschirm“</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-[#dfba61]" />).
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-white/80">
              <div className="font-bold text-[#f5d77f] flex items-center gap-1.5 text-xs">
                <Smartphone className="w-4 h-4 text-[#dfba61]" />
                <span>So erstellst du das Icon in deinem Browser (Chrome / Firefox):</span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Tippe oben rechts auf die <strong className="text-white">drei Punkte (Menü)</strong> und wähle <strong className="text-[#f5d77f]">„App installieren“</strong> oder <strong className="text-[#f5d77f]">„Zum Startbildschirm hinzufügen“</strong>.
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
