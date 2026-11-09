import React, { useState } from 'react';
import { useUserRole } from '../context/UserRoleContext';
import { Sun, Moon, Check, Sparkles, X } from 'lucide-react';
import { UserRoleType } from '../types';

export const RolePickerModal: React.FC = () => {
  const { role, displayName, isPickerOpen, isConfigured, setRole, closeRolePicker } = useUserRole();
  const [selectedRole, setSelectedRole] = useState<UserRoleType>(role);
  const [nameInput, setNameInput] = useState<string>(displayName);

  // If already configured and modal is not explicitly opened, do not show
  if (isConfigured && !isPickerOpen) {
    return null;
  }

  const handleSave = () => {
    setRole(selectedRole, nameInput.trim() || undefined);
    closeRolePicker();
  };

  const handleSelect = (r: UserRoleType) => {
    setSelectedRole(r);
    if (!nameInput || nameInput === 'Die Sonne' || nameInput === 'Der Mond' || nameInput === 'Sonne (Stefanie)' || nameInput === 'Mond (Manuel)') {
      setNameInput(r === 'sonne' ? 'Die Sonne' : 'Der Mond');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0a232c] border-2 border-[#dfba61] rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
        
        {/* Close Button if already configured */}
        {isConfigured && (
          <button
            onClick={closeRolePicker}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dfba61]/20 border border-[#dfba61]/40 text-[#f5d77f] text-xs font-medium">
            <span>💫 Gemeinsamer SoulSpace</span>
          </div>
          <h3 className="font-serif-serif text-2xl sm:text-3xl font-bold gold-gradient-text">
            Wer bist du in diesem Moment?
          </h3>
          <p className="text-sm text-white/80 max-w-sm mx-auto">
            Wähle deine Rolle, damit eure Sternschnuppen und Gedanken immer wissen, von wem sie mit Liebe gesendet wurden.
          </p>
        </div>

        {/* Two Big Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Sonne Option */}
          <button
            type="button"
            onClick={() => handleSelect('sonne')}
            className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center space-y-3 ${
              selectedRole === 'sonne'
                ? 'bg-gradient-to-b from-[#e6d3a3]/20 to-[#071920] border-[#dfba61] shadow-[0_0_25px_rgba(223,186,97,0.4)] scale-[1.02]'
                : 'bg-white/5 border-white/10 hover:border-white/30 opacity-75 hover:opacity-100'
            }`}
          >
            {selectedRole === 'sonne' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#dfba61] text-[#0a232c] flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
            <div className="w-14 h-14 rounded-full bg-[#dfba61]/20 flex items-center justify-center text-[#dfba61] border border-[#dfba61]/40">
              <Sun className="w-8 h-8" />
            </div>
            <div>
              <div className="font-serif-serif text-xl font-bold text-[#dfba61]">
                Die Sonne
              </div>
              <p className="text-xs text-white/70 mt-1">
                Wärme, Tag, Licht und lebendige Energie
              </p>
            </div>
          </button>

          {/* Mond Option */}
          <button
            type="button"
            onClick={() => handleSelect('mond')}
            className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center space-y-3 ${
              selectedRole === 'mond'
                ? 'bg-gradient-to-b from-[#f5d77f]/20 to-[#071920] border-[#f5d77f] shadow-[0_0_25px_rgba(245,215,127,0.4)] scale-[1.02]'
                : 'bg-white/5 border-white/10 hover:border-white/30 opacity-75 hover:opacity-100'
            }`}
          >
            {selectedRole === 'mond' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#f5d77f] text-[#0a232c] flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
            <div className="w-14 h-14 rounded-full bg-[#f5d77f]/20 flex items-center justify-center text-[#f5d77f] border border-[#f5d77f]/40">
              <Moon className="w-8 h-8" />
            </div>
            <div>
              <div className="font-serif-serif text-xl font-bold text-[#f5d77f]">
                Der Mond
              </div>
              <p className="text-xs text-white/70 mt-1">
                Stille, Nacht, Geborgenheit und innerer Frieden
              </p>
            </div>
          </button>

        </div>

        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/70 block">
            Dein Anzeigename:
          </label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={selectedRole === 'sonne' ? 'Die Sonne' : 'Der Mond'}
            className="w-full px-4 py-2.5 rounded-xl bg-[#071920] border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#dfba61] text-sm"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-sm tracking-wide shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Als {selectedRole === 'sonne' ? '☀️ Sonne' : '🌙 Mond'} fortfahren</span>
          </button>
        </div>

      </div>
    </div>
  );
};
