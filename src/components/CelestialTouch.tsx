import React, { useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { db, ensureAuthenticated } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { sendAppNotification } from '../services/notificationService';
import { soundSynth } from '../services/soundSynth';

// SVG-rendered Moon in bright Gold 1 with filigree, clearly defined watercolor-inspired crater patterns
const MoonSphere: React.FC = () => (
  <div className="relative flex items-center justify-center">
    {/* Background Soft Glow Aura matching Sun's scope and intensity in Moon's gold */}
    <div className="absolute -inset-4 sm:-inset-5 w-24 h-24 sm:w-28 sm:h-28 pointer-events-none flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#fffdf5]/35 via-[#f5d77f]/45 to-[#dfba61]/30 blur-xl opacity-80 animate-pulse-slow" />
    </div>

    {/* Moon Sphere Disc */}
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#fffdf5] via-[#f7ebd0] to-[#dfba61] shadow-[0_0_30px_rgba(245,215,127,0.85)] border-2 border-[#fff7e6] overflow-hidden flex items-center justify-center transform group-hover:scale-110 transition-transform">
      {/* Filigree Watercolor Lunar Geography & Distinct Fine Craters */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="mariaGrad1" cx="35%" cy="30%" r="25%">
            <stop offset="0%" stopColor="#a38032" stopOpacity="0.32" />
            <stop offset="70%" stopColor="#bfa052" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f7ebd0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="mariaGrad2" cx="65%" cy="50%" r="30%">
            <stop offset="0%" stopColor="#a38032" stopOpacity="0.28" />
            <stop offset="80%" stopColor="#c5a85c" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#f7ebd0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="mariaGrad3" cx="30%" cy="70%" r="22%">
            <stop offset="0%" stopColor="#967326" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#f7ebd0" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="36" cy="32" r="18" fill="url(#mariaGrad1)" />
        <circle cx="64" cy="52" r="22" fill="url(#mariaGrad2)" />
        <circle cx="32" cy="68" r="14" fill="url(#mariaGrad3)" />
        <circle cx="58" cy="28" r="12" fill="url(#mariaGrad1)" />

        <path d="M 20,35 C 28,25 45,28 52,38 C 42,48 26,45 20,35 Z" fill="none" stroke="#8a671e" strokeWidth="0.45" opacity="0.4" />
        <path d="M 50,42 C 65,36 78,48 72,64 C 58,68 52,56 50,42 Z" fill="none" stroke="#8a671e" strokeWidth="0.45" opacity="0.35" />
        <path d="M 18,58 C 26,62 34,75 26,82 C 16,80 14,68 18,58 Z" fill="none" stroke="#8a671e" strokeWidth="0.45" opacity="0.35" />

        <g opacity="0.85">
          <line x1="68" y1="72" x2="32" y2="42" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" strokeDasharray="1.5,1" />
          <line x1="68" y1="72" x2="88" y2="88" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" strokeDasharray="1.5,1" />
          <line x1="68" y1="72" x2="92" y2="58" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" strokeDasharray="1.5,1" />
          <line x1="68" y1="72" x2="48" y2="88" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" strokeDasharray="1.5,1" />
          <line x1="68" y1="72" x2="78" y2="38" stroke="#ffffff" strokeWidth="0.4" opacity="0.5" strokeDasharray="1.5,1" />
          
          <circle cx="68" cy="72" r="5.5" fill="#a38032" opacity="0.32" stroke="#7a5a14" strokeWidth="0.5" />
          <circle cx="68" cy="72" r="3.2" fill="none" stroke="#66490c" strokeWidth="0.45" opacity="0.8" />
          <circle cx="68" cy="72" r="1.3" fill="#fffdf5" opacity="0.95" />
        </g>

        <g opacity="0.85">
          <circle cx="38" cy="38" r="4.5" fill="#a38032" opacity="0.3" stroke="#7a5a14" strokeWidth="0.5" />
          <circle cx="38" cy="38" r="2.8" fill="none" stroke="#66490c" strokeWidth="0.4" opacity="0.75" />
          <circle cx="38" cy="38" r="1.1" fill="#fffdf5" opacity="0.9" />
        </g>

        <g opacity="0.8">
          <circle cx="26" cy="46" r="3.2" fill="#a38032" opacity="0.28" stroke="#7a5a14" strokeWidth="0.4" />
          <circle cx="26" cy="46" r="1.8" fill="none" stroke="#66490c" strokeWidth="0.35" opacity="0.7" />
          <circle cx="26" cy="46" r="0.9" fill="#fffdf5" opacity="0.9" />
        </g>

        <g opacity="0.85">
          <circle cx="24" cy="32" r="2.5" stroke="#7a5a14" strokeWidth="0.45" fill="#fffdf5" opacity="0.85" />
          <circle cx="24" cy="32" r="1" fill="#66490c" opacity="0.6" />
        </g>

        <circle cx="52" cy="20" r="2" stroke="#7a5a14" strokeWidth="0.4" fill="#a38032" fillOpacity="0.2" opacity="0.6" />
        <circle cx="76" cy="30" r="2.2" stroke="#7a5a14" strokeWidth="0.4" fill="#a38032" fillOpacity="0.2" opacity="0.6" />
        <circle cx="82" cy="46" r="1.8" stroke="#7a5a14" strokeWidth="0.35" fill="#a38032" fillOpacity="0.18" opacity="0.6" />
        <circle cx="48" cy="82" r="2.4" stroke="#7a5a14" strokeWidth="0.4" fill="#a38032" fillOpacity="0.22" opacity="0.6" />
        <circle cx="58" cy="62" r="1.6" stroke="#7a5a14" strokeWidth="0.35" fill="none" opacity="0.55" />
        <circle cx="34" cy="80" r="2" stroke="#7a5a14" strokeWidth="0.35" fill="none" opacity="0.55" />
        <circle cx="44" cy="26" r="1.5" stroke="#7a5a14" strokeWidth="0.3" fill="none" opacity="0.5" />
        <circle cx="72" cy="42" r="1.4" stroke="#7a5a14" strokeWidth="0.3" fill="none" opacity="0.5" />
      </svg>

      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#dfba61]/20 via-transparent to-white/50 pointer-events-none" />
    </div>
  </div>
);

// SVG-rendered Sun in smooth Gelbgold with subtle solar surface texture & background glow halo
const SunSphere: React.FC = () => (
  <div className="relative flex items-center justify-center isolate" style={{ isolation: 'isolate' }}>
    <div className="absolute -inset-4 sm:-inset-5 w-24 h-24 sm:w-28 sm:h-28 pointer-events-none flex items-center justify-center" style={{ isolation: 'isolate' }}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#fffbbf]/35 via-[#facc15]/45 to-[#ea580c]/30 blur-xl opacity-80 animate-pulse-slow" style={{ mixBlendMode: 'normal' }} />
      
      <svg className="w-full h-full animate-spin-slow opacity-35 filter blur-[3px]" style={{ mixBlendMode: 'normal', isolation: 'isolate' }} viewBox="0 0 100 100">
        <defs>
          <radialGradient id="sunRayGrad" cx="50%" cy="50%" r="50%">
            <stop offset="35%" stopColor="#fef08a" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#facc15" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g fill="url(#sunRayGrad)" style={{ mixBlendMode: 'normal' }}>
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 360) / 16;
            const rad1 = ((angle - 5.5) * Math.PI) / 180;
            const rad2 = ((angle + 5.5) * Math.PI) / 180;
            const x1 = 50 + 48 * Math.cos(rad1);
            const y1 = 50 + 48 * Math.sin(rad1);
            const x2 = 50 + 48 * Math.cos(rad2);
            const y2 = 50 + 48 * Math.sin(rad2);
            return (
              <path
                key={i}
                d={`M 50 50 L ${x1} ${y1} A 48 48 0 0 1 ${x2} ${y2} Z`}
                opacity="0.3"
              />
            );
          })}
        </g>
      </svg>
    </div>

    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#fffbbf] via-[#facc15] to-[#ea580c] shadow-[0_0_30px_rgba(250,204,21,0.85)] border-2 border-[#fffbbf] overflow-hidden flex items-center justify-center transform group-hover:scale-110 transition-transform">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="sunPlasma1" cx="38%" cy="32%" r="35%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="65%" stopColor="#fef08a" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sunPlasma2" cx="68%" cy="65%" r="32%">
            <stop offset="0%" stopColor="#b45309" stopOpacity="0.16" />
            <stop offset="70%" stopColor="#ea580c" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="38" cy="32" r="24" fill="url(#sunPlasma1)" />
        <circle cx="68" cy="65" r="22" fill="url(#sunPlasma2)" />
        
        <path d="M 22 42 C 34 32, 54 36, 66 28 C 76 38, 62 52, 46 54 Z" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.22" />
        <path d="M 28 62 C 44 54, 58 66, 74 60 C 64 74, 38 72, 28 62 Z" fill="none" stroke="#d97706" strokeWidth="0.5" opacity="0.18" />
        <path d="M 18 52 C 28 44, 48 50, 68 40" fill="none" stroke="#fffbbf" strokeWidth="0.4" opacity="0.25" strokeDasharray="3 2" />
        <path d="M 32 30 C 48 24, 68 34, 78 44" fill="none" stroke="#ea580c" strokeWidth="0.4" opacity="0.16" strokeDasharray="2 2" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-tr from-[#ea580c]/25 via-transparent to-[#ffffff]/70 pointer-events-none" />
      <div className="absolute inset-0 rounded-full border border-white/50 pointer-events-none" />
    </div>
  </div>
);

export const CelestialTouch: React.FC = () => {
  const { role, displayName } = useUserRole();
  const [touchVal, setTouchVal] = useState<number>(0); // start at far left
  const [touchNotice, setTouchNotice] = useState<string | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  const triggerCelestialEncounter = async (currentVal: number) => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    soundSynth.playSoftBell();

    const partnerLabel = role === 'sonne' ? 'Der Mond' : 'Die Sonne';
    const myRoleTitle = role === 'sonne' ? 'Sonne' : 'Mond';

    setTouchNotice(`✨ Sanfte Berührung gesendet! ${partnerLabel} erhält eine Benachrichtigung.`);

    try {
      const user = await ensureAuthenticated();
      const touchId = `touch-${Date.now()}`;
      await setDoc(doc(db, 'celestial_touches', touchId), {
        id: touchId,
        authorRole: role,
        authorName: displayName,
        authorUid: user?.uid || 'local-user',
        createdAt: new Date().toISOString(),
        touchVal: currentVal,
      });
    } catch (err) {
      console.warn('Could not save celestial touch to Firestore:', err);
    }

    setTimeout(() => {
      setTouchNotice(null);
    }, 6000);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setTouchVal(val);

    if (val >= 85) {
      triggerCelestialEncounter(val);
    } else if (val < 65) {
      hasTriggeredRef.current = false;
    }
  };

  const isEclipse = touchVal >= 85;
  const encounterProgress = touchVal / 100;

  const sunPos = 15 + (touchVal / 100) * 35;
  const moonPos = 85 - (touchVal / 100) * 35;

  return (
    <div className="relative w-full rounded-2xl p-6 sm:p-8 overflow-hidden bg-gradient-to-b from-[#071920] via-[#0a232c] to-[#0f3844] border-2 border-[#dfba61]/60 shadow-2xl transition-all duration-700">
      
      {/* Dynamic Atmosphere Background Gradient Overlay */}
      <div 
        className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${sunPos}% 50%, rgba(2, 132, 199, ${0.35 * (1 - encounterProgress)}), transparent 60%),
                       radial-gradient(circle at ${moonPos}% 50%, rgba(15, 23, 42, ${0.6 * (1 - encounterProgress)}), transparent 60%),
                       radial-gradient(circle at 50% 50%, rgba(194, 65, 12, ${0.45 * encounterProgress}), transparent 75%)`
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        
        <div className="flex items-center gap-2 text-[#f5d77f] text-xs uppercase tracking-widest font-semibold">
          <Sparkles className="w-4 h-4 text-[#dfba61]" />
          <span>Interaktive Himmelsbegegnung</span>
          <Sparkles className="w-4 h-4 text-[#dfba61]" />
        </div>

        {/* Orbit Visualization Arena with Dynamic Slider Sky Gradient */}
        <div className="relative w-full h-44 sm:h-52 rounded-xl border border-[#dfba61]/40 flex items-center justify-center overflow-hidden backdrop-blur-md shadow-inner transition-all duration-500">
          
          {/* Layer 1: Day Sky to Night Sky Gradient */}
          <div 
            className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
            style={{ opacity: 1 - Math.pow(encounterProgress, 1.2) }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#1181b6] via-[#1b578c] via-30% via-[#132a53] via-50% via-[#020617] via-70% to-[#000000]" />
            <div className="absolute top-0 left-0 w-2/5 h-full bg-gradient-to-r from-[#fffbbf]/35 via-[#fef08a]/15 to-transparent blur-md" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#000000] via-[#020617]/95 to-transparent" />
          </div>

          {/* Layer 2: Sunset & Evening Sky Gradient */}
          <div 
            className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
            style={{ opacity: Math.pow(encounterProgress, 1.1) }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#f97316] via-[#e040fb] via-40% via-[#673ab7] via-70% to-[#0f172a]" />
            <div className="absolute bottom-0 inset-x-0 h-3/5 bg-gradient-to-t from-[#fb923c]/60 via-[#ec4899]/30 to-transparent blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#f43f5e]/30 via-[#a855f7]/20 to-[#3b0764]/40" />
          </div>
          
          {/* Touch Luminous Summed Halo effect when overlapping */}
          {isEclipse && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-r from-[#fffdf5]/50 via-[#facc15]/70 to-[#ea580c]/60 blur-xl opacity-90 animate-pulse-slow pointer-events-none" />
          )}

          {/* Golden Orbit Ring */}
          <div className="absolute w-[80%] h-1 border-t border-dashed border-[#dfba61]/50 top-1/2 -translate-y-1/2 z-0" />

          {/* Sun Element */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 flex flex-col items-center group cursor-pointer z-10"
            style={{ left: `${sunPos}%` }}
          >
            <SunSphere />
            <span 
              className={`absolute top-full mt-2 text-[12px] font-semibold text-sun-gold drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] whitespace-nowrap transition-opacity duration-300 ${
                isEclipse ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ color: '#f5d77f' }}
            >
              Sonne
            </span>
          </div>

          {/* Moon Element */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 flex flex-col items-center group cursor-pointer z-10"
            style={{ left: `${moonPos}%` }}
          >
            <MoonSphere />
            <span 
              className={`absolute top-full mt-2 text-[12px] font-semibold text-moon-cream drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] whitespace-nowrap transition-opacity duration-300 ${
                isEclipse ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ color: '#f8edd6' }}
            >
              Mond
            </span>
          </div>

          {/* Label under merged Sun & Moon when overlapping */}
          <div 
            className={`absolute top-[calc(50%+44px)] left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-opacity duration-300 ${
              isEclipse ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="text-[13px] font-semibold text-[#f5d77f] drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] tracking-wide whitespace-nowrap">
              Sonne & Mond
            </span>
          </div>
        </div>

        {/* Interactive Slider Control */}
        <div className="w-full max-w-md space-y-2">
          <div className="flex justify-between text-xs text-white/90 font-medium px-1">
            <span>Bahnen ziehen</span>
            <span className="text-[#f5d77f] font-semibold">
              {touchVal < 40 ? 'Sonne & Mond auf ihren Bahnen' : touchVal < 85 ? 'Sie nähern sich sanft...' : 'Sanfte Berührung ✨'}
            </span>
            <span>Berührung</span>
          </div>
          
          <input
            type="range"
            min="0"
            max="100"
            value={touchVal}
            onChange={handleSliderChange}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#f5d77f] focus:outline-none"
          />
        </div>

        {/* Touch Notice Alert */}
        {touchNotice && (
          <div className="p-3.5 rounded-xl bg-[#dfba61]/20 border border-[#f5d77f] text-[#f5d77f] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 animate-fade-in shadow-lg">
            <Sparkles className="w-4 h-4 text-[#dfba61] animate-spin-slow" />
            <span>{touchNotice}</span>
          </div>
        )}

        {/* Dynamic Poem Line Reveal */}
        <div className={`transition-all duration-500 p-4 rounded-xl border ${
          isEclipse ? 'bg-[#dfba61]/20 border-[#f5d77f] text-white shadow-xl' : 'bg-black/20 border-white/10 text-white/80'
        }`}>
          <p className="font-serif-serif text-base sm:text-lg italic leading-relaxed">
            "Und in den Momenten, in denen Tag und Nacht sich sanft berühren, begegnen sie sich in wahrhaftiger Liebe."
          </p>
        </div>

      </div>
    </div>
  );
};
