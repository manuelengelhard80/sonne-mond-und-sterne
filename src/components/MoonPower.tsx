import React, { useState } from 'react';
import { Moon, Sparkles, Feather, Send, CheckCircle2, Volume2 } from 'lucide-react';
import { soundSynth } from '../services/soundSynth';

interface MoonPhase {
  id: string;
  name: string;
  symbol: string;
  quote: string;
  ritual: string;
}

const MOON_PHASES: MoonPhase[] = [
  {
    id: 'full',
    name: 'Vollmond · Fülle & Strahlkraft',
    symbol: '🌕',
    quote: 'Der Mond wacht über die Stille der Nacht. Er zieht bedacht seine Bahnen, ganz ohne Eile. Spüre die tiefe Ruhe in dir.',
    ritual: 'Blicke kurz ins Licht und sei stolz auf alles, was du heute geleistet hast.',
  },
  {
    id: 'waning',
    name: 'Abnehmender Mond · Sanftes Loslassen',
    symbol: '🌖',
    quote: 'Es ist Zeit, Anspannung abzugeben. Du musst nicht alles festhalten. Lass die Ereignisse des Tages sanft zur Ruhe kommen.',
    ritual: 'Atme dreimal tief aus und stelle dir vor, wie Sorgen wie milder Abendwind verfliegen.',
  },
  {
    id: 'new',
    name: 'Neumond · Stille & Erneuerung',
    symbol: '🌑',
    quote: 'In der dunkelsten Nacht wächst neue Kraft im Verborgenen. Die Stille schenkt dir Regeneration und Frieden.',
    ritual: 'Schenke dir selbst ein leises Lächeln für deine innere Stärke.',
  },
  {
    id: 'waxing',
    name: 'Zunehmender Mond · Wachstum & Zuversicht',
    symbol: '🌔',
    quote: 'Wie die Mondsichel von Tag zu Tag wächst, entfaltet sich auch dein Weg in deinem ganz eigenen, perfekten Tempo.',
    ritual: 'Setze dir eine kleine, liebevolle Absicht für den morgigen Tag.',
  },
];

export const MoonPower: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<MoonPhase>(MOON_PHASES[0]);
  const [releaseText, setReleaseText] = useState('');
  const [released, setReleased] = useState(false);

  const handleRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseText.trim()) return;

    soundSynth.playSoftBell();
    setReleased(true);
    setTimeout(() => {
      setReleaseText('');
      setReleased(false);
    }, 4000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
          Mondkraft
        </h2>
        <p className="text-sm text-white/80 max-w-md mx-auto">
          "Der Mond wacht über die Stille der Nacht und schenkt der Welt Ruhe und inneren Frieden."
        </p>
      </div>

      {/* Moon Phase Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MOON_PHASES.map((phase) => (
          <button
            key={phase.id}
            onClick={() => {
              setSelectedPhase(phase);
              soundSynth.playSoftBell();
            }}
            className={`p-3 sm:p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
              selectedPhase.id === phase.id
                ? 'gold-gradient-btn text-[#0a232c] font-bold border-[#dfba61] shadow-lg scale-105'
                : 'bg-[#071920] hover:bg-white/10 text-white border-[#dfba61]/30'
            }`}
          >
            <span className="text-2xl">{phase.symbol}</span>
            <span className="text-xs font-semibold leading-tight">{phase.name.split('·')[0]}</span>
          </button>
        ))}
      </div>

      {/* Moon Wisdom Display Card */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#071920] via-[#0a232c] to-[#0f3844] border-2 border-[#dfba61] shadow-xl space-y-4 overflow-hidden">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-xs font-semibold text-[#e6d3a3] flex items-center gap-2">
            <Moon className="w-4 h-4 text-[#dfba61]" />
            <span>{selectedPhase.name}</span>
          </span>
          <span className="text-xl">{selectedPhase.symbol}</span>
        </div>

        <p className="font-serif-serif text-lg sm:text-xl italic leading-relaxed text-white">
          "{selectedPhase.quote}"
        </p>

        <div className="bg-black/30 p-4 rounded-xl border border-[#dfba61]/30 text-xs text-[#e6d3a3] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#dfba61] shrink-0" />
          <span><strong>Abend-Ritual:</strong> {selectedPhase.ritual}</span>
        </div>

      </div>

      {/* Evening Release Ritual ("Dem Mond übergeben") */}
      <div className="bg-[#071920] p-6 rounded-2xl border border-[#dfba61]/40 space-y-4">
        <div className="flex items-center gap-2 text-[#e6d3a3]">
          <Feather className="w-5 h-5 text-[#dfba61]" />
          <h3 className="font-serif-serif text-xl font-bold gold-gradient-text">
            Abendliches Loslassen
          </h3>
        </div>

        <p className="text-xs text-white/80">
          Möchtest du eine Sorge, Gedankenschleife oder Anspannung des Tages abgeben? Schreibe sie hier auf und übergib sie der Stille der Nacht.
        </p>

        {released ? (
          <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2 animate-fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-serif-serif text-lg text-emerald-200">
              Dem Mond übergeben & gelöst.
            </p>
            <p className="text-xs text-emerald-300/80">
              Deine Last ist in der Stille der Nacht verflogen. Schlaf ruhig und geborgen.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRelease} className="space-y-3">
            <textarea
              rows={3}
              placeholder="z.B. Ich lasse die Unruhe des heutigen Tages jetzt sanft los..."
              value={releaseText}
              onChange={(e) => setReleaseText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#e6d3a3] font-serif-serif text-base"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!releaseText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient-btn disabled:opacity-50 text-[#0a232c] font-bold text-xs transition shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>Dem Mond übergeben</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sound Hint */}
      <div className="text-center pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/60">
        <Volume2 className="w-3.5 h-3.5 text-[#dfba61]" />
        <span>Tipp: Schalte oben in der Leiste den Klang "Mondstille" ein für sanftes Wellenrauschen.</span>
      </div>

    </div>
  );
};
