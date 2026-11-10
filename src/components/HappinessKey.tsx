import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export const HappinessKey: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      {/* Container Box */}
      <div className="bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-white/90 font-serif-serif text-base sm:text-lg leading-relaxed relative overflow-hidden">
        
        {/* Subtle background glow accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#dfba61]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Der Schlüssel zum Glück
          </h2>
        </div>

        {/* Placeholder Content */}
        <div className="leading-relaxed">
          <p>
            In Kürze verfügbar...
          </p>
        </div>

        {/* Collapsible Content */}
        <div className={`space-y-6 transition-all duration-700 overflow-hidden ${isExpanded ? 'max-h-[1500px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
          <p className="leading-relaxed pt-3">
            Die Geheimnisse des Glücks warten darauf, mit dir geteilt zu werden. 
            Bald wirst du hier neue Impulse finden.
          </p>
        </div>

        {/* Expansion Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-[#dfba61] hover:text-[#ebd8c8] transition-all text-sm font-bold uppercase tracking-[0.15em] mt-4 group"
        >
          <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-[#dfba61]/10 border border-[#dfba61]/30 group-hover:bg-[#dfba61]/20 group-hover:scale-110 transition-all ${isExpanded ? 'rotate-45' : ''}`}>
            <Plus className="w-4 h-4" />
          </div>
          <span>{isExpanded ? 'Weniger lesen' : 'Mehr lesen'}</span>
        </button>
      </div>
    </div>
  );
};
