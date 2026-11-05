import React, { useState, useEffect, useRef } from 'react';
import { Waves, Sparkles, Heart, Volume2, VolumeX, Moon, Send, RefreshCw, Copy, Check, Wind, Droplets } from 'lucide-react';
import { soundSynth } from '../services/soundSynth';

interface LakeRipple {
  id: number;
  x: number;
  y: number;
}

interface LakeThought {
  id: string;
  text: string;
  date: string;
}

const LAKE_IMPULSES = [
  {
    title: 'Der hölzerne Steg',
    text: 'Barfuß auf dem noch sonnenwarmen Holz sitzen. Die Zehen berühren das kühle, sanfte Seewasser. Nichts drängt, kein Ziel muss erreicht werden. Nur das leise Schaukeln der Wellen und der weite Sternenhimmel über euch.',
    mood: 'Geborgenheit & Weite',
  },
  {
    title: 'Der Tanz der Glühwürmchen',
    text: 'In der lauen Nachtluft schweben winzige goldene Funken über dem Schilf. Sie erinnern uns daran, wie viel stiller Zauber in den leisen, unaufgeregten Augenblicken unseres Lebens verborgen liegt.',
    mood: 'Leichtigkeit & Zauber',
  },
  {
    title: 'Der goldene Mondpfad',
    text: 'Der Schein des Mondes zieht eine glitzernde goldene Straße über das dunkle Wasser – und sie führt genau bis zu deinen Füßen, ganz gleich, an welcher Stelle des Ufers du stehst.',
    mood: 'Vertrauen & Führung',
  },
  {
    title: 'Spiegelbild der Stille',
    text: 'Wenn der See zur Ruhe kommt, spiegelt er mühelos den gesamten Nachthimmel wider. So wird auch unsere Seele friedlich und klar, wenn wir aufhören, gegen die Strömung zu schwimmen.',
    mood: 'Klarheit & Friede',
  },
  {
    title: 'Warme Sommerbrise',
    text: 'Ein zarter Duft von warmen Gräsern, feuchter Erde und Kiefernwald zieht über das Ufer. Atme einmal tief ein. Spüre die Freiheit dieser Sommernacht auf deiner Haut.',
    mood: 'Freiheit & Ankommen',
  },
];

export const SommernachtSee: React.FC = () => {
  const [ripples, setRipples] = useState<LakeRipple[]>([]);
  const [pebbleInput, setPebbleInput] = useState('');
  const [isThrowingPebble, setIsThrowingPebble] = useState(false);
  const [pebbleSuccessMessage, setPebbleSuccessMessage] = useState<string | null>(null);
  const [thoughts, setThoughts] = useState<LakeThought[]>(() => {
    try {
      const saved = localStorage.getItem('sommernacht_lake_thoughts');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: '1',
        text: 'Den Tag mit all seinen Herausforderungen loslassen und die Ruhe spüren.',
        date: 'Sommerabend',
      },
      {
        id: '2',
        text: 'Dankbar für diese gemeinsame Oase der Ruhe und Liebe.',
        date: 'Sternennacht',
      },
    ];
  });

  const [activeImpulseIdx, setActiveImpulseIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [breathingPhase, setBreathingPhase] = useState<'Einatmen' | 'Innehalten' | 'Ausatmen'>('Einatmen');
  const [breathingSeconds, setBreathingSeconds] = useState(4);
  const lakeCanvasRef = useRef<HTMLDivElement>(null);

  // Synchronize audio state with soundSynth
  useEffect(() => {
    const isLake = soundSynth.getCurrentMode() === 'lake';
    setIsAudioPlaying(isLake);
  }, []);

  // Breathing wave rhythm (4s in, 3s hold, 5s out)
  useEffect(() => {
    const cycle = setInterval(() => {
      setBreathingSeconds((prev) => {
        if (prev <= 1) {
          setBreathingPhase((current) => {
            if (current === 'Einatmen') return 'Innehalten';
            if (current === 'Innehalten') return 'Ausatmen';
            return 'Einatmen';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cycle);
  }, []);

  // Save thoughts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sommernacht_lake_thoughts', JSON.stringify(thoughts));
    } catch {
      // ignore storage errors
    }
  }, [thoughts]);

  // Clean up ripples after animation
  useEffect(() => {
    if (ripples.length === 0) return;
    const timer = setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 2800);
    return () => clearTimeout(timer);
  }, [ripples]);

  // Handle click on the water to spawn ripples
  const handleLakeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!lakeCanvasRef.current) return;
    const rect = lakeCanvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newRipple: LakeRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
    };
    setRipples((prev) => [...prev.slice(-6), newRipple]);
    soundSynth.playWaterDrop();
  };

  // Toggle ambient lake sound
  const handleToggleAudio = () => {
    if (isAudioPlaying) {
      soundSynth.stopCurrent();
      setIsAudioPlaying(false);
    } else {
      soundSynth.setVolume(volume);
      soundSynth.playSound('lake');
      setIsAudioPlaying(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundSynth.setVolume(newVol);
  };

  // Throw a pebble with thought into the lake
  const handleThrowPebble = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pebbleInput.trim() || isThrowingPebble) return;

    setIsThrowingPebble(true);
    soundSynth.playWaterDrop();

    // Center ripple for the falling pebble
    const pebbleRipple: LakeRipple = {
      id: Date.now(),
      x: 50,
      y: 65,
    };
    setRipples((prev) => [...prev, pebbleRipple]);

    setTimeout(() => {
      const newThought: LakeThought = {
        id: Date.now().toString(),
        text: pebbleInput.trim(),
        date: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr',
      };
      setThoughts((prev) => [newThought, ...prev]);
      setPebbleInput('');
      setIsThrowingPebble(false);
      setPebbleSuccessMessage('Dein Gedanke zieht weite, friedvolle Kreise im warmen Seewasser. Die Stille des Sees nimmt ihn in Liebe auf.');

      setTimeout(() => {
        setPebbleSuccessMessage(null);
      }, 5000);
    }, 1200);
  };

  const handleCopyImpulse = () => {
    const current = LAKE_IMPULSES[activeImpulseIdx];
    navigator.clipboard.writeText(`"${current.text}" — ${current.title} (${current.mood})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentImpulse = LAKE_IMPULSES[activeImpulseIdx];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-5 sm:p-8 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
      
      {/* 1. Header Section */}
      <div className="text-center space-y-2 border-b border-[#dfba61]/30 pb-5">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e6d3a3]">
          <Waves className="w-4 h-4 text-[#dfba61]" />
          <span>Sommerlicher Rückzugsort</span>
        </div>
        <h2 className="font-serif-serif text-3xl sm:text-5xl font-bold gold-gradient-text tracking-wide">
          Sommernacht am See
        </h2>
        <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
          Wo laue Abendbrisen das Wasser streicheln, Glühwürmchen wie kleine Sterne tanzen und der See deine Gedanken in sanfte Ruhe wiegt.
        </p>
        <p className="font-script text-xl sm:text-2xl text-[#dfba61] pt-1">
          Manuel & Stefanie
        </p>
      </div>

      {/* 2. Interactive Lake Waterscape View */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-white/80 px-1">
          <span className="flex items-center gap-1.5 font-medium text-[#e6d3a3]">
            <Droplets className="w-4 h-4 text-[#dfba61]" />
            Tippe auf das Wasser, um sanfte Wellen zu erzeugen
          </span>
          <span className="text-white/60 hidden sm:inline text-[11px]">
            Laue Sommernacht · Stilles Wasser
          </span>
        </div>

        {/* The Lake Canvas Container */}
        <div
          ref={lakeCanvasRef}
          onClick={handleLakeClick}
          className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden cursor-pointer select-none border-2 border-[#dfba61]/70 shadow-2xl transition-all group"
          style={{
            background: 'linear-gradient(to bottom, #05141c 0%, #08222b 35%, #0b313d 60%, #061922 100%)',
          }}
          title="Klicke auf das Wasser für Wellenringe"
        >
          {/* Distant Shoreline Silhouettes & Night Atmosphere */}
          <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-[#020b0f] via-[#05161f] to-transparent pointer-events-none" />

          {/* Golden Crescent Moon in the Summer Night Sky */}
          <div className="absolute top-6 right-8 sm:right-16 pointer-events-none flex flex-col items-center">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#f5d77f]/25 blur-lg animate-pulse-slow" />
              <Moon className="w-10 h-10 sm:w-12 sm:h-12 text-[#fff2b2] drop-shadow-[0_0_12px_rgba(245,215,127,0.8)] fill-[#fff5c5]/40" />
            </div>
          </div>

          {/* Distant Stars in the Sky */}
          <div className="absolute top-2 inset-x-0 h-32 pointer-events-none">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white rounded-full"
                style={{
                  top: `${(i * 13) % 85}%`,
                  left: `${(i * 19) % 94}%`,
                  width: `${(i % 3) + 1}px`,
                  height: `${(i % 3) + 1}px`,
                  opacity: 0.35 + (i % 5) * 0.15,
                  animation: `pulse ${(i % 3) + 2}s infinite ease-in-out`,
                }}
              />
            ))}
          </div>

          {/* Distant Shore Tree Silhouettes (SVG) */}
          <svg
            className="absolute top-16 inset-x-0 w-full h-20 opacity-40 pointer-events-none"
            preserveAspectRatio="none"
            viewBox="0 0 1000 100"
          >
            <path
              d="M0,100 L0,70 Q70,45 150,65 T300,55 T450,70 T600,50 T750,68 T900,52 T1000,65 L1000,100 Z"
              fill="#030d12"
            />
          </svg>

          {/* Lake Water Surface Horizon Line */}
          <div className="absolute top-28 inset-x-0 h-[1px] bg-[#dfba61]/30 pointer-events-none shadow-[0_0_8px_rgba(223,186,97,0.3)]" />

          {/* Golden Moon Reflection Path on the Water (Mondpfad) */}
          <div className="absolute top-28 right-7 sm:right-15 w-14 sm:w-20 bottom-0 pointer-events-none overflow-hidden flex flex-col items-center">
            {[...Array(14)].map((_, i) => (
              <div
                key={i}
                className="my-1 rounded-full bg-gradient-to-r from-transparent via-[#fae298]/60 to-transparent blur-[0.5px] animate-pulse"
                style={{
                  width: `${20 + i * 5}px`,
                  height: `${2 + (i % 2)}px`,
                  opacity: Math.max(0.2, 0.75 - i * 0.035),
                  animationDuration: `${1.8 + (i % 4) * 0.4}s`,
                }}
              />
            ))}
          </div>

          {/* Water Gentle Wave Ripples (SVG background movement) */}
          <div className="absolute inset-x-0 top-32 bottom-0 pointer-events-none opacity-25">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 400">
              <path
                d="M0,40 C150,30 250,50 400,40 C550,30 650,50 800,40 L800,400 L0,400 Z"
                fill="none"
                stroke="#dfba61"
                strokeWidth="0.8"
                strokeDasharray="4 6"
              />
              <path
                d="M0,110 C200,95 300,120 500,105 C700,90 750,115 800,110"
                fill="none"
                stroke="#fae298"
                strokeWidth="0.6"
                strokeDasharray="5 8"
              />
              <path
                d="M0,190 C180,180 280,200 480,185 C680,170 720,195 800,190"
                fill="none"
                stroke="#dfba61"
                strokeWidth="0.5"
                strokeDasharray="6 10"
              />
              <path
                d="M0,280 C150,265 350,290 550,275 C700,260 760,285 800,280"
                fill="none"
                stroke="#fae298"
                strokeWidth="0.6"
              />
            </svg>
          </div>

          {/* Floating Fireflies (Glühwürmchen) dancing over the lake */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { top: '45%', left: '22%', dur: '3.8s', delay: '0s' },
              { top: '55%', left: '38%', dur: '4.5s', delay: '1.2s' },
              { top: '40%', left: '60%', dur: '5.1s', delay: '0.6s' },
              { top: '68%', left: '75%', dur: '4.2s', delay: '2.1s' },
              { top: '78%', left: '28%', dur: '3.5s', delay: '1.8s' },
              { top: '62%', left: '50%', dur: '4.8s', delay: '0.9s' },
              { top: '35%', left: '15%', dur: '4.0s', delay: '2.5s' },
              { top: '72%', left: '88%', dur: '5.5s', delay: '1.5s' },
            ].map((fw, idx) => (
              <div
                key={idx}
                className="absolute flex items-center justify-center transition-all"
                style={{
                  top: fw.top,
                  left: fw.left,
                  animation: `float-slow ${fw.dur} infinite ease-in-out`,
                  animationDelay: fw.delay,
                }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#fae298]/50 blur-[2px] animate-pulse" />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-[#ffffff] shadow-[0_0_8px_#fae298]" />
              </div>
            ))}
          </div>

          {/* Interactive Click Water Ripples */}
          {ripples.map((rip) => (
            <div
              key={rip.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
              style={{ left: `${rip.x}%`, top: `${rip.y}%` }}
            >
              <div
                className="rounded-full border border-[#f5d77f]/80 animate-ping"
                style={{
                  width: '70px',
                  height: '35px',
                  animationDuration: '1.6s',
                }}
              />
              <div
                className="absolute rounded-full border border-[#dfba61]/50 animate-ping"
                style={{
                  width: '130px',
                  height: '65px',
                  animationDuration: '2.4s',
                  animationDelay: '0.2s',
                }}
              />
            </div>
          ))}

          {/* Pebble Falling Animation Effect */}
          {isThrowingPebble && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center animate-bounce">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#dfba61] to-[#735b29] border border-white/60 shadow-lg" />
              <span className="text-[11px] text-[#f5d77f] font-serif-serif italic mt-1 bg-black/60 px-2 py-0.5 rounded-full">
                Kieselstein sinkt sanft...
              </span>
            </div>
          )}

          {/* Subtle Bottom Shore Boardwalk / Reeds Silhouette */}
          <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between px-6 pointer-events-none">
            <span className="text-[11px] text-[#f5d77f]/70 font-serif-serif italic">
              "Am Ufer verweilen, wo die Nacht den See berührt"
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#e6d3a3]/80">
              <Sparkles className="w-3 h-3 text-[#dfba61]" />
              <span>Glühwürmchen am Schilf</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Audio Soundscape Controller for Sommernacht am See */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#071920] border border-[#dfba61]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-white/5 border border-[#dfba61]/30 shrink-0">
            <Volume2 className="w-5 h-5 text-[#dfba61]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#f5d77f]">
              Klangkulisse: Seewellen & Sommernacht
            </h4>
            <p className="text-xs text-white/70">
              Sanftes Wasserplätschern, warme Nachtbrise und zarte Grillen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          {/* Volume slider */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/60">Lautstärke</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 sm:w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#dfba61]"
            />
          </div>

          {/* Play / Stop Button with our gold gradient light-left to dark-right */}
          <button
            onClick={handleToggleAudio}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs shadow-lg transition active:scale-95 shrink-0"
          >
            {isAudioPlaying ? (
              <>
                <VolumeX className="w-4 h-4 text-[#0a232c]" />
                <span>Klang stoppen</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#0a232c]" />
                <span>Klang starten</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Ritual: Einen Kieselstein ins Wasser werfen */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#071920] via-[#0a232c] to-[#0f3844] border-2 border-[#dfba61] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#dfba61]" />
            <h3 className="font-serif-serif text-xl sm:text-2xl font-bold gold-gradient-text">
              Einen Kieselstein ins stille Wasser werfen
            </h3>
          </div>
          <span className="text-xs text-[#e6d3a3] font-medium bg-black/40 px-3 py-1 rounded-full border border-[#dfba61]/30">
            Abend-Ritual
          </span>
        </div>

        <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
          Welchen Gedanken, welche Anspannung oder welchen liebevollen Herzenswunsch möchtest du der Stille des Sees übergeben? Schreibe es auf und lass den Kieselstein sanfte Kreise auf dem Wasser ziehen.
        </p>

        <form onSubmit={handleThrowPebble} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={pebbleInput}
              onChange={(e) => setPebbleInput(e.target.value)}
              placeholder="z.B. Ich lasse alle Hektik los und danke für diesen Abend..."
              disabled={isThrowingPebble}
              className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#dfba61]"
            />
            <button
              type="submit"
              disabled={!pebbleInput.trim() || isThrowingPebble}
              className="px-6 py-3 rounded-xl gold-gradient-btn disabled:opacity-50 text-[#0a232c] font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shrink-0"
            >
              <Send className="w-4 h-4 text-[#0a232c]" />
              <span>{isThrowingPebble ? 'Kieselstein fliegt...' : 'Kieselstein werfen'}</span>
            </button>
          </div>
        </form>

        {pebbleSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5 animate-fade-in">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{pebbleSuccessMessage}</span>
          </div>
        )}

        {/* Floating Shore Thoughts List */}
        {thoughts.length > 0 && (
          <div className="pt-2 space-y-2">
            <span className="text-xs font-semibold text-[#e6d3a3] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#dfba61]" />
              Gedanken am Seeufer ({thoughts.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {thoughts.slice(0, 4).map((th) => (
                <div
                  key={th.id}
                  className="p-3.5 rounded-xl bg-black/30 border border-[#dfba61]/25 text-left space-y-1 hover:border-[#dfba61]/60 transition"
                >
                  <p className="text-xs text-white/90 font-serif-serif text-sm italic">
                    "{th.text}"
                  </p>
                  <span className="text-[10px] text-[#dfba61]/80 block">
                    {th.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Poetic Impulses by the Lake Carousel */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#071920] border border-[#dfba61]/50 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#e6d3a3]">
              <Heart className="w-3.5 h-3.5 text-[#dfba61] fill-[#dfba61]" />
              <span>Sommerabend-Impuls ({activeImpulseIdx + 1} von {LAKE_IMPULSES.length})</span>
            </div>
            <h3 className="font-serif-serif text-2xl font-bold text-[#f5d77f] mt-0.5">
              {currentImpulse.title}
            </h3>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-black/40 border border-[#dfba61]/40 text-[#e6d3a3]">
            {currentImpulse.mood}
          </span>
        </div>

        <div className="p-6 rounded-xl bg-black/30 border border-[#dfba61]/30 min-h-[110px] flex items-center justify-center text-center">
          <p className="font-serif-serif text-base sm:text-xl italic leading-relaxed text-white">
            "{currentImpulse.text}"
          </p>
        </div>

        {/* Carousel buttons and copy */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex gap-1.5">
            {LAKE_IMPULSES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImpulseIdx(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === activeImpulseIdx ? 'gold-gradient-btn w-6' : 'bg-white/20 hover:bg-white/40 w-2.5'
                }`}
                title={`Impuls ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyImpulse}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white/90 font-medium flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopiert' : 'Kopieren'}</span>
            </button>

            <button
              onClick={() => setActiveImpulseIdx((prev) => (prev + 1) % LAKE_IMPULSES.length)}
              className="px-4 py-1.5 rounded-lg gold-gradient-btn text-[#0a232c] text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#0a232c]" />
              <span>Nächster Impuls</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Gentle Wave Breath Mini-Guide */}
      <div className="p-5 rounded-xl bg-black/30 border border-[#dfba61]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full gold-gradient-btn text-[#0a232c] shrink-0">
            <Wind className="w-5 h-5 text-[#0a232c]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#f5d77f]">
              Atem im Rhythmus der Wellen
            </h4>
            <p className="text-xs text-white/70">
              Folge dem Heben und Senken des Wassers für ein paar Augenblicke.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#071920] px-5 py-2.5 rounded-2xl border border-[#dfba61]/40">
          <span className="font-serif-serif text-base font-semibold text-[#f5d77f]">
            {breathingPhase}
          </span>
          <span className="text-xs font-mono font-bold bg-[#dfba61]/20 px-2 py-0.5 rounded text-[#fae298]">
            {breathingSeconds}s
          </span>
        </div>
      </div>

      {/* Closing Quote */}
      <div className="text-center pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/60">
        <Heart className="w-3.5 h-3.5 text-[#dfba61] fill-[#dfba61]" />
        <span>Die Sommernacht am See gehört euch. Atmet tief durch und lasst die Seele baumeln.</span>
      </div>

    </div>
  );
};
