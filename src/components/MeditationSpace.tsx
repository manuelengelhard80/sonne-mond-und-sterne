import React, { useState } from 'react';
import { Heart, Volume2, ChevronRight, ChevronLeft, Wind, Hand } from 'lucide-react';
import { soundSynth } from '../services/soundSynth';

// Unified illustration assets with consistent line weight and matching background
import thumbIndexImg from '../assets/images/unified_thumb_index_reset_1794045165448.jpg';
import thumbMiddleImg from '../assets/images/unified_thumb_middle_reset_1794045165616.jpg';
import thumbRingImg from '../assets/images/unified_thumb_ring_reset_1794045166035.jpg';
import thumbPinkyImg from '../assets/images/unified_thumb_pinky_reset_1794045166201.jpg';

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

export const MeditationSpace: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0); // 0: Intro, 1-4: Finger Steps, 5: Final Close Eyes

  const handleNext = () => {
    if (currentStep < RESET_STEPS.length + 1) {
      setCurrentStep(prev => prev + 1);
      soundSynth.playSoftBell();
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const resetExercise = () => {
    setCurrentStep(0);
    soundSynth.playSoftBell();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
          5-Finger-Nervensystem-Reset
        </h2>
        <p className="text-sm text-white/80 max-w-md mx-auto">
          Lerne die Griffe kennen, um dein Nervensystem herunterzufahren und Stress abzubauen.
        </p>
      </div>

      {/* Instruction Card */}
      <div className="p-6 sm:p-10 rounded-2xl bg-[#071920] border-2 border-[#dfba61] shadow-xl space-y-8 relative overflow-hidden">
        
        {/* Content Area */}
        <div className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-6 relative z-10">
          
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="p-4 rounded-full bg-[#dfba61]/10 border border-[#dfba61]/30 inline-block">
                <Hand className="w-10 h-10 text-[#dfba61]" />
              </div>
              <p className="font-serif-serif text-lg sm:text-xl leading-relaxed max-w-lg">
                Diese Übung hilft dir, im Sitzen oder Stehen sofort zur Ruhe zu kommen. Schau dir zuerst die vier Finger-Verbindungen an.
              </p>
              <button 
                onClick={handleNext}
                className="gold-gradient-btn px-8 py-3 rounded-xl text-[#0a232c] font-bold shadow-lg hover:scale-105 transition-all"
              >
                Erklärung starten
              </button>
            </div>
          )}

          {currentStep >= 1 && currentStep <= 4 && (
            <div key={currentStep} className="w-full space-y-6 animate-in zoom-in-95 duration-500">
              <div className="space-y-2">
                <span className="text-[#dfba61] font-mono text-sm tracking-widest uppercase">Schritt {currentStep} von 4</span>
                <h3 className="font-serif-serif text-3xl font-bold text-white">
                  {RESET_STEPS[currentStep - 1].title}
                </h3>
              </div>
              
              <div className="flex flex-col md:flex-row gap-8 items-center bg-[#0a232c] p-6 rounded-2xl border border-[#dfba61]/20">
                <div className="w-full md:w-1/2 aspect-video rounded-xl overflow-hidden border border-[#dfba61]/30 shadow-lg bg-[#0a232c]">
                  <img 
                    src={RESET_STEPS[currentStep - 1].image} 
                    alt={RESET_STEPS[currentStep - 1].title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-full md:w-1/2 text-left space-y-4">
                  <p className="text-xl font-serif-serif text-[#ebd8c8] italic leading-tight">
                    "{RESET_STEPS[currentStep - 1].effect}"
                  </p>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="mt-1 p-1 rounded-full bg-[#dfba61]/20">
                      <Wind className="w-4 h-4 text-[#dfba61]" />
                    </div>
                    <p className="text-lg">
                      <span className="text-[#dfba61] font-bold">Wichtig:</span> Nimm bei diesem Griff <span className="font-bold">3 tiefe Atemzüge</span> (ein- und ausatmen).
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-white/60 text-sm">
                Griff: {RESET_STEPS[currentStep - 1].instruction}
              </p>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-8 animate-in fade-in zoom-in-90 duration-700">
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  <Hand className="w-10 h-10 text-[#dfba61] animate-pulse" />
                </div>
                <h3 className="font-serif-serif text-3xl font-bold gold-gradient-text">
                  Jetzt bist du bereit
                </h3>
              </div>

              <div className="space-y-4 max-w-lg mx-auto bg-[#0a232c] p-6 rounded-2xl border border-[#dfba61]/30">
                <p className="text-xl font-serif-serif leading-relaxed">
                  <strong className="text-[#dfba61]">Schließe nun deine Augen.</strong>
                </p>
                <div className="flex items-start gap-3 text-left">
                  <div className="mt-1 p-1 rounded-full bg-[#dfba61]/20 shrink-0">
                    <Wind className="w-4 h-4 text-[#dfba61]" />
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    Verbinde nacheinander deinen Daumen mit den Fingern und nimm <span className="text-[#dfba61] font-bold">pro Finger 3 tiefe Atemzüge</span> (ein und aus). Gehe alle vier Griffe in deinem Tempo durch.
                  </p>
                </div>
              </div>

              <div className="bg-[#dfba61]/10 p-4 rounded-xl border border-[#dfba61]/20 italic text-sm text-[#ebd8c8]">
                Hinweis: Es ist am allereffektivsten, wenn du alle Finger einmal komplett der Reihe nach durchmachst.
              </div>

              <button 
                onClick={resetExercise}
                className="text-white/40 hover:text-[#dfba61] text-xs transition-colors flex items-center gap-2 mx-auto"
              >
                Anleitung noch einmal lesen
              </button>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        {currentStep > 0 && currentStep < 5 && (
          <div className="space-y-6 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={handleBack}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-semibold"
              >
                <ChevronLeft className="w-4 h-4" /> Zurück
              </button>
              
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(num => (
                  <div 
                    key={num}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentStep === num ? 'w-8 bg-[#dfba61]' : 'w-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl gold-gradient-btn text-[#0a232c] font-bold shadow-lg transition"
              >
                {currentStep === 4 ? 'Abschluss' : 'Nächster Finger'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Text */}
      <div className="text-center pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/60">
        <Heart className="w-3.5 h-3.5 text-[#dfba61]" />
        <span>In deinem eigenen Rhythmus. Du bist sicher und behütet.</span>
      </div>

    </div>
  );
};
