import React from 'react';
import { Feather } from 'lucide-react';
import { YouTubeAudioPlayer } from './MeditationSpace';

const TRAUMREISEN_PLAYERS = [
  {
    title: 'Der Weg zum Sternensee – Entspannende Traumreise',
    videoId: 'pg52OPw7uhw',
  },
  {
    title: 'Der Palast der Sonnenstrahlen – Sanfte Fantasiereise',
    videoId: 'pg52OPw7uhw',
  },
  {
    title: 'Flug auf der Sternschnuppe – Schwerelose Entspannung',
    videoId: 'pg52OPw7uhw',
  },
];

export const TraumreisenSpace: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 pb-24">
      {/* Traumreisen Container */}
      <div className="space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Traumreisen
          </h2>
          <p className="text-sm text-white/80 max-w-md mx-auto">
            Lass deine Gedanken auf sanften Schwingen davontragen. Schöne Traumwelten & Klänge für Herz und Seele.
          </p>
        </div>

        <div className="space-y-6">
          {TRAUMREISEN_PLAYERS.map((item, idx) => (
            <YouTubeAudioPlayer key={idx} title={item.title} videoId={item.videoId} />
          ))}
        </div>

        <div className="text-center pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/70">
          <Feather className="w-4 h-4 text-[#c79b78] shrink-0" />
          <span>Gönne dir diese friedliche Auszeit voller Fantasie und tiefer Geborgenheit.</span>
        </div>
      </div>
    </div>
  );
};
