import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music, RefreshCw, Volume2, Plus, Heart, Sparkles } from 'lucide-react';

const GUIDED_MEDITATIONS = [
  { title: 'Kopf abschalten und erholen – Geführte Meditation', url: '/m1.mp3' },
  { title: 'Inneren Kritiker abstellen – Geführte Meditation', url: '/m2.mp3' },
  { title: 'Gedankenkarussell und inneren Kritiker beruhigen – Selbstmitgefühl', url: '/m3.mp3' },
  { title: 'Gedanken und Grübeln loslassen – Tief entspannen', url: '/m4.mp3' },
  { title: 'Aufgebrachte Emotionen wie Wut, Angst und Panik schnell beruhigen', url: '/m5.mp3' },
  { title: 'Angst sofort loslassen – Geführte Meditation', url: '/m6.mp3' },
  { title: 'Limitierende Glaubenssätze auflösen – Geführte Meditation', url: '/m7.mp3' },
  { title: 'Unsicherheit & Angst loslassen – Ideales Selbst werden', url: '/m8.mp3' },
  { title: 'Dankbarkeit kultivieren – Geführte Meditation', url: '/m9.mp3' },
  { title: 'Dankbarkeit und positives Denken – Geführte Meditation', url: '/m10.mp3' }
];

const TANTRA_MEDITATIONS = [
  { title: 'Tantra Meditation für Paare – Achtsam begegnen', url: '/tantra.mp3', type: 'audio' as const },
  { title: 'Entspannende Tantra - Meditationsmusik für tiefe Liebe und Verbundenheit', videoId: 'pg52OPw7uhw', type: 'youtube' as const }
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

    audio.src = audioUrl;
    audio.preload = 'auto';

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
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handleError = () => {
      console.warn('Audio playback info:', title, audio?.error);
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
    audio.addEventListener('canplay', handleLoaded);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    window.addEventListener('app-audio-play', handleGlobalPause);

    if (audio.readyState >= 1 && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('durationchange', handleLoaded);
      audio.removeEventListener('canplay', handleLoaded);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
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
      setIsLoading(false);
    } else {
      window.dispatchEvent(new CustomEvent('app-audio-play', { detail: { id: audioUrl } }));
      setIsLoading(true);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch((err) => {
            console.warn('Playback notice:', err);
            setIsLoading(false);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    audio.currentTime = percentage * duration;
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) : 0;

  return (
    <div className="bg-[#071920]/90 border-2 border-[#c79b78]/70 rounded-2xl p-3.5 sm:p-5 shadow-xl backdrop-blur-md flex flex-row items-center gap-3.5 sm:gap-4 relative overflow-hidden">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
      />

      <button
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0a232c] border-2 border-[#c79b78] flex items-center justify-center shrink-0 shadow-lg transition active:scale-95 group cursor-pointer"
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
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            <Music className="w-3.5 h-3.5 text-[#c79b78] shrink-0" />
            <div className="overflow-hidden whitespace-nowrap min-w-0 flex-1 relative [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]">
              <div className="animate-marquee inline-flex items-center gap-6 font-serif-serif font-bold text-[#ebd8c8]">
                <span>{title}</span>
                <span className="text-[#c79b78]/60 text-[10px]">✦</span>
                <span>{title}</span>
                <span className="text-[#c79b78]/60 text-[10px]">✦</span>
              </div>
            </div>
          </div>
          <span className="text-white/70 font-mono text-[11px] shrink-0">
            {isLoading ? 'Lädt...' : duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : '0:00'}
          </span>
        </div>

        <div
          onClick={handleSeek}
          onTouchStart={handleSeek}
          title="Klicken oder tippen zum Spulen"
          className="flex items-center justify-between h-7 px-2 bg-[#0a232c] rounded-lg border border-[#c79b78]/30 hover:border-[#c79b78]/70 gap-1 overflow-hidden cursor-pointer transition touch-action-none select-none"
        >
          {Array.from({ length: 28 }).map((_, i) => {
            const heights = [35, 65, 45, 80, 50, 75, 90, 40, 70, 85, 30, 75, 55, 80, 45, 60];
            const h = heights[i % heights.length];
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
      </div>
    </div>
  );
};



// Dedicated Bulletproof MP3 Player for Tantra Meditation für Paare
export const TantraMp3Player: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1420);
  const audioId = '/tantra.mp3';
  const title = 'Tantra Meditation für Paare – Achtsam begegnen';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handleWaiting = () => setIsLoading(true);

    const handleGlobalPause = (e: any) => {
      if (e.detail?.id !== audioId && !audio.paused) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('durationchange', handleLoaded);
    audio.addEventListener('canplay', handleLoaded);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    window.addEventListener('app-audio-play', handleGlobalPause);

    if (audio.readyState >= 1 && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('durationchange', handleLoaded);
      audio.removeEventListener('canplay', handleLoaded);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      window.removeEventListener('app-audio-play', handleGlobalPause);
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
      window.dispatchEvent(new CustomEvent('app-audio-play', { detail: { id: audioId } }));
      setIsLoading(true);

      audio.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn('Tantra playback error:', err);
          setIsLoading(false);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    audio.currentTime = percentage * duration;
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) : 0;

  return (
    <div className="bg-[#071920]/90 border-2 border-[#c79b78]/70 rounded-2xl p-3.5 sm:p-5 shadow-xl backdrop-blur-md flex flex-row items-center gap-3.5 sm:gap-4 relative overflow-hidden">
      <audio ref={audioRef} preload="auto">
        <source src="/tantra.mp3" type="audio/mpeg" />
        <source src="https://www.dropbox.com/scl/fi/652184vftb1n2knn2u1ux/Tantra-Meditation-f-r-Paare-l-Achtsam-begegnen.mp3?rlkey=1846dow3yff8my65oj67kliw1&st=u3naaeif&dl=1" type="audio/mpeg" />
      </audio>

      <button
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0a232c] border-2 border-[#c79b78] flex items-center justify-center shrink-0 shadow-lg transition active:scale-95 group cursor-pointer"
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
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            <Music className="w-3.5 h-3.5 text-[#c79b78] shrink-0" />
            <div className="overflow-hidden whitespace-nowrap min-w-0 flex-1 relative [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]">
              <div className="animate-marquee inline-flex items-center gap-6 font-serif-serif font-bold text-[#ebd8c8]">
                <span>{title}</span>
                <span className="text-[#c79b78]/60 text-[10px]">✦</span>
                <span>{title}</span>
                <span className="text-[#c79b78]/60 text-[10px]">✦</span>
              </div>
            </div>
          </div>
          <span className="text-white/70 font-mono text-[11px] shrink-0">
            {isLoading ? 'Lädt...' : duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : '0:00'}
          </span>
        </div>

        <div
          onClick={handleSeek}
          onTouchStart={handleSeek}
          title="Klicken oder tippen zum Spulen"
          className="flex items-center justify-between h-7 px-2 bg-[#0a232c] rounded-lg border border-[#c79b78]/30 hover:border-[#c79b78]/70 gap-1 overflow-hidden cursor-pointer transition touch-action-none select-none"
        >
          {Array.from({ length: 28 }).map((_, i) => {
            const heights = [35, 65, 45, 80, 50, 75, 90, 40, 70, 85, 30, 75, 55, 80, 45, 60];
            const h = heights[i % heights.length];
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
      </div>
    </div>
  );
};

// Reusable Pure Audio Player for YouTube Streams (No Video Display)
export interface YouTubeAudioPlayerProps {
  title: string;
  videoId: string;
}

export const YouTubeAudioPlayer: React.FC<YouTubeAudioPlayerProps> = ({ title, videoId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const totalDuration = 600; // Estimated 10 min default for YouTube stream
  const audioId = `youtube-${videoId}`;

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      window.dispatchEvent(new CustomEvent('app-audio-play', { detail: { id: audioId } }));
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setElapsedTime((prev) => (prev >= totalDuration ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    const handleGlobalPause = (e: any) => {
      if (e.detail?.id !== audioId) {
        setIsPlaying(false);
      }
    };
    window.addEventListener('app-audio-play', handleGlobalPause);
    return () => window.removeEventListener('app-audio-play', handleGlobalPause);
  }, [audioId]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    setElapsedTime(Math.floor(percentage * totalDuration));
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (elapsedTime / totalDuration) : 0;

  return (
    <div className="bg-[#071920]/90 border-2 border-[#c79b78]/70 rounded-2xl p-3.5 sm:p-5 shadow-xl backdrop-blur-md flex flex-row items-center gap-3.5 sm:gap-4 relative overflow-hidden">
      {/* Hidden YouTube audio iframe engine */}
      {isPlaying && (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&playsinline=1&start=${elapsedTime}`}
          title={title}
          className="w-px h-px opacity-0 pointer-events-none absolute top-0 left-0"
          allow="autoplay; encrypted-media"
        />
      )}

      <button
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0a232c] border-2 border-[#c79b78] flex items-center justify-center shrink-0 shadow-lg transition active:scale-95 group cursor-pointer"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-[#c79b78] fill-[#c79b78]" />
        ) : (
          <Play className="w-5 h-5 text-[#c79b78] fill-[#c79b78] ml-0.5" />
        )}
      </button>

      <div className="flex-1 w-full space-y-1.5 min-w-0">
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            <Music className="w-3.5 h-3.5 text-[#c79b78] shrink-0" />
            <div className="overflow-hidden whitespace-nowrap min-w-0 flex-1 relative [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]">
              <div className="animate-marquee inline-flex items-center gap-6 font-serif-serif font-bold text-[#ebd8c8]">
                <span>{title}</span>
                <span className="text-[#c79b78]/60 text-[10px]">✦</span>
                <span>{title}</span>
                <span className="text-[#c79b78]/60 text-[10px]">✦</span>
              </div>
            </div>
          </div>
          <span className="text-white/70 font-mono text-[11px] shrink-0">
            {formatTime(elapsedTime)} / {formatTime(totalDuration)}
          </span>
        </div>

        <div
          onClick={handleSeek}
          onTouchStart={handleSeek}
          title="Klicken oder tippen zum Spulen"
          className="flex items-center justify-between h-7 px-2 bg-[#0a232c] rounded-lg border border-[#c79b78]/30 hover:border-[#c79b78]/70 gap-1 overflow-hidden cursor-pointer transition touch-action-none select-none"
        >
          {Array.from({ length: 28 }).map((_, i) => {
            const heights = [35, 65, 45, 80, 50, 75, 90, 40, 70, 85, 30, 75, 55, 80, 45, 60];
            const h = heights[i % heights.length];
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
                  height: isPlaying ? `${Math.max(15, (h * (Math.sin(i + elapsedTime) + 1.5)) / 2.5)}%` : `${h * 0.35}%`,
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
  const [isGuidedExpanded, setIsGuidedExpanded] = useState(false);

  const displayedGuided = isGuidedExpanded ? GUIDED_MEDITATIONS : GUIDED_MEDITATIONS.slice(0, 3);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 pb-24">
      {/* 1. Geführte Meditationen Container */}
      <div className="space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Geführte Meditationen
          </h2>
          <p className="text-sm text-white/80 max-w-md mx-auto">
            Tauche ein in die Stille und finde innere Ruhe und neue Kraft.
          </p>
        </div>

        <div className="space-y-6">
          {displayedGuided.map((med, idx) => (
            <MeditationPlayer key={idx} title={med.title} audioUrl={med.url} />
          ))}
        </div>

        {GUIDED_MEDITATIONS.length > 3 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setIsGuidedExpanded(!isGuidedExpanded)}
              className="flex items-center gap-3 text-[#dfba61] hover:text-[#ebd8c8] transition-all text-sm font-bold uppercase tracking-[0.15em] group cursor-pointer"
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full bg-[#dfba61]/10 border border-[#dfba61]/30 group-hover:bg-[#dfba61]/20 group-hover:scale-110 transition-all ${
                  isGuidedExpanded ? 'rotate-45' : ''
                }`}
              >
                <Plus className="w-4 h-4 text-[#dfba61]" />
              </div>
              <span>{isGuidedExpanded ? 'Weniger hören' : 'Mehr hören'}</span>
            </button>
          </div>
        )}

        <div className="text-center pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/70">
          <Sparkles className="w-4 h-4 text-[#c79b78] shrink-0" />
          <span className="font-serif-serif italic text-[#ebd8c8]">Meditationen by Alexander Wahler</span>
        </div>
      </div>

      {/* 2. Tantra Meditation für Paare Container */}
      <div className="space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Tantra Meditation für Paare
          </h2>
          <p className="text-sm text-white/80 max-w-md mx-auto">
            Achtsam begegnen, tiefe Verbundenheit spüren und gemeinsame Ruhe finden.
          </p>
        </div>

        <div className="space-y-6">
          <TantraMp3Player />
          <YouTubeAudioPlayer title="Entspannende Tantra - Meditationsmusik für tiefe Liebe und Verbundenheit" videoId="pg52OPw7uhw" />
        </div>

        <div className="text-center pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/60">
          <Heart className="w-3.5 h-3.5 text-[#dfba61] fill-[#dfba61]" />
          <span>Ein geschützter Raum für Liebe, Vertrauen und echte Nähe.</span>
        </div>
      </div>
    </div>
  );
};
