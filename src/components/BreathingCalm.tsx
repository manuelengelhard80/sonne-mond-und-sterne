import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Heart, Volume2 } from 'lucide-react';
import { soundSynth } from '../services/soundSynth';

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale';

export const BreathingCalm: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [timer, setTimer] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

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
    <div className="w-full max-w-2xl mx-auto space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
      
      <div className="text-center space-y-2">
        <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
          Innehalten
        </h2>
        <p className="text-sm text-white/80 max-w-md mx-auto">
          "Kein Ort für Pflichten, keine Aufgabenliste, kein Müssen. Nimm dir diesen Augenblick nur für dich."
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
      <div className="text-center pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/60">
        <Volume2 className="w-3.5 h-3.5 text-[#dfba61]" />
        <span>Tipp: Wähle in der Navigationsleiste oben deine liebste Klangwelt für Hintergrundmusik.</span>
      </div>

    </div>
  );
};
