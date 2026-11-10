import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Heart, Volume2, Hand } from 'lucide-react';
import { soundSynth } from '../services/soundSynth';

// Unified illustration assets for 5-Finger-Reset
import thumbIndexImg from '../assets/images/reset_1_daumen_zeigefinger.png';
import thumbMiddleImg from '../assets/images/reset_2_daumen_mittelfinger.png';
import thumbRingImg from '../assets/images/reset_3_daumen_ringfinger.png';
import thumbPinkyImg from '../assets/images/reset_4_daumen_kleinerfinger.png';

interface ResetStep {
  title: string;
  effect: string;
  instruction: string;
  image: string;
}

const RESET_STEPS: ResetStep[] = [
  {
    title: 'Daumen & Zeigefinger',
    effect: 'Hilft gegen Angst, Grübeln und Nervosität',
    instruction: 'Verbinde Daumen und Zeigefinger.',
    image: thumbIndexImg
  },
  {
    title: 'Daumen & Mittelfinger',
    effect: 'Hilft gegen Wut, Frust und innere Reizbarkeit',
    instruction: 'Verbinde Daumen und Mittelfinger.',
    image: thumbMiddleImg
  },
  {
    title: 'Daumen & Ringfinger',
    effect: 'Hilft bei Erschöpfung, Kummer und für neue Stabilität',
    instruction: 'Verbinde Daumen und Ringfinger.',
    image: thumbRingImg
  },
  {
    title: 'Daumen & kleiner Finger',
    effect: 'Hilft gegen Selbstzweifel und für innere Sicherheit',
    instruction: 'Verbinde Daumen und kleinen Finger.',
    image: thumbPinkyImg
  }
];

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale';

export const BreathingCalm: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [timer, setTimer] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

  // 5-Finger-Reset state
  const [currentResetStep, setCurrentResetStep] = useState<number>(0);

  const handleNextReset = () => {
    if (currentResetStep < RESET_STEPS.length + 1) {
      setCurrentResetStep(prev => prev + 1);
    }
  };

  const handleBackReset = () => {
    setCurrentResetStep(prev => Math.max(0, prev - 1));
  };

  // Phase durations in seconds (4s Inhale, 4s Hold, 6s Exhale)
  const durations = {
    inhale: 4,
    hold: 4,
    exhale: 6,
  };

  useEffect(() => {
    let interval: number | undefined;

    if (isActive) {
      interval = window.setInterval(() => {
        setTimer((prev) => {
          if (prev > 1) {
            return prev - 1;
          } else {
            if (phase === 'idle' || phase === 'exhale') {
              setPhase('inhale');
              soundSynth.playSoftBell();
              return durations.inhale;
            } else if (phase === 'inhale') {
              setPhase('hold');
              return durations.hold;
            } else if (phase === 'hold') {
              setPhase('exhale');
              setCycleCount((c) => c + 1);
              return durations.exhale;
            }
            return 4;
          }
        });
      }, 1000);
    } else {
      setPhase('idle');
      setTimer(4);
    }

    return () => clearInterval(interval);
  }, [isActive, phase]);

  const handleStartStop = () => {
    if (!isActive) {
      setIsActive(true);
      setPhase('inhale');
      setTimer(durations.inhale);
      soundSynth.playSoftBell();
    } else {
      setIsActive(false);
      setPhase('idle');
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('idle');
    setTimer(4);
    setCycleCount(0);
  };

  const phaseText = {
    idle: 'Bereit zum Durchatmen',
    inhale: 'Sanft Einatmen...',
    hold: 'Moment Innehalten...',
    exhale: 'Ruhe Ausatmen...',
  }[phase];

  const phaseInstruction = {
    idle: 'Drücke Start, um eine beruhigende Atemreise zu beginnen.',
    inhale: 'Atme tief und langsam frische Energie ein.',
    hold: 'Spüre die wohlige Ruhe in deinem Herzen.',
    exhale: 'Lass alle Anspannung sanft mit dem Atem verfliegen.',
  }[phase];

  const ringScale = {
    idle: 'scale-100',
    inhale: 'scale-125 duration-[4000ms]',
    hold: 'scale-125 duration-300',
    exhale: 'scale-90 duration-[6000ms]',
  }[phase];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 pb-24">
      {/* 1. Innehalten Atemübung Container */}
      <div className="space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
        
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Innehalten
          </h2>
          <p className="text-sm text-white/80 max-w-md mx-auto">
            Beruhigende Atemreise. Nimm dir diesen Augenblick nur für dich.
          </p>
        </div>

        {/* Breathing Ring Visual Container */}
        <div className="relative py-12 flex flex-col items-center justify-center">
          
          {/* Glowing Ambient Outer Aura */}
          <div className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-[#dfba61]/20 via-[#e6d3a3]/30 to-[#1abc9c]/20 blur-2xl pointer-events-none" />

          {/* Dynamic Breathing Ring */}
          <div
            className={`w-52 h-52 sm:w-60 sm:h-60 rounded-full border-4 border-[#dfba61] bg-gradient-to-br from-[#071920] to-[#0a232c] shadow-2xl flex flex-col items-center justify-center transition-all ease-in-out ${ringScale}`}
          >
            <div className="flex flex-col items-center space-y-2 text-center p-4">
              <Heart className={`w-8 h-8 text-[#e6d3a3] ${phase === 'inhale' ? 'animate-bounce' : ''}`} />
              
              <span className="font-serif-serif text-2xl font-bold gold-gradient-text">
                {phaseText}
              </span>

              {isActive && (
                <span className="text-4xl font-extrabold text-[#e6d3a3] font-mono tracking-wider">
                  {timer}s
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Instruction Box */}
        <div className="bg-[#071920] p-4 sm:p-5 rounded-xl border-l-4 border-[#dfba61] text-center font-serif-serif italic border-y border-r border-[#dfba61]/30">
          <p className="text-[#e6d3a3] text-base sm:text-lg">
            "{phaseInstruction}"
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={handleStartStop}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[#0a232c] shadow-lg transition-all transform hover:scale-105 gold-gradient-btn"
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5 text-[#0a232c]" />
                <span>Pausieren</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 text-[#0a232c]" />
                <span>Atemreise Starten</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="Zurücksetzen"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Cycle Count */}
        {cycleCount > 0 && (
          <div className="text-center text-xs text-[#e6d3a3] font-medium">
            {cycleCount} {cycleCount === 1 ? 'ruhiger Atemzyklus' : 'ruhige Atemzyklen'} vollendet ✨
          </div>
        )}

        {/* Ambient Audio Hint */}
        <div className="pt-2 border-t border-white/10 flex items-start sm:items-center justify-center gap-2 text-xs text-white/60">
          <Volume2 className="w-3.5 h-3.5 text-[#dfba61] shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-left sm:text-center">Tipp: Wähle in der Navigationsleiste oben deine liebste Klangwelt für Hintergrundmusik.</span>
        </div>

      </div>

      {/* 2. 5-Finger-Nervensystem-Reset Container (unterster Container unter Innehalten) */}
      <div className="space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            5-Finger-Nervensystem-Reset
          </h2>
          <p className="text-sm text-white/80 max-w-md mx-auto">
            Eine einfache Anleitung, um dein Nervensystem herunterzufahren.
          </p>
        </div>

        <div className="p-6 sm:p-10 rounded-2xl bg-[#071920] border-2 border-[#dfba61] shadow-xl space-y-8 relative overflow-hidden">
          <div className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-6 relative z-10">
            {currentResetStep === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="p-4 rounded-full bg-[#dfba61]/10 border border-[#dfba61]/30 inline-block">
                  <Hand className="w-10 h-10 text-[#dfba61]" />
                </div>
                <p className="font-serif-serif text-lg sm:text-xl leading-relaxed max-w-lg">
                  Schau dir zuerst die vier Finger-Verbindungen an, bevor du die Übung mit geschlossenen Augen beginnst.
                </p>
                <button
                  onClick={handleNextReset}
                  className="gold-gradient-btn px-8 py-3 rounded-xl text-[#0a232c] font-bold shadow-lg hover:scale-105 transition-all"
                >
                  Anleitung starten
                </button>
              </div>
            )}

            {currentResetStep >= 1 && currentResetStep <= 4 && (
              <div key={currentResetStep} className="w-full space-y-6 animate-in zoom-in-95 duration-500">
                <span className="text-[#dfba61] font-mono text-sm uppercase">Schritt {currentResetStep} von 4</span>
                <h3 className="font-serif-serif text-3xl font-bold">{RESET_STEPS[currentResetStep - 1].title}</h3>
                <div className="flex flex-col md:flex-row gap-8 items-center bg-[#0a232c] p-6 rounded-2xl border border-[#dfba61]/20">
                  <div className="w-full md:w-1/2 aspect-video rounded-xl overflow-hidden border border-[#dfba61]/30 bg-[#0a232c]">
                    <img src={RESET_STEPS[currentResetStep - 1].image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full md:w-1/2 text-left space-y-4">
                    <p className="text-xl font-serif-serif text-[#ebd8c8] italic leading-tight">
                      "{RESET_STEPS[currentResetStep - 1].effect}"
                    </p>
                    <p className="text-lg">
                      <span className="text-[#dfba61] font-bold">Wichtig:</span> Nimm 3 tiefe Atemzüge.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentResetStep === 5 && (
              <div className="space-y-6 animate-in fade-in zoom-in-90 duration-700">
                <h3 className="font-serif-serif text-3xl font-bold gold-gradient-text">Bereit für die Ruhe</h3>
                <p className="text-xl font-serif-serif">Schließe nun deine Augen.</p>
                <p className="text-white/80 max-w-md mx-auto">
                  Gehe alle vier Griffe nacheinander durch und nimm pro Griff 3 tiefe Atemzüge.
                </p>
                <button
                  onClick={() => setCurrentResetStep(0)}
                  className="text-white/40 hover:text-[#dfba61] text-xs transition-colors"
                >
                  Anleitung wiederholen
                </button>
              </div>
            )}
          </div>

          {currentResetStep > 0 && currentResetStep < 5 && (
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
              <button
                onClick={handleBackReset}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-semibold"
              >
                ← Zurück
              </button>
              <button
                onClick={handleNextReset}
                className="w-full sm:w-auto px-10 py-3 rounded-xl gold-gradient-btn text-[#0a232c] font-bold shadow-lg transition"
              >
                {currentResetStep === 4 ? 'Abschluss' : 'Weiter'}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
