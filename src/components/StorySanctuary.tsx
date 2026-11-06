import React from 'react';
import { CelestialTouch } from './CelestialTouch';
import { Sparkles, Sun, Moon } from 'lucide-react';

interface StorySanctuaryProps {
  onGoToBreath: () => void;
  onGoToStars: () => void;
}

export const StorySanctuary: React.FC<StorySanctuaryProps> = ({ onGoToBreath, onGoToStars }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Main Section Title */}
      <div className="text-center">
        <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
          Die Geschichte von Sonne, Mond und Sternen
        </h2>
      </div>

      {/* 1. Story Text in Content Box with Golden Frame */}
      <div className="bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-white/90 font-serif-serif text-base sm:text-lg leading-relaxed relative overflow-hidden">
        
        {/* Subtle background glow accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#dfba61]/10 rounded-full blur-3xl pointer-events-none" />

        <p className="leading-relaxed">
          <span className="inline-flex items-center gap-1.5"><Sun className="w-4 h-4 text-[#dfba61] shrink-0" /> Die Sonne</span> strahlt in ihrer ganz eigenen, schönen Wildheit. Sie spendet Wärme, erhellt den Tag und schenkt dem Leben seine bunten Farben.<br />
          <span className="inline-flex items-center gap-1.5"><Moon className="w-4 h-4 text-[#c79b78] shrink-0" /> Der Mond</span> zieht bedacht seine Bahnen im weiten Raum. Er wacht über die Stille der Nacht und schenkt der Welt Ruhe und inneren Frieden.
        </p>

        <p className="leading-relaxed">
          Sie sind unterschiedlich in ihrem Wesen und doch gehören sie zusammen. Keiner sperrt den anderen ein, keiner erwartet vom anderen, dass er seine Bahn verlässt. Sie leuchten einfach, Tag für Tag und Nacht für Nacht, jeder auf seine Art. Und in den Momenten, in denen Tag und Nacht sich sanft berühren, begegnen sie sich in wahrhaftiger Liebe.
        </p>

        <p className="leading-relaxed">
          Und zwischen ihnen funkeln die Sterne, kleine, leuchtende Lichter. Sie füllen den Raum mit Leben und Freude – von Liebe getragen, behütet und beschützt.
        </p>

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

      {/* Closing */}
      <div className="text-center mt-10 pt-6 border-t border-[#dfba61]/30">
        <p className="font-serif-serif text-2xl sm:text-3xl font-medium flex items-center justify-center gap-2">
          <span className="gold-gradient-text font-semibold">Schön, dass es dich gibt.</span>
          <span className="text-[#e6d3a3] animate-pulse">✨</span>
        </p>
        <p className="font-script text-2xl text-[#dfba61] mt-2">
          Manuel & Stefanie
        </p>
      </div>

    </div>
  );
};
