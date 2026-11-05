import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Pause, RotateCcw, Heart, Volume2, Moon, Sun } from 'lucide-react';
import { soundSynth } from '../services/soundSynth';

interface MeditationSession {
  id: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  description: string;
  steps: string[];
  icon: 'sun' | 'moon' | 'sparkles';
}

const MEDITATIONS: MeditationSession[] = [
  {
    id: 'inner-peace',
    title: 'Stille des Herzens',
    subtitle: '3 Minuten · Sanfte Zentrierung',
    durationMinutes: 3,
    description: 'Eine kurze Auszeit, um den Geist zur Ruhe zu bringen und dir selbst eine liebevolle Umarmung zu schenken.',
    steps: [
      'Schließe sanft deine Augen und lenke deine Aufmerksamkeit ganz leicht auf deine Herzgegend.',
      'Spüre, wie sich dein Brustkorb bei jeder Einatmung hebt und bei jeder Ausatmung entspannt.',
      'Stelle dir ein warmes, goldenes Licht in deinem Herzen vor, das mit jedem Atemzug heller leuchtet.',
      'Sage dir leise im Geist: "Ich bin hier, ich bin sicher, ich darf einfach sein."',
      'Verweile noch für ein paar Atemzüge in diesem goldenen Frieden.'
    ],
    icon: 'sparkles'
  },
  {
    id: 'sunlight-warmth',
    title: 'Sonnengold & Lebensenergie',
    subtitle: '5 Minuten · Wärmendes Licht',
    durationMinutes: 5,
    description: 'Lade die Lichtenergie der Sonne ein, um Anspannung zu schmelzen und Körper und Geist aufzutanken.',
    steps: [
      'Nimm eine bequeme Haltung ein. Spüre den Boden unter dir, der dich verlässlich trägt.',
      'Stelle dir eine sanfte, warme Morgensonne vor, die deine Stirn, deine Schultern und deine Hände wärmt.',
      'Mit jeder Einatmung nimmst du diese wohlige Wärme auf; mit jeder Ausatmung lässt du alle Schwere los.',
      'Spüre, wie das goldene Sonnenlicht jede Zelle deines Körpers mit frischer Kraft und Ruhe erfüllt.',
      'Atme tiefer ein, öffne langsam die Augen und nimm dieses Sonnengold mit in deinen Tag.'
    ],
    icon: 'sun'
  },
  {
    id: 'moon-night-calm',
    title: 'Mondlicht & Tiefenentspannung',
    subtitle: '7 Minuten · Geborgenheit vor dem Schlafen',
    durationMinutes: 7,
    description: 'Tauche ein in die kühle, schützende Stille der Nacht. Ideal zum Abschalten und Einschlafen.',
    steps: [
      'Lege dich gemütlich hin oder mache es dir im Sessel ganz bequem.',
      'Der Tag ist vollbracht. Alles, was war, darf nun ruhen. Du musst nichts mehr erledigen.',
      'Stelle dir vor, wie kühles, silbernes Mondlicht hüllenartig um dich liegt wie eine weiche Decke.',
      'Lass deine Schultern sinken, entspanne deine Kiefermuskeln und passe dich dem ruhigen Rhythmus deines Atems an.',
      'Gleite sanft in die Geborgenheit der Nacht. Du bist beschützt und geliebt.'
    ],
    icon: 'moon'
  }
];

export const MeditationSpace: React.FC = () => {
  const [activeSession, setActiveSession] = useState<MeditationSession>(MEDITATIONS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(MEDITATIONS[0].durationMinutes * 60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      soundSynth.playSoftBell();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleSelectSession = (session: MeditationSession) => {
    setActiveSession(session);
    setCurrentStepIndex(0);
    setIsRunning(false);
    setTimeLeft(session.durationMinutes * 60);
    soundSynth.playSoftBell();
  };

  const toggleTimer = () => {
    if (!isRunning) {
      soundSynth.playSoftBell();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(activeSession.durationMinutes * 60);
    setCurrentStepIndex(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
      
      {/* Gold Title */}
      <div className="text-center space-y-2">
        <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
          Meditation
        </h2>
        <p className="text-sm text-white/80 max-w-md mx-auto">
          "In der Ruhe findest du die Kraft deines Herzens. Schenke dir diesen kostbaren Augenblick des Seins."
        </p>
      </div>

      {/* Meditation Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MEDITATIONS.map((meditation) => {
          const isSelected = activeSession.id === meditation.id;
          return (
            <button
              key={meditation.id}
              onClick={() => handleSelectSession(meditation)}
              className={`p-5 rounded-xl border text-left transition-all space-y-2 flex flex-col justify-between ${
                isSelected
                  ? 'gold-gradient-btn text-[#0a232c] border-[#dfba61] shadow-xl scale-[1.02]'
                  : 'bg-[#071920] hover:bg-white/10 text-white border-[#dfba61]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                {meditation.icon === 'sun' && <Sun className={`w-5 h-5 ${isSelected ? 'text-[#0a232c]' : 'text-[#f5d77f]'}`} />}
                {meditation.icon === 'moon' && <Moon className={`w-5 h-5 ${isSelected ? 'text-[#0a232c]' : 'text-teal-200'}`} />}
                {meditation.icon === 'sparkles' && <Sparkles className={`w-5 h-5 ${isSelected ? 'text-[#0a232c]' : 'text-[#dfba61]'}`} />}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#0a232c] text-[#dfba61]' : 'bg-white/10 text-white/80'}`}>
                  {meditation.durationMinutes} Min
                </span>
              </div>
              <div>
                <h3 className="font-serif-serif font-bold text-base leading-tight">
                  {meditation.title}
                </h3>
                <p className={`text-xs mt-1 ${isSelected ? 'text-[#0a232c]/80 font-medium' : 'text-white/60'}`}>
                  {meditation.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Meditation Display & Timer Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#071920] via-[#0a232c] to-[#0f3844] border-2 border-[#dfba61] shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="font-serif-serif text-2xl font-bold text-[#f5d77f]">
              {activeSession.title}
            </h3>
            <p className="text-xs text-white/70 mt-0.5">
              {activeSession.description}
            </p>
          </div>

          {/* Timer Display */}
          <div className="flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-2xl border border-[#dfba61]/40 shrink-0">
            <span className="font-mono text-2xl font-bold text-[#dfba61]">
              {formatTime(timeLeft)}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTimer}
                className="p-2 rounded-full gold-gradient-btn text-[#0a232c] transition font-bold"
                title={isRunning ? 'Pause' : 'Start'}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={resetTimer}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                title="Zurücksetzen"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Meditation Step Guide */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#e6d3a3] font-semibold">
            <span>Geführter Impuls ({currentStepIndex + 1} von {activeSession.steps.length})</span>
            <div className="flex gap-1">
              {activeSession.steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === currentStepIndex ? 'gold-gradient-btn w-6' : 'bg-white/20 hover:bg-white/40 w-2.5'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-black/30 border border-[#dfba61]/30 text-center space-y-4 min-h-[120px] flex flex-col items-center justify-center">
            <p className="font-serif-serif text-lg sm:text-xl italic leading-relaxed text-white">
              "{activeSession.steps[currentStepIndex]}"
            </p>
          </div>

          {/* Navigation controls for steps */}
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-semibold text-white transition"
            >
              ← Vorheriger Schritt
            </button>

            <span className="text-xs text-white/50 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-[#dfba61]" />
              In Deinem Tempo
            </span>

            <button
              disabled={currentStepIndex === activeSession.steps.length - 1}
              onClick={() => setCurrentStepIndex((prev) => Math.min(activeSession.steps.length - 1, prev + 1))}
              className="px-4 py-1.5 rounded-lg gold-gradient-btn disabled:opacity-30 text-xs font-bold text-[#0a232c] transition"
            >
              Nächster Schritt →
            </button>
          </div>
        </div>

      </div>

      <div className="text-center pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/60">
        <Volume2 className="w-3.5 h-3.5 text-[#dfba61]" />
        <span>Nimm dir so viel Zeit, wie du heute brauchst. Du bist am richtigen Ort.</span>
      </div>

    </div>
  );
};
