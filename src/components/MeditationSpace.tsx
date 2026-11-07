import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music, RefreshCw, Heart, Wind, Hand, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { soundSynth } from '../services/soundSynth';

// Unified illustration assets
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

const MEDITATION_FILES = [
  { title: 'Kopf abschalten und erholen', url: '/meditations/med1.mp3' },
  { title: 'Inneren Kritiker abstellen', url: '/meditations/med2.mp3' },
  { title: 'Gedankenkarussell beruhigen', url: '/meditations/med3.mp3' },
  { title: 'Gedanken und Grübeln loslassen', url: '/meditations/med4.mp3' },
  { title: 'Emotionen schnell beruhigen', url: '/meditations/med5.mp3' },
  { title: 'Angst sofort loslassen', url: '/meditations/med6.mp3' },
  { title: 'Limitierende Glaubenssätze auflösen', url: '/meditations/med7.mp3' },
  { title: 'Unsicherheit loslassen & Ideales Selbst', url: '/meditations/med8.mp3' },
  { title: 'Dankbarkeit kultivieren', url: '/meditations/med9.mp3' },
  { title: 'Dankbarkeit & Positives Denken', url: '/meditations/med10.mp3' }
];

// Reusable Audio Player Component (Local Asset optimized like Home Page)
interface AudioPlayerProps {
  title: string;
  audioUrl: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ title, audioUrl }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleLoaded = () => {
      if (audio.duration && !isNaN(audio.duration)) setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(false);
    };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.pause();
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      audio.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch((err) => {
        console.warn('Audio playback error:', err);
        setIsLoading(false);
      });
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-[#071920]/90 border-2 border-[#c79b78]/70 rounded-2xl p-3.5 sm:p-5 shadow-xl backdrop-blur-md flex flex-row items-center gap-3.5 sm:gap-4 relative overflow-hidden">
      <audio ref={audioRef} preload="auto" />

      <button
        onClick={togglePlay}
        disabled={isLoading}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0a232c] border-2 border-[#c79b78] flex items-center justify-center shrink-0 shadow-lg transition active:scale-95 group disabled:opacity-75"
      >
        {isLoading ? (
          <RefreshCw className="w-5 h-5 text-[#c79b78] animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5 text-[#c79b78] fill-[#c79b78]" />
        ) : (
          <Play className="w-5 h-5 text-[#c79b78] fill-[#c79b78] ml-0.5" />
        )}
      </button>

      <div className="flex-1 w-full space-y-1.5 min-w-0">
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="font-serif-serif font-bold text-[#ebd8c8] flex items-center gap-1.5 truncate">
            <Music className="w-3.5 h-3.5 text-[#c79b78] shrink-0" />
            <span className="truncate">{title}</span>
          </div>
          <span className="text-white/70 font-mono text-[11px] shrink-0">
            {isLoading ? 'Lädt...' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
          </span>
        </div>

        <div className="flex items-center justify-between h-7 px-2 bg-[#0a232c] rounded-lg border border-[#c79b78]/30 gap-1 overflow-hidden">
          {Array.from({ length: 28 }).map((_, i) => {
            const heights = [35, 65, 45, 80, 50, 75, 90, 40, 70, 85, 30, 75, 55, 80, 45, 60];
            const h = heights[i % heights.length];
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isPlaying ? 'bg-gradient-to-t from-[#c79b78] to-[#ebd8c8] animate-pulse' : 'bg-white/20'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(15, (h * (Math.sin(i + currentTime) + 1.5)) / 2.5)}%` : `${h * 0.35}%`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const MeditationSpace: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0); 

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
    <div className="w-full max-w-3xl mx-auto space-y-12 pb-12">
      
      {/* Container 1: 5-Finger-Reset */}
      <div className="space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            5-Finger-Nervensystem-Reset
          </h2>
          <p className="text-sm text-white/80 max-w-md mx-auto">
            Lerne die Griffe kennen, um dein Nervensystem herunterzufahren und Stress abzubauen.
          </p>
        </div>

        <div className="p-6 sm:p-10 rounded-2xl bg-[#071920] border-2 border-[#dfba61] shadow-xl space-y-8 relative overflow-hidden">
          <div className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-6 relative z-10">
            {currentStep === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="p-4 rounded-full bg-[#dfba61]/10 border border-[#dfba61]/30 inline-block">
                  <Hand className="w-10 h-10 text-[#dfba61]" />
                </div>
                <p className="font-serif-serif text-lg sm:text-xl leading-relaxed max-w-lg">
                  Diese Übung hilft dir, im Sitzen oder Stehen sofort zur Ruhe zu kommen. Schau dir zuerst die vier Finger-Verbindungen an.
                </p>
                <button onClick={handleNext} className="gold-gradient-btn px-8 py-3 rounded-xl text-[#0a232c] font-bold shadow-lg hover:scale-105 transition-all">
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
                    <img src={RESET_STEPS[currentStep - 1].image} alt={RESET_STEPS[currentStep - 1].title} className="w-full h-full object-cover" />
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
                <p className="text-white/60 text-sm">Griff: {RESET_STEPS[currentStep - 1].instruction}</p>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-8 animate-in fade-in zoom-in-90 duration-700">
                <h3 className="font-serif-serif text-3xl font-bold gold-gradient-text">Jetzt bist du bereit</h3>
                <div className="space-y-4 max-w-lg mx-auto bg-[#0a232c] p-6 rounded-2xl border border-[#dfba61]/30">
                  <p className="text-xl font-serif-serif leading-relaxed">
                    <strong className="text-[#dfba61]">Schließe nun deine Augen.</strong>
                  </p>
                  <p className="text-white/80 leading-relaxed text-left">
                    Verbinde nacheinander deinen Daumen mit den Fingern und nimm <span className="text-[#dfba61] font-bold">pro Finger 3 tiefe Atemzüge</span> (ein und aus).
                  </p>
                </div>
                <button onClick={resetExercise} className="text-white/40 hover:text-[#dfba61] text-xs transition-colors mx-auto">
                  Anleitung noch einmal lesen
                </button>
              </div>
            )}
          </div>

          {currentStep > 0 && currentStep < 5 && (
            <div className="space-y-6 pt-4 border-t border-white/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button onClick={handleBack} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-semibold">
                  <ChevronLeft className="w-4 h-4" /> Zurück
                </button>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(num => (
                    <div key={num} className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === num ? 'w-8 bg-[#dfba61]' : 'w-2 bg-white/20'}`} />
                  ))}
                </div>
                <button onClick={handleNext} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl gold-gradient-btn text-[#0a232c] font-bold shadow-lg transition">
                  {currentStep === 4 ? 'Abschluss' : 'Weiter'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Container 2: Geführte Meditationen */}
      <div className="space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Geführte Meditationen
          </h2>
          <p className="text-sm text-white/80 max-w-md mx-auto">
            Tauche ein in die Stille und finde neue Kraft in deiner inneren Mitte.
          </p>
        </div>

        <div className="space-y-6">
          {MEDITATION_FILES.map((med, idx) => (
            <AudioPlayer key={idx} title={med.title} audioUrl={med.url} />
          ))}
        </div>

        <div className="bg-black/20 p-4 rounded-xl border border-[#dfba61]/20 italic text-sm text-[#ebd8c8] text-center">
          <Volume2 className="w-4 h-4 text-[#dfba61] inline-block mr-2" />
          Schenke dir diese Zeit der Ruhe und Geborgenheit.
        </div>
      </div>

    </div>
  );
};
