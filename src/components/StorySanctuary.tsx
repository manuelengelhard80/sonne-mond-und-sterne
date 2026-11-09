import React, { useState, useRef, useEffect } from 'react';
import { CelestialTouch } from './CelestialTouch';
import { Sparkles, Sun, Moon, Play, Pause, Music, RefreshCw, Plus } from 'lucide-react';

interface StorySanctuaryProps {
  onGoToBreath: () => void;
  onGoToStars: () => void;
}

export const StorySanctuary: React.FC<StorySanctuaryProps> = ({ onGoToBreath, onGoToStars }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);

  // Set audio src directly to local static asset for 100% reliable online & mobile playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = '/story.wav';
      audioRef.current.load();
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoaded = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

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
      setIsLoading(false);
    } else {
      window.dispatchEvent(new CustomEvent('app-audio-play', { detail: { id: '/story.wav' } }));
      setIsPlaying(true);
      audio.play().then(() => {
        setIsLoading(false);
      }).catch((err) => {
        console.warn('Audio playback error:', err);
        setIsPlaying(false);
        setIsLoading(false);
      });
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const progressPercent = duration > 0 ? (currentTime / duration) : 0;
  const storyTitle = 'Die Geschichte von Sonne, Mond und Sternen';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      {/* 1. Story Text in Content Box with Golden Frame & Audio Player Inside */}
      <div className="bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-white/90 font-serif-serif text-base sm:text-lg leading-relaxed relative overflow-hidden">
        
        {/* Subtle background glow accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#dfba61]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Story Title inside container above player */}
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Die Geschichte von Sonne, Mond und Sternen
          </h2>
        </div>

        {/* Compact Audio Player Card Inside Story Container */}
        <div className="bg-[#071920]/90 border-2 border-[#c79b78]/70 rounded-2xl p-3.5 sm:p-5 shadow-xl backdrop-blur-md flex flex-row items-center gap-3.5 sm:gap-4 relative overflow-hidden mb-6">
          <audio
            ref={audioRef}
            src="/story.wav"
            preload="auto"
          />

          {/* Play/Pause Button in Copper Design with Loading Spinner */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0a232c] border-2 border-[#c79b78] flex items-center justify-center shrink-0 shadow-lg transition active:scale-95 group disabled:opacity-75"
            title={isLoading ? 'Audio wird geladen...' : isPlaying ? 'Audio pausieren' : 'Audio abspielen'}
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 text-[#c79b78] animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 text-[#c79b78] fill-[#c79b78]" />
            ) : (
              <Play className="w-5 h-5 text-[#c79b78] fill-[#c79b78] ml-0.5" />
            )}
          </button>

          {/* Info & Animated Waveform */}
          <div className="flex-1 w-full space-y-1.5 min-w-0">
            <div className="flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                <Music className="w-3.5 h-3.5 text-[#c79b78] shrink-0" />
                <div className="overflow-hidden whitespace-nowrap min-w-0 flex-1 relative [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]">
                  <div className="animate-marquee inline-flex items-center gap-6 font-serif-serif font-bold text-[#ebd8c8]">
                    <span>{storyTitle}</span>
                    <span className="text-[#c79b78]/60 text-[10px]">✦</span>
                    <span>{storyTitle}</span>
                    <span className="text-[#c79b78]/60 text-[10px]">✦</span>
                  </div>
                </div>
              </div>
              <span className="text-white/70 font-mono text-[11px] shrink-0">
                {isLoading ? 'Lädt...' : `${formatTime(currentTime)} / ${formatTime(duration || 180)}`}
              </span>
            </div>

            {/* Ambient Sound Wave Bar (Non-clickable) */}
            <div className="flex items-center justify-between h-7 px-2 bg-[#0a232c] rounded-lg border border-[#c79b78]/30 gap-1 overflow-hidden pointer-events-none select-none">
              {Array.from({ length: 28 }).map((_, i) => {
                const heights = [35, 65, 45, 80, 50, 75, 90, 40, 70, 85, 30, 75, 55, 80, 45, 60];
                const h = heights[i % heights.length];
                const progressPercent = (duration || 180) > 0 ? (currentTime / (duration || 180)) : 0;
                const isPassed = (i / 28) <= progressPercent;

                return (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 pointer-events-none ${
                      isPlaying
                        ? 'bg-gradient-to-t from-[#c79b78] to-[#ebd8c8] animate-pulse'
                        : isPassed
                        ? 'bg-[#c79b78]'
                        : 'bg-white/20'
                    }`}
                    style={{
                      height: isPlaying ? `${Math.max(15, (h * (Math.sin(i + currentTime) + 1.5)) / 2.5)}%` : `${h * 0.35}%`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                );
              })}
            </div>

            {/* Schieberegler zum Vor- und Zurückspulen */}
            <div className="pt-0.5 flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={duration && duration > 0 ? duration : 180}
                step={0.1}
                value={currentTime}
                onChange={(e) => {
                  const newTime = Number(e.target.value);
                  const audio = audioRef.current;
                  if (audio) {
                    audio.currentTime = newTime;
                    setCurrentTime(newTime);
                  }
                }}
                title="Schieberegler zum Spulen"
                className="w-full h-1.5 sm:h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#c79b78] focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <p className="leading-relaxed">
          <Sun className="w-4 h-4 text-[#ffe89c] inline-block mr-2 align-middle shrink-0" />
          <strong className="font-semibold text-white">Die Sonne</strong> strahlt in ihrer ganz eigenen, schönen Wildheit. Sie spendet Wärme, erhellt den Tag und schenkt dem Leben seine bunten Farben.
        </p>

        <div className={`space-y-6 transition-all duration-700 overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
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

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-[#dfba61] hover:text-[#ebd8c8] transition-all text-sm font-bold uppercase tracking-[0.15em] mt-4 group"
        >
          <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-[#dfba61]/10 border border-[#dfba61]/30 group-hover:bg-[#dfba61]/20 group-hover:scale-110 transition-all ${isExpanded ? 'rotate-45' : ''}`}>
            <Plus className="w-4 h-4" />
          </div>
          <span>{isExpanded ? 'Weniger lesen' : 'Mehr lesen'}</span>
        </button>

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

    </div>
  );
};
