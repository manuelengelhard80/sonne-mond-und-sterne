import React, { useState } from 'react';
import { Moon, Sparkles, Sun, Compass, Feather, Volume2 } from 'lucide-react';
import { soundSynth } from '../services/soundSynth';

interface DreamJourney {
  id: string;
  title: string;
  category: string;
  duration: string;
  icon: 'star' | 'moon' | 'sun';
  intro: string;
  contentParagraphs: string[];
}

const DREAM_JOURNEYS: DreamJourney[] = [
  {
    id: 'starry-lake',
    title: 'Der Weg zum Sternensee',
    category: 'Mond & Sterne · Abendreise',
    duration: '6 Minuten',
    icon: 'star',
    intro: 'Lass deinen Geist sanft davonschweben zu einem ruhigen Bergsee unter einem funkeldenden Himmelszelt.',
    contentParagraphs: [
      'Stelle dir einen schmalen, weichen Pfad vor, der durch einen duftenden Pinienwald führt. Die kühle Abendluft riecht nach Harz und feuchtem Moos. Jeder Schritt fühlt sich leicht und getragen an.',
      'Am Ende des Pfades öffnet sich die Lichtung. Vor dir liegt ein spiegelglatter See. Das Wasser ist so klar und dunkel, dass sich die Millionen Sterne am Himmel makellos auf seiner Oberfläche spiegeln.',
      'Du setzt dich auf einen warmen, glatten Stein am Ufer. Eine sanfte Brise berührt deine Haut. Du schaust hinauf zum Sternenzelt – ein Band aus goldenem und silbernem Licht zieht sich quer durch die Nacht.',
      'Jedes kleine Funkeln erinnert dich daran, wie weit und friedlich das Universum ist. Du atmest die Stille tief ein. Alle Gedanken des Tages lösen sich im spiegelnden Licht des Sternensees auf.',
      'Du ruhst hier in absoluter Sicherheit und Geborgenheit, getragen von der sanften Harmonie der Sterne.'
    ]
  },
  {
    id: 'sun-palace',
    title: 'Der Palast der Sonnenstrahlen',
    category: 'Sonne · Zuversicht & Wärme',
    duration: '5 Minuten',
    icon: 'sun',
    intro: 'Reise an einen sonnendurchfluteten Ort voller Leichtigkeit, Wärme und neuer Herzensenergie.',
    contentParagraphs: [
      'Du stehst auf einem grünen Hügel mitten in der Goldenen Stunde. Die Sonne steht tief am Horizont und hüllt die gesamte Welt in ein samtiges, bernsteinfarbenes Glühen.',
      'Ein warmer, sanfter Wind weht zu dir herüber. Er bringt das leise Rascheln von goldenen Blättern und das Gefühl von vollkommener Sorglosigkeit mit sich.',
      'Vor dir erstreckt sich ein offener Lichtgarten. Wo immer du hingehst, spendet der Boden eine wohltuende, heilsame Wärme. Du spürst, wie jede Anspannung in deinen Schultern schmilzt.',
      'In der Mitte des Gartens steigt eine sanfte Lichtquelle empor. Du breitest deine Arme aus und nimmst diese unerschöpfliche Quelle von Lebensfreude und Vertrauen in dir auf.',
      'Nimm diesen warmen Sonnenschein fest in deinem Herzen mit – er gehört dir und begleitet dich durch jeden Moment.'
    ]
  },
  {
    id: 'cloud-drift',
    title: 'Flug auf der Sternschnuppe',
    category: 'Traum & Phanatasie · Schwerelosigkeit',
    duration: '7 Minuten',
    icon: 'moon',
    intro: 'Gleite schwerelos durch das nachtblaue Wolkenmeer und spüre die pure Freiheit der Gedanken.',
    contentParagraphs: [
      'Schließe die Augen und stelle dir vor, wie du sanft wie eine Feder vom Boden abhebst. Du schwebst langsam empor, vorbei an den Wipfeln der Bäume, hinein in den sanften Abendhimmel.',
      'Eine samtweiche, silbern schimmernde Wolke nimmt dich sanft auf. Sie ist warm, flauschig und wiegt dich wie eine sanfte Wiege.',
      'Eine leuchtende Sternschnuppe zieht nah an dir vorbei und hinterlässt eine Spur aus glitzerndem Sternenstaub. Du folgst ihrem Licht durch die friedliche Nacht.',
      'Hier oben gibt es keine Zeit, keine Eile und keine Schwerfälligkeit. Du bist frei wie das Licht der Sterne, getragen vom ewigen Wohlwollen des Kosmos.',
      'Atme die reine, klare Himmelsluft ein und genieße dieses wunderbare Gefühl von Schwerelosigkeit und Frieden.'
    ]
  }
];

export const TraumreisenSpace: React.FC = () => {
  const [selectedJourney, setSelectedJourney] = useState<DreamJourney>(DREAM_JOURNEYS[0]);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number>(0);

  const handleSelect = (journey: DreamJourney) => {
    setSelectedJourney(journey);
    setActiveParagraphIndex(0);
    soundSynth.playSoftBell();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
          Traumreisen
        </h2>
        <p className="text-sm text-white/80 max-w-md mx-auto">
          "Lass deine Gedanken auf sanften Schwingen davontragen. Schöne Bilder für Herz und Seele."
        </p>
      </div>

      {/* Dream Journey Card Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {DREAM_JOURNEYS.map((journey) => {
          const isSelected = selectedJourney.id === journey.id;
          return (
            <button
              key={journey.id}
              onClick={() => handleSelect(journey)}
              className={`p-5 rounded-xl border text-left transition-all space-y-2 flex flex-col justify-between ${
                isSelected
                  ? 'gold-gradient-btn text-[#0a232c] border-[#dfba61] shadow-xl scale-[1.02]'
                  : 'bg-[#071920] hover:bg-white/10 text-white border-[#dfba61]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                {journey.icon === 'sun' && <Sun className={`w-5 h-5 ${isSelected ? 'text-[#0a232c]' : 'text-[#f5d77f]'}`} />}
                {journey.icon === 'moon' && <Moon className={`w-5 h-5 ${isSelected ? 'text-[#0a232c]' : 'text-teal-200'}`} />}
                {journey.icon === 'star' && <Sparkles className={`w-5 h-5 ${isSelected ? 'text-[#0a232c]' : 'text-[#dfba61]'}`} />}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#0a232c] text-[#dfba61]' : 'bg-white/10 text-white/80'}`}>
                  {journey.duration}
                </span>
              </div>
              <div>
                <h3 className="font-serif-serif font-bold text-base leading-tight">
                  {journey.title}
                </h3>
                <p className={`text-xs mt-1 ${isSelected ? 'text-[#0a232c]/80 font-medium' : 'text-white/60'}`}>
                  {journey.category}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Dream Journey Reading Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#071920] via-[#0a232c] to-[#0f3844] border-2 border-[#dfba61] shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#e6d3a3]">
              <Compass className="w-4 h-4 text-[#dfba61]" />
              <span>{selectedJourney.category}</span>
            </div>
            <h3 className="font-serif-serif text-2xl font-bold text-[#f5d77f] mt-1">
              {selectedJourney.title}
            </h3>
          </div>
          <span className="text-xs bg-black/40 border border-[#dfba61]/40 px-3 py-1 rounded-full text-[#dfba61] font-semibold">
            {selectedJourney.duration} Entspannung
          </span>
        </div>

        <p className="text-sm italic text-white/80 border-l-2 border-[#dfba61] pl-4 py-1">
          {selectedJourney.intro}
        </p>

        {/* Content Paragraph Carousel / Reading View */}
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-black/40 border border-[#dfba61]/30 min-h-[140px] flex flex-col justify-center">
            <p className="font-serif-serif text-base sm:text-lg leading-relaxed text-white">
              {selectedJourney.contentParagraphs[activeParagraphIndex]}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              disabled={activeParagraphIndex === 0}
              onClick={() => setActiveParagraphIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-semibold text-white transition"
            >
              ← Vorheriger Abschnitt
            </button>

            <span className="text-xs text-[#e6d3a3] font-mono">
              Abschnitt {activeParagraphIndex + 1} von {selectedJourney.contentParagraphs.length}
            </span>

            <button
              disabled={activeParagraphIndex === selectedJourney.contentParagraphs.length - 1}
              onClick={() => setActiveParagraphIndex((prev) => Math.min(selectedJourney.contentParagraphs.length - 1, prev + 1))}
              className="px-4 py-2 rounded-lg gold-gradient-btn disabled:opacity-30 text-xs font-bold text-[#0a232c] transition"
            >
              Nächster Abschnitt →
            </button>
          </div>
        </div>

      </div>

      <div className="text-center pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/60">
        <Feather className="w-3.5 h-3.5 text-[#dfba61]" />
        <span>Lies in deinem ganz eigenen Tempo und atme tief durch.</span>
      </div>

    </div>
  );
};
