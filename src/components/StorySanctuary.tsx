import React, { useState, useRef } from 'react';
import { CelestialTouch } from './CelestialTouch';
import { Sparkles, Sun, Moon, Play, Pause, Music } from 'lucide-react';

interface StorySanctuaryProps {
  onGoToBreath: () => void;
  onGoToStars: () => void;
}

export const StorySanctuary: React.FC<StorySanctuaryProps> = ({ onGoToBreath, onGoToStars }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio playback error:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Main Section Title */}
      <div className="text-center">
        <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
          Die Geschichte von Sonne, Mond und Sternen
        </h2>
      </div>

      {/* 1. Story Text in Content Box with Golden Frame & Audio Player Inside */}
      <div className="bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-white/90 font-serif-serif text-base sm:text-lg leading-relaxed relative overflow-hidden">
        
        {/* Subtle background glow accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#dfba61]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Compact Audio Player Card Inside Story Container */}
        <div className="bg-[#071920]/90 border-2 border-[#c79b78]/70 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden mb-6">
          <audio
            ref={audioRef}
            src="https://www.dropbox.com/scl/fi/g6r348wj1jvmudtzjfujd/Die-Geschichte-von-Sonne-Mond-und-Sternen.wav?rlkey=96zbrlfjd9mxkmgh1dnonexy1&st=ulwscj36&raw=1"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            preload="metadata"
          />

          {/* Play/Pause Button in Copper Design */}
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-xl bg-[#0a232c] border-2 border-[#c79b78] flex items-center justify-center shrink-0 shadow-lg transition active:scale-95 group"
            title={isPlaying ? 'Audio pausieren' : 'Audio abspielen'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-[#c79b78] fill-[#c79b78]" />
            ) : (
              <Play className="w-5 h-5 text-[#c79b78] fill-[#c79b78] ml-0.5" />
            )}
          </button>

          {/* Info & Animated Waveform */}
          <div className="flex-1 w-full space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-serif-serif font-bold text-[#ebd8c8] flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#c79b78]" />
                <span>Die Geschichte anhören (Hörfassung)</span>
              </span>
              <span className="text-white/70 font-mono text-[11px]">
                {formatTime(currentTime)} / {formatTime(duration || 180)}
              </span>
            </div>

            {/* Animated Waveform Bars in Copper/Gold */}
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

        <p className="leading-relaxed">
          <Sun className="w-4 h-4 text-[#ffe89c] inline-block mr-2 align-middle shrink-0" />
          <strong className="font-semibold text-white">Die Sonne</strong> strahlt in ihrer ganz eigenen, schönen Wildheit. Sie spendet Wärme, erhellt den Tag und schenkt dem Leben seine bunten Farben.
        </p>

        <p className="leading-relaxed pt-3">
          <Moon className="w-4 h-4 text-[#c79b78] inline-block mr-2 align-middle shrink-0" />
          <strong className="font-semibold text-white">Der Mond</strong> zieht bedacht seine Bahnen im weiten Raum. Er wacht über die Stille der Nacht und schenkt der Welt Ruhe und inneren Frieden.
        </p>

        <p className="leading-relaxed">
          Sie sind unterschiedlich in ihrem Wesen und doch gehören sie zusammen. Keiner sperrt den anderen ein, keiner erwartet vom anderen, dass er seine Bahn verlässt. Sie leuchten einfach, Tag für Tag und Nacht für Nacht, jeder auf seine Art. Und in den Momenten, in denen Tag und Nacht sich sanft berühren, begegnen sie sich in wahrhaftiger Liebe.
        </p>

        <p className="leading-relaxed">
          Und zwischen ihnen funkeln die Sterne, kleine, leuchtende Lichter. Sie füllen den Raum mit Leben und Freude – von Liebe getragen, behütet und beschützt.
        </p>

      </div>

      {/* 2. Highlight Box styled to match gold foil paper background */}
      <div className="bg-[#0a232c] border-l-4 border-[#dfba61] p-6 sm:p-8 rounded-xl font-serif-serif italic shadow-2xl border-y border-r border-[#dfba61]/30">
        <p className="mb-0 gold-gradient-text text-base sm:text-lg leading-relaxed">
          Diese Seite ist dein Raum. Kein Ort für Pflichten, keine Aufgabenliste, kein Müssen.<br />
          Sie ist eine Einladung an dich, meine Sonne, kurz innezuhalten, durchzuatmen und dir selbst zu gehören. Wann immer du magst. Ganz ohne Erwartung.
        </p>
      </div>

      {/* 3. Interaktive Himmelsbegegnung (Celestial Touch Orbit Widget) */}
      <div className="my-6">
        <CelestialTouch />
      </div>

      {/* Interactive Navigation Prompt Cards inside the story */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <button
          onClick={onGoToBreath}
          className="p-5 rounded-xl bg-[#0a232c] border border-[#dfba61]/40 hover:border-[#dfba61] text-left transition-all hover:shadow-xl group flex items-start gap-4"
        >
          <div className="p-3 rounded-full gold-gradient-btn text-[#0a232c] group-hover:scale-110 transition-transform">
            <Sun className="w-5 h-5 text-[#0a232c]" />
          </div>
          <div>
            <h4 className="font-semibold text-base mb-1 gold-gradient-text">Kurz durchatmen</h4>
            <p className="text-xs text-white/70">Gönne dir 1 Minute sanfte Atemübung & Entspannung.</p>
          </div>
        </button>

        <button
          onClick={onGoToStars}
          className="p-5 rounded-xl bg-[#0a232c] border border-[#dfba61]/40 hover:border-[#dfba61] text-left transition-all hover:shadow-xl group flex items-start gap-4"
        >
          <div className="p-3 rounded-full gold-gradient-btn text-[#0a232c] group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-[#0a232c]" />
          </div>
          <div>
            <h4 className="font-semibold text-base mb-1 gold-gradient-text">Sternschnuppen</h4>
            <p className="text-xs text-white/70">Entdecke leuchtende Gedanken oder schenke eigene Sterne.</p>
          </div>
        </button>
      </div>

      {/* Closing */}
      <div className="text-center mt-10 pt-6 border-t border-[#dfba61]/30">
        <p className="font-serif-serif text-2xl sm:text-3xl font-medium flex items-center justify-center gap-2">
          <span className="gold-gradient-text font-semibold">Schön, dass es dich gibt.</span>
          <span className="text-[#e6d3a3] animate-pulse">✨</span>
        </p>
        <p className="font-script text-2xl text-[#dfba61] mt-2">
          Manuel & Stefanie
        </p>
      </div>

    </div>
  );
};
