import React, { useState } from 'react';
import { generatePoeticThought } from '../services/geminiService';
import { Sun, Sparkles, RefreshCw, Heart, Copy, Check } from 'lucide-react';
import { soundSynth } from '../services/soundSynth';

export const SunInspiration: React.FC = () => {
  const [mood, setMood] = useState<string>('Geborgenheit');
  const [customWish, setCustomWish] = useState<string>('');
  const [thought, setThought] = useState<string>(
    'Wie die Sterne leise wachen, musst du heute nichts beweisen. Du bist getragen, beschützt und geliebt.'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const moods = [
    { name: 'Geborgenheit', desc: 'Wärme & Schutz' },
    { name: 'Ruhe', desc: 'Stille & Entschleunigung' },
    { name: 'Zuversicht', desc: 'Mut & sanfte Kraft' },
    { name: 'Dankbarkeit', desc: 'Freude & Magie' },
  ];

  const handleGenerate = async (selectedMood?: string) => {
    const targetMood = selectedMood || mood;
    setLoading(true);
    soundSynth.playSoftBell();
    
    try {
      const result = await generatePoeticThought(targetMood, customWish);
      setThought(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(thought);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
      
      <div className="text-center space-y-2">
        <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
          Sonnenstrahl
        </h2>

        <p className="text-sm text-white/80 max-w-md mx-auto">
          Wähle das Gefühl, das deine Seele gerade braucht, und erhalte eine liebevolle Erinnerung an deine innere Wärme.
        </p>
      </div>

      {/* Mood Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {moods.map((m) => (
          <button
            key={m.name}
            onClick={() => {
              setMood(m.name);
              handleGenerate(m.name);
            }}
            className={`p-3 sm:p-4 rounded-xl border text-center transition-all ${
              mood === m.name
                ? 'gold-gradient-btn text-[#0a232c] font-bold border-[#dfba61] shadow-md scale-105'
                : 'bg-[#071920] hover:bg-white/10 text-white border-[#dfba61]/30'
            }`}
          >
            <div className="font-serif-serif font-bold text-base">{m.name}</div>
            <div className="text-[11px] opacity-80 mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>



      {/* Output Card */}
      <div className="relative p-8 rounded-2xl bg-gradient-to-br from-[#071920] via-[#0a232c] to-[#0f3844] text-white border-2 border-[#dfba61] shadow-xl overflow-hidden min-h-[160px] flex flex-col justify-between">
        
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#dfba61]/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#e6d3a3]">
            <span className="font-semibold flex items-center gap-1">
              <Heart className="w-4 h-4 fill-[#dfba61] text-[#dfba61]" /> Impuls für dich
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-white transition"
              title="Kopieren"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopiert' : 'Text kopieren'}</span>
            </button>
          </div>

          <p className="font-serif-serif text-xl sm:text-2xl italic leading-relaxed text-white">
            "{thought}"
          </p>
        </div>

        <div className="relative z-10 pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-xs text-white/70 border-t border-white/10 mt-4">
          <span className="font-medium">Gefühl: {mood}</span>
          <button
            onClick={() => handleGenerate()}
            disabled={loading}
            className="flex items-start gap-1 text-[#e6d3a3] hover:underline"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-left">Neuen Gedankenspruch erzeugen</span>
          </button>
        </div>

      </div>

    </div>
  );
};
