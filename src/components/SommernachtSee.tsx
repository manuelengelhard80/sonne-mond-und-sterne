import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Sun, Moon, Play, Pause, Music, RefreshCw, Heart, Plus, Check, Send } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { sendSommernachtAmSeeInvite } from '../services/notificationService';

export const SommernachtSee: React.FC = () => {
  const { role } = useUserRole();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [inviteSent, setInviteSent] = useState(false);

  const handleSendInvite = async () => {
    await sendSommernachtAmSeeInvite(role);
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 4000);
  };

  // Set audio src directly to local static asset for 100% reliable online & mobile playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = '/maedchen.wav';
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
      window.dispatchEvent(new CustomEvent('app-audio-play', { detail: { id: '/maedchen.wav' } }));
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
  const storyTitle = 'Das Mädchen vom See';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      {/* Story Content Box */}
      <div className="bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-white/90 font-serif-serif text-base sm:text-lg leading-relaxed relative overflow-hidden">
        
        {/* Subtle background glow accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#dfba61]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Story Title inside container above player */}
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Das Mädchen vom See
          </h2>
        </div>

        {/* Audio Player Card */}
        <div className="bg-[#071920]/90 border-2 border-[#c79b78]/70 rounded-2xl p-3.5 sm:p-5 shadow-xl backdrop-blur-md flex flex-row items-center gap-3.5 sm:gap-4 relative overflow-hidden mb-6">
          <audio
            ref={audioRef}
            src="/maedchen.wav"
            preload="auto"
          />

          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0a232c] border-2 border-[#c79b78] flex items-center justify-center shrink-0 shadow-lg transition active:scale-95 group disabled:opacity-75"
            title={isLoading ? 'Laden...' : isPlaying ? 'Pause' : 'Play'}
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
                    <span>{storyTitle}</span>
                    <span className="text-[#c79b78]/60 text-[10px]">✦</span>
                    <span>{storyTitle}</span>
                    <span className="text-[#c79b78]/60 text-[10px]">✦</span>
                  </div>
                </div>
              </div>
              <span className="text-white/70 font-mono text-[11px] shrink-0">
                {isLoading ? 'Lädt...' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
              </span>
            </div>

            {/* Ambient Sound Wave Bar (Non-clickable) */}
            <div className="flex items-center justify-between h-7 px-2 bg-[#0a232c] rounded-lg border border-[#c79b78]/30 gap-1 overflow-hidden pointer-events-none select-none">
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
          Es gibt Begegnungen im Leben, in denen Raum und Zeit verschmelzen und ein magischer Augenblick entsteht, der alles überdauert.
        </p>

        <div className={`space-y-6 transition-all duration-700 overflow-hidden ${isExpanded ? 'max-h-[1500px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
          <p className="leading-relaxed pt-3">
            Es war in jener Sommernacht, damals vor so vielen Jahren. 
            Ein leises Absetzen, ein heimliches Entkommen und ein Zusammengehen, 
            Schritt für Schritt, bei dem die Welt um uns herum versank. 
            Die Zeit stand still – nur der Moment, in dem wir einander in die Augen sahen. Ein Blick, der zwei Herzen berührte, ein Verlieben von einer Reinheit 
            und Intensität, wie wir sie beide nie zuvor gekannt hatten. 
            Es war, als ob zwei Seelen sich nach langer Reise endlich wiedererkannten.
          </p>

          <p className="leading-relaxed pt-3">
            Der See war nicht immer von sanften Wellen getragen, und manchmal 
            lagen Steine am Ufer, doch ebenso oft fing das Wasser das warme Licht ein. Durch all das hindurch trug uns eine Verbindung, die stärker ist als jede Zeit 
            und die das Leben niemals zu trennen wagte.
          </p>

          <p className="leading-relaxed pt-3">
            Wenn ich heute die Augen schließe, kann ich sie sehen, riechen und spüren: 
            Das Mädchen vom See. Und wenn ich sie wieder öffne, 
            blicke ich in deine Augen – in die Augen der wundervollen Frau, 
            die du geworden bist, mit jedem Tag und mit jedem Jahr nur noch schöner, 
            von innen und von außen, in deinem ganzen Wesen.
          </p>

          <p className="leading-relaxed pt-3">
            Mein Herz war von dieser ersten Sommernacht an vergeben. 
            Es gehört dir, nur dir – gestern, heute, morgen und für alle Zeit.
          </p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-[#dfba61] hover:text-[#ebd8c8] transition-all text-sm font-bold uppercase tracking-[0.15em] mt-4 group cursor-pointer"
        >
          <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-[#dfba61]/10 border border-[#dfba61]/30 group-hover:bg-[#dfba61]/20 group-hover:scale-110 transition-all ${isExpanded ? 'rotate-45' : ''}`}>
            <Plus className="w-4 h-4 text-[#dfba61]" />
          </div>
          <span>{isExpanded ? 'Weniger lesen' : 'Mehr lesen'}</span>
        </button>

      </div>

      {/* Second Container: Sommernacht am See MP3 Player & Invite */}
      <SommernachtAudioSection />

    </div>
  );
};

// Dedicated Component for Sommernacht am See Second Container
const SommernachtAudioSection: React.FC = () => {
  const { role } = useUserRole();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [inviteSent, setInviteSent] = useState(false);

  const audioUrl = 'https://www.dropbox.com/scl/fi/3blqcm5qsovy03jojlvwe/Sommernacht-am-See.mp3?rlkey=yayzj7dt7kbg0ig6jwby3nbeh&st=a5ut4zse&raw=1';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src || audio.src === '' || audio.src === window.location.href) {
      audio.src = audioUrl;
    }

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

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('canplay', () => setIsLoading(false));
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    const handleGlobalPause = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.id !== audioUrl) {
        audio.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('app-audio-play', handleGlobalPause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
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
      window.dispatchEvent(new CustomEvent('app-audio-play', { detail: { id: audioUrl } }));
      setIsPlaying(true);
      audio.play().then(() => {
        setIsLoading(false);
      }).catch((err) => {
        console.warn('Sommernacht audio play notice:', err);
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

  const progressPercent = duration > 0 ? (currentTime / duration) : 0;

  const handleSendInvite = async () => {
    await sendSommernachtAmSeeInvite(role);
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 4000);
  };

  return (
    <div className="bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-white/90 font-serif-serif text-base sm:text-lg leading-relaxed relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#dfba61]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center space-y-2">
        <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
          Sommernacht am See
        </h2>
        <p className="text-sm text-white/80 max-w-md mx-auto font-sans">
          Kehre zurück an den Ort an dem alles begann.
        </p>
      </div>

      {/* MP3 Player Card */}
      <div className="bg-[#071920]/90 border-2 border-[#c79b78]/70 rounded-2xl p-3.5 sm:p-5 shadow-xl backdrop-blur-md flex flex-row items-center gap-3.5 sm:gap-4 relative overflow-hidden">
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
        />

        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0a232c] border-2 border-[#c79b78] flex items-center justify-center shrink-0 shadow-lg transition active:scale-95 group disabled:opacity-75 cursor-pointer"
          title={isLoading ? 'Laden...' : isPlaying ? 'Pause' : 'Play'}
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
                  <span>Sommernacht am See – Entspannende Klänge</span>
                  <span className="text-[#c79b78]/60 text-[10px]">✦</span>
                  <span>Sommernacht am See – Entspannende Klänge</span>
                  <span className="text-[#c79b78]/60 text-[10px]">✦</span>
                </div>
              </div>
            </div>
            <span className="text-white/70 font-mono text-[11px] shrink-0">
              {isLoading ? 'Lädt...' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
            </span>
          </div>

          <div className="flex items-center justify-between h-7 px-2 bg-[#0a232c] rounded-lg border border-[#c79b78]/30 gap-1 overflow-hidden pointer-events-none select-none">
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

      <div className="flex flex-col items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleSendInvite}
          className="px-4 py-2.5 rounded-xl bg-[#071920] border-2 border-[#c79b78] hover:border-[#dfba61] text-[#ebd8c8] hover:text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4 text-[#c79b78]" />
          <span>Zu einer Sommernacht am See einladen</span>
        </button>
        {inviteSent && (
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
            <Check className="w-3.5 h-3.5" /> Einladung wurde gesendet & im Log vermerkt!
          </span>
        )}
      </div>
    </div>
  );
};
