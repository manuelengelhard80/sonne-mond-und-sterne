import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

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

// Simple Audio Player Component
interface AudioPlayerProps {
  title: string;
  audioUrl: string;
}

const MeditationPlayer: React.FC<AudioPlayerProps> = ({ title, audioUrl }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = audioUrl;
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  return (
    <div className="bg-[#071920] border border-[#dfba61]/30 rounded-xl p-4 text-white">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold truncate mr-2">{title}</span>
        <button onClick={togglePlay} className="p-2 bg-[#dfba61] rounded-full text-[#071920]">
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2">
        <button onClick={() => skip(-10)} className="text-xs text-white/70">−10s</button>
        <button onClick={() => skip(10)} className="text-xs text-white/70">+10s</button>
      </div>
    </div>
  );
};

// YouTube Audio Player
interface YouTubePlayerProps {
  title: string;
  videoId: string;
}

export const YouTubeAudioPlayer: React.FC<YouTubePlayerProps> = ({ title, videoId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  return (
    <div className="bg-[#071920] border border-[#dfba61]/30 rounded-xl p-4 text-white">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold truncate mr-2">{title}</span>
        <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-[#dfba61] rounded-full text-[#071920]">
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
      {isPlaying && (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          className="w-0 h-0"
          title={title}
        />
      )}
    </div>
  );
};

export const MeditationSpace: React.FC = () => {
  const [isGuidedOpen, setIsGuidedOpen] = useState(false);
  const [isTantraOpen, setIsTantraOpen] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24">
      {/* 1. Geführte Meditationen */}
      <div className="bg-[#0a232c] p-6 rounded-2xl border border-[#dfba61]">
        <button onClick={() => setIsGuidedOpen(!isGuidedOpen)} className="w-full text-left font-bold text-[#dfba61]">
          Geführte Meditationen {isGuidedOpen ? '▲' : '▼'}
        </button>
        {isGuidedOpen && (
          <div className="mt-4 space-y-4">
            {GUIDED_MEDITATIONS.map((m, i) => (
              <MeditationPlayer key={i} title={m.title} audioUrl={m.url} />
            ))}
          </div>
        )}
      </div>

      {/* 2. Tantra Meditation */}
      <div className="bg-[#0a232c] p-6 rounded-2xl border border-[#dfba61]">
        <button onClick={() => setIsTantraOpen(!isTantraOpen)} className="w-full text-left font-bold text-[#dfba61]">
          Tantra Meditation für Paare {isTantraOpen ? '▲' : '▼'}
        </button>
        {isTantraOpen && (
          <div className="mt-4 space-y-4">
             <MeditationPlayer title="Tantra Meditation für Paare" audioUrl="/tantra.mp3" />
             <YouTubeAudioPlayer title="Entspannende Tantra Musik" videoId="pg52OPw7uhw" />
          </div>
        )}
      </div>
    </div>
  );
};
