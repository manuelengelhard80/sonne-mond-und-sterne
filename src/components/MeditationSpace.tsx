import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music, RefreshCw, Plus, Heart, Compass, Send, Check } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { sendGuidedMeditationInvite, sendCouplesMeditationInvite } from '../services/notificationService';

const GUIDED_MEDITATIONS = [
  { title: 'Kopf abschalten und erholen – Geführte Meditation', url: 'https://www.dropbox.com/scl/fi/4s4d7cnjv6mho9qng0gwv/Kopf-abschalten-und-erholen-Gef-hrte-Meditation.mp3?rlkey=tngbaqkwuh9z1cbna7wq0nqtz&st=sen68u0y&raw=1' },
  { title: 'Inneren Kritiker abstellen – Geführte Meditation', url: 'https://www.dropbox.com/scl/fi/cui7t8fhw5tq1mr3tt0ia/Inneren-Kritiker-abstellen-Gef-hrte-Meditation.mp3?rlkey=wot8xbxl1vzrerjqhnnutd2fx&st=ppm7rgym&raw=1' },
  { title: 'Gedankenkarussell und inneren Kritiker beruhigen – Selbstmitgefühl', url: 'https://www.dropbox.com/scl/fi/6e3d4cdei92jpmej4pgj4/Gedankenkarussell-und-inneren-Kritiker-beruhigen-Gef-hrte-Meditation-f-r-Selbstmitgef-hl.mp3?rlkey=a0vw9qm7n6pfsavr1nk0c2q9r&st=ezepuz22&raw=1' },
  { title: 'Gedanken und Grübeln loslassen – Tief entspannen', url: 'https://www.dropbox.com/scl/fi/dy4ubv7vrbgmiyhq6vu3y/Gedanken-und-Gr-beln-loslassen-und-tief-entspannen-Gef-hrte-Meditation.mp3?rlkey=vlmpteuf64u1pc76zh7vhxj8t&st=m8970x69&raw=1' },
  { title: 'Aufgebrachte Emotionen wie Wut, Angst und Panik schnell beruhigen', url: 'https://www.dropbox.com/scl/fi/0c8mbhyvetift6v6lyr7r/Aufgebrachte-Emotionen-wie-Wut-Angst-und-Panik-schnell-beruhigen-Gef-hrte-Meditation.mp3?rlkey=pgju0b0j2trla324d3nb8m71q&st=i9qaa3ii&raw=1' },
  { title: 'Angst sofort loslassen – Geführte Meditation', url: 'https://www.dropbox.com/scl/fi/h7bj642bto35z8oy3yqbw/Angst-sofort-loslassen-Gef-hrte-Meditation.mp3?rlkey=j6xi6lfxlvjdogkeqly3b9c1a&st=w8nxqiaf&raw=1' },
  { title: 'Limitierende Glaubenssätze auflösen – Geführte Meditation', url: 'https://www.dropbox.com/scl/fi/xwcl20vry3ns26r633ctm/Limitierende-Glaubenss-tze-aufl-sen-Gef-hrte-Meditation-f-r-Unternehmer.mp3?rlkey=veeg9y1rvmmnivbia0dmz0en6&st=a7blqkdp&raw=1' },
  { title: 'Unsicherheit & Angst loslassen – Ideales Selbst werden', url: 'https://www.dropbox.com/scl/fi/j1sd0nztu6jkgj6u4texb/Unsicherheit-Angst-loslassen-Ideales-Selbst-werden-Gef-hrte-Meditation-m-chtig.mp3?rlkey=22qgwyap5ab02h84tqjg0zry9&st=mwdhmkbz&raw=1' },
  { title: 'Angst sofort loslassen – Geführte Meditation (Variante)', url: 'https://www.dropbox.com/scl/fi/h7bj642bto35z8oy3yqbw/Angst-sofort-loslassen-Gef-hrte-Meditation.mp3?rlkey=j6xi6lfxlvjdogkeqly3b9c1a&st=kq5j4jrl&raw=1' },
  { title: 'Dankbarkeit kultivieren – Geführte Meditation', url: 'https://www.dropbox.com/scl/fi/zbriw8z7doqubrqdlxm5d/Dankbarkeit-kultivieren-Gef-hrte-Meditation.mp3?rlkey=h2letglb94sn94itn3wdicoyc&st=xjbbel31&raw=1' },
  { title: 'Dankbarkeit und positives Denken – Geführte Meditation', url: 'https://www.dropbox.com/scl/fi/9yquorywt76qcr7gg9ioo/Dankbarkeit-und-positives-Denken-Gef-hrte-Meditation.mp3?rlkey=osdgj0f851zxpos2t1lx9eukb&st=1gh9er2j&raw=1' }
];

const TANTRA_MEDITATIONS = [
  { title: 'Tantra Meditation für Paare – Achtsam begegnen', url: 'https://www.dropbox.com/scl/fi/652184vftb1n2knn2u1ux/Tantra-Meditation-f-r-Paare-l-Achtsam-begegnen.mp3?rlkey=1846dow3yff8my65oj67kliw1&st=u3naaeif&raw=1', type: 'audio' as const },
  { title: 'Entspannende Tantra - Meditationsmusik für tiefe Liebe und Verbundenheit', videoId: 'pg52OPw7uhw', type: 'youtube' as const }
];

const getValidAudioUrl = (url: string) => {
  if (!url) return '/m4.mp3';
  if (url.includes('dropbox.com')) {
    return url.replace('dl=0', 'raw=1').replace('dl=1', 'raw=1');
  }
  if (url === '/tantra.mp3') return '/tantra2.mp3';
  return url;
};

// Reusable Audio Player Component using instant playback & pre-buffering
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

  const initialUrl = getValidAudioUrl(audioUrl);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.src || audio.src === '' || audio.src === window.location.href) {
      audio.src = initialUrl;
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
    const handleError = () => {
      console.warn('Audio notice for:', title, audio.src);
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleGlobalPause = (e: any) => {
      if (e.detail?.id !== audioUrl && e.detail?.id !== initialUrl && !audio.paused) {
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
      audio.removeEventListener('canplay', () => setIsLoading(false));
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
      window.removeEventListener('app-audio-play', handleGlobalPause);
      audio.pause();
    };
  }, [audioUrl, initialUrl, title]);

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
        console.warn(`Instant play notice for ${title}:`, err);
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

  return (
    <div className="bg-[#071920]/90 border-2 border-[#c79b78]/70 rounded-2xl p-3.5 sm:p-5 shadow-xl backdrop-blur-md flex flex-row items-center gap-3.5 sm:gap-4 relative overflow-hidden">
      <audio
        ref={audioRef}
        src={initialUrl}
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

        {/* Waveform Visualization Bar (Non-clickable) */}
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
            max={duration && duration > 0 ? duration : 100}
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
  );
};

// Reusable Pure Audio Player for YouTube Streams (No Video Display) - Pre-mounted for instant playback
export interface YouTubeAudioPlayerProps {
  title: string;
  videoId: string;
}

export const YouTubeAudioPlayer: React.FC<YouTubeAudioPlayerProps> = ({ title, videoId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const audioId = `youtube-${videoId}`;

  const togglePlay = () => {
    const iframe = iframeRef.current;
    if (isPlaying) {
      setIsPlaying(false);
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
      }
    } else {
      window.dispatchEvent(new CustomEvent('app-audio-play', { detail: { id: audioId } }));
      setIsPlaying(true);
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
      }
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    const handleGlobalPause = (e: any) => {
      if (e.detail?.id !== audioId && isPlaying) {
        setIsPlaying(false);
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
        }
      }
    };
    window.addEventListener('app-audio-play', handleGlobalPause);
    return () => window.removeEventListener('app-audio-play', handleGlobalPause);
  }, [audioId, isPlaying]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-[#071920]/90 border-2 border-[#c79b78]/70 rounded-2xl p-3.5 sm:p-5 shadow-xl backdrop-blur-md flex flex-row items-center gap-3.5 sm:gap-4 relative overflow-hidden">
      {/* Hidden YouTube audio iframe engine - pre-mounted for instant playback */}
      <iframe
        ref={iframeRef}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&playsinline=1&controls=0`}
        title={title}
        className="w-px h-px opacity-0 pointer-events-none absolute top-0 left-0"
        allow="autoplay; encrypted-media"
      />

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
            {formatTime(elapsedTime)}
          </span>
        </div>

        {/* Waveform Visualization Bar (Non-clickable) */}
        <div className="flex items-center justify-between h-7 px-2 bg-[#0a232c] rounded-lg border border-[#c79b78]/30 gap-1 overflow-hidden pointer-events-none select-none">
          {Array.from({ length: 28 }).map((_, i) => {
            const heights = [35, 65, 45, 80, 50, 75, 90, 40, 70, 85, 30, 75, 55, 80, 45, 60];
            const h = heights[i % heights.length];

            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-300 pointer-events-none ${
                  isPlaying
                    ? 'bg-gradient-to-t from-[#c79b78] to-[#ebd8c8] animate-pulse'
                    : 'bg-white/20'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(15, (h * (Math.sin(i + 1) + 1.5)) / 2.5)}%` : `${h * 0.35}%`,
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
            max={3600}
            step={1}
            value={elapsedTime}
            onChange={(e) => {
              const newTime = Number(e.target.value);
              setElapsedTime(newTime);
              if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                  JSON.stringify({ event: 'command', func: 'seekTo', args: [newTime, true] }),
                  '*'
                );
              }
            }}
            title="Schieberegler zum Spulen"
            className="w-full h-1.5 sm:h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#c79b78] focus:outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export const MeditationSpace: React.FC = () => {
  const { role } = useUserRole();
  const [isGuidedExpanded, setIsGuidedExpanded] = useState(false);
  const [isTantraExpanded, setIsTantraExpanded] = useState(false);

  const [guidedInviteSent, setGuidedInviteSent] = useState(false);
  const [couplesInviteSent, setCouplesInviteSent] = useState(false);

  const handleGuidedInvite = async () => {
    await sendGuidedMeditationInvite(role);
    setGuidedInviteSent(true);
    setTimeout(() => setGuidedInviteSent(false), 4000);
  };

  const handleCouplesInvite = async () => {
    await sendCouplesMeditationInvite(role);
    setCouplesInviteSent(true);
    setTimeout(() => setCouplesInviteSent(false), 4000);
  };

  const displayedGuided = isGuidedExpanded ? GUIDED_MEDITATIONS : GUIDED_MEDITATIONS.slice(0, 3);
  const displayedTantra = isTantraExpanded ? TANTRA_MEDITATIONS : TANTRA_MEDITATIONS.slice(0, 3);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 pb-24">
      {/* 1. Geführte Meditationen Container */}
      <div className="space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Geführte Meditationen
          </h2>
          <p className="text-sm text-white/80 max-w-md mx-auto">
            Tauche ein in die Stille und finde innere<br />Ruhe und neue Kraft.
          </p>
        </div>

        <div className="space-y-6">
          {displayedGuided.map((med, idx) => (
            <MeditationPlayer key={idx} title={med.title} audioUrl={med.url} />
          ))}
        </div>

        {GUIDED_MEDITATIONS.length > 3 && (
          <div className="flex flex-col items-center gap-4 pt-2">
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

            {isGuidedExpanded && (
              <div className="flex flex-col items-center gap-2 pt-1 animate-fade-in">
                <button
                  onClick={handleGuidedInvite}
                  className="px-4 py-2.5 rounded-xl bg-[#071920] border-2 border-[#c79b78] hover:border-[#dfba61] text-[#ebd8c8] hover:text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#c79b78]" />
                  <span>Zu einer Geführten Meditation einladen</span>
                </button>
                {guidedInviteSent && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
                    <Check className="w-3.5 h-3.5" /> Einladung wurde gesendet & im Log vermerkt!
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-center pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/60">
          <Compass className="w-3.5 h-3.5 text-[#dfba61] shrink-0" />
          <span>Meditationen by Alexander Wahler</span>
        </div>
      </div>

      {/* 2. Tantra Meditation für Paare Container */}
      <div className="space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Tantra Meditationen<br />für Paare
          </h2>
          <p className="text-sm text-white/80 max-w-md mx-auto">
            Achtsam begegnen, tiefe Verbundenheit spüren und gemeinsame Ruhe finden.
          </p>
        </div>

        <div className="space-y-6">
          {displayedTantra.map((med, idx) => (
            med.type === 'youtube' ? (
              <YouTubeAudioPlayer key={idx} title={med.title} videoId={med.videoId!} />
            ) : (
              <MeditationPlayer key={idx} title={med.title} audioUrl={med.url!} />
            )
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 pt-2">
          {TANTRA_MEDITATIONS.length > 3 && (
            <button
              onClick={() => setIsTantraExpanded(!isTantraExpanded)}
              className="flex items-center gap-3 text-[#dfba61] hover:text-[#ebd8c8] transition-all text-sm font-bold uppercase tracking-[0.15em] group cursor-pointer"
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full bg-[#dfba61]/10 border border-[#dfba61]/30 group-hover:bg-[#dfba61]/20 group-hover:scale-110 transition-all ${
                  isTantraExpanded ? 'rotate-45' : ''
                }`}
              >
                <Plus className="w-4 h-4 text-[#dfba61]" />
              </div>
              <span>{isTantraExpanded ? 'Weniger hören' : 'Mehr hören'}</span>
            </button>
          )}

          {/* Invitation button visible under Mehr hören or in section */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <button
              onClick={handleCouplesInvite}
              className="px-4 py-2.5 rounded-xl bg-[#071920] border-2 border-[#c79b78] hover:border-[#dfba61] text-[#ebd8c8] hover:text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#c79b78]" />
              <span>Zu einer Paar-Meditation einladen</span>
            </button>
            {couplesInviteSent && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" /> Einladung wurde gesendet & im Log vermerkt!
              </span>
            )}
          </div>
        </div>

        <div className="text-center pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/60">
          <Heart className="w-3.5 h-3.5 text-[#dfba61] fill-[#dfba61] shrink-0" />
          <span>Ein geschützter Raum für Liebe,<br />Vertrauen und echte Nähe.</span>
        </div>
      </div>
    </div>
  );
};

