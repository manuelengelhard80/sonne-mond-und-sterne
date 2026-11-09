import React, { useState } from 'react';
import { Feather, Plus, Send, Check } from 'lucide-react';
import { YouTubeAudioPlayer } from './MeditationSpace';
import { useUserRole } from '../context/UserRoleContext';
import { sendDreamJourneyInvite } from '../services/notificationService';

const TRAUMREISEN_PLAYERS = [
  {
    title: 'Die Geschichte hinter den Sternen – Wunderschöne Traumreise',
    videoId: 'toTPLH_Wk6o',
  },
  {
    title: 'Zeitreise ins alte Ägypten – Wunderschöne Traumreise',
    videoId: 'lttWcmaYieQ',
  },
  {
    title: 'Der Verborgene Garten – Wunderschöne Traumreise',
    videoId: '4zoLSA6HssU',
  },
  {
    title: 'Die Tropeninsel – Wunderschöne Traumreise',
    videoId: 'mRSTDfp4KYU',
  },
  {
    title: 'Paradiesische Lavendelfelder – Wunderschöne Traumreise',
    videoId: '7WbLpGuahbU',
  },
];

export const TraumreisenSpace: React.FC = () => {
  const { role } = useUserRole();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const handleInvite = async () => {
    await sendDreamJourneyInvite(role);
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 4000);
  };

  const displayedPlayers = isExpanded ? TRAUMREISEN_PLAYERS : TRAUMREISEN_PLAYERS.slice(0, 3);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 pb-24">
      {/* Traumreisen Container */}
      <div className="space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Traumreisen
          </h2>
          <p className="text-sm text-white/80 max-w-md mx-auto">
            Schöne Traumwelten & Klänge<br />für Herz und Seele.
          </p>
        </div>

        <div className="space-y-6">
          {displayedPlayers.map((item, idx) => (
            <YouTubeAudioPlayer key={idx} title={item.title} videoId={item.videoId} />
          ))}
        </div>

        {TRAUMREISEN_PLAYERS.length > 3 && (
          <div className="flex flex-col items-center gap-4 pt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-3 text-[#dfba61] hover:text-[#ebd8c8] transition-all text-sm font-bold uppercase tracking-[0.15em] group cursor-pointer"
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full bg-[#dfba61]/10 border border-[#dfba61]/30 group-hover:bg-[#dfba61]/20 group-hover:scale-110 transition-all ${
                  isExpanded ? 'rotate-45' : ''
                }`}
              >
                <Plus className="w-4 h-4 text-[#dfba61]" />
              </div>
              <span>{isExpanded ? 'Weniger hören' : 'Mehr hören'}</span>
            </button>

            {isExpanded && (
              <div className="flex flex-col items-center gap-2 pt-1 animate-fade-in">
                <button
                  onClick={handleInvite}
                  className="px-4 py-2.5 rounded-xl bg-[#071920] border-2 border-[#c79b78] hover:border-[#dfba61] text-[#ebd8c8] hover:text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#c79b78]" />
                  <span>Zu einer entspannenden Traumreise einladen</span>
                </button>
                {inviteSent && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
                    <Check className="w-3.5 h-3.5" /> Einladung wurde gesendet & im Log vermerkt!
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-center pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/70">
          <Feather className="w-4 h-4 text-[#c79b78] shrink-0" />
          <span>Gönne dir eine Auszeit voller Fantasie und tiefer Entspannung.</span>
        </div>
      </div>
    </div>
  );
};

