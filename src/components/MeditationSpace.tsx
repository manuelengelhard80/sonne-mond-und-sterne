import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music, RefreshCw, Volume2 } from 'lucide-react';

const MEDITATION_FILES = [
  { title: 'Tantra Meditation für Paare – Achtsam begegnen', url: '/tantra.mp3' },
  { title: 'Kopf abschalten und erholen', url: '/m1.mp3' },
  { title: 'Inneren Kritiker abstellen', url: '/m2.mp3' },
  { title: 'Gedankenkarussell beruhigen', url: '/m3.mp3' },
  { title: 'Gedanken und Grübeln loslassen', url: '/m4.mp3' },
  { title: 'Emotionen schnell beruhigen', url: '/m5.mp3' },
  { title: 'Angst sofort loslassen', url: '/m6.mp3' },
  { title: 'Limitierende Glaubenssätze auflösen', url: '/m7.mp3' },
  { title: 'Unsicherheit loslassen & Ideales Selbst', url: '/m8.mp3' },
  { title: 'Angst auflösen (Fassung 2)', url: '/m6.mp3' },
  { title: 'Dankbarkeit kultivieren', url: '/m9.mp3' },
  { title: 'Dankbarkeit & Positives Denken', url: '/m10.mp3' }
];

// Reusable Audio Player Component
interface AudioPlayerProps {
  title: string;
  audioUrl: string;
}

const MeditationPlayer: React.FC<AudioPlayerProps> = ({ title, audioUrl }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Direct assignment and load metadata
    audio.src = audioUrl;
    audio.load();

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleLoaded = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
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
    const handleError = () => {
      console.warn('Audio playback info:', title, audio.error);
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleGlobalPause = (e: any) => {
      if (e.detail?.id !== audioUrl && !audio.paused) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('durationchange', handleLoaded);
    audio.addEventListener('canplay', () => setIsLoading(false));
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);
    window.addEventListener('app-audio-play', handleGlobalPause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('durationchange', handleLoaded);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
      window.removeEventListener('app-audio-play', handleGlobalPause);
      audio.pause();
    };
  }, [audioUrl, title]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      window.dispatchEvent(new CustomEvent('app-audio-play', { detail: { id: audioUrl } }));
      setIsLoading(true);
      if (!audio.src || !audio.src.includes(audioUrl)) {
        audio.src = audioUrl;
        audio.load();
      }
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
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-[#071920]/90 border-2 border-[#c79b78]/70 rounded-2xl p-3.5 sm:p-5 shadow-xl backdrop-blur-md flex flex-row items-center gap-3.5 sm:gap-4 relative overflow-hidden">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata" 
      />

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
            {isLoading ? 'Lädt...' : duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : '0:00'}
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
  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 pb-24">
      {/* Geführte Meditationen */}
      <div className="space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Geführte Meditationen
          </h2>
          <p className="text-sm text-white/80 max-w-md mx-auto">
            Tauche ein in die Stille und finde neue Kraft.
          </p>
        </div>

        <div className="space-y-6">
          {MEDITATION_FILES.map((med, idx) => (
            <MeditationPlayer key={idx} title={med.title} audioUrl={med.url} />
          ))}
        </div>

        <div className="text-center pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/60">
          <Volume2 className="w-3.5 h-3.5 text-[#dfba61]" />
          <span>Schenke dir diese Zeit der Ruhe und Geborgenheit.</span>
        </div>
      </div>
    </div>
  );
};
