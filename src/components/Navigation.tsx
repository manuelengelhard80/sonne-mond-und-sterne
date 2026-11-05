import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab } from '../types';
import { BookOpen, Wind, Sun, Sparkles, Moon, Compass, Feather, Heart, Waves, LayoutGrid, X, UserCheck, Bell, Smartphone } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNotifications: () => void;
  onOpenInstallModal?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenNotifications,
  onOpenInstallModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);
  const { role, displayName, openRolePicker } = useUserRole();

  // Sommernacht am See ist der vorletzte Punkt (Position 8 von 9)
  const navItems = [
    { id: 'story', label: 'Geschichte', icon: BookOpen },
    { id: 'breath', label: 'Innehalten', icon: Wind },
    { id: 'reflection', label: 'Sonnenstrahl', icon: Sun },
    { id: 'moon', label: 'Mondkraft', icon: Moon },
    { id: 'stars', label: 'Sternschnuppen', icon: Sparkles },
    { id: 'meditation', label: 'Meditation', icon: Compass },
    { id: 'traumreisen', label: 'Traumreisen', icon: Feather },
    { id: 'lake', label: 'Sommernacht am See', icon: Waves }, // Vorletzter Punkt
    { id: 'journal', label: 'Gedanken teilen', icon: Heart }, // Letzter Punkt
  ] as const;

  // Auto-scroll the active tab into view in the horizontal mobile scroll bar
  useEffect(() => {
    if (activeBtnRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const btn = activeBtnRef.current;
      const scrollLeft = btn.offsetLeft - (container.clientWidth / 2) + (btn.clientWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeTab]);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0a232c]/95 border-b border-[#dfba61]/40 text-white shadow-xl transition-colors">
      
      {/* 1. MOBILE NAVIGATION BAR (< md breakpoint: Horizontal Swipeable Pill Bar + Role Badge + Quick Menu Button) */}
      <div className="md:hidden flex items-center justify-between px-2 py-2 gap-2">
        
        {/* Horizontal scrollable tabs with edge fade */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center overflow-x-auto scrollbar-none gap-1.5 py-1 px-1 scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                ref={isActive ? activeBtnRef : null}
                onClick={() => handleSelectTab(item.id as ActiveTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#071920] border-2 border-[#dfba61] text-[#fff5c5] shadow-md font-bold scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 text-white/85 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#e6d3a3] shrink-0" />
                <span className="gold-gradient-text">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Role Toggle Button on mobile */}
        <button
          onClick={openRolePicker}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
            role === 'sonne'
              ? 'bg-[#dfba61]/20 border-[#dfba61] text-[#f5d77f]'
              : 'bg-[#f5d77f]/20 border-[#f5d77f]/60 text-[#f5d77f]'
          }`}
          title="Rolle wechseln (Sonne oder Mond)"
        >
          {role === 'sonne' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline font-medium text-[11px]">{role === 'sonne' ? 'Sonne' : 'Mond'}</span>
        </button>

        {/* Notification Bell Button on mobile */}
        <button
          onClick={onOpenNotifications}
          className="shrink-0 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#f5d77f] border border-[#dfba61]/40 transition"
          title="Handy-Benachrichtigungen verwalten"
          aria-label="Benachrichtigungen"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* App Icon / Home Screen Button on mobile */}
        {onOpenInstallModal && (
          <button
            onClick={onOpenInstallModal}
            className="shrink-0 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#f5d77f] border border-[#dfba61]/40 transition"
            title="App-Icon auf den Startbildschirm legen"
            aria-label="App-Icon"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        )}

        {/* Mobile All-Rooms Grid Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className={`shrink-0 p-2 rounded-xl border transition-all ${
            mobileMenuOpen
              ? 'bg-[#dfba61] text-[#0a232c] border-[#dfba61]'
              : 'bg-white/10 text-[#dfba61] border-[#dfba61]/40 hover:bg-white/20'
          }`}
          title={mobileMenuOpen ? 'Menü schließen' : 'Alle Bereiche anzeigen'}
          aria-label="Menü"
        >
          {mobileMenuOpen ? (
            <X className="w-4 h-4 text-[#0a232c]" />
          ) : (
            <LayoutGrid className="w-4 h-4 text-[#fae298]" />
          )}
        </button>

      </div>

      {/* 2. EXPANDABLE MOBILE GRID OVERLAY (Shows when user taps the Grid Menu icon) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#dfba61]/30 bg-[#071920]/95 backdrop-blur-xl p-3 animate-fade-in shadow-2xl">
          
          {/* Active Role Card in Mobile Menu */}
          <div className="flex items-center justify-between p-2.5 mb-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${role === 'sonne' ? 'bg-[#dfba61]/20 text-[#dfba61]' : 'bg-[#f5d77f]/20 text-[#f5d77f]'}`}>
                {role === 'sonne' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-[10px] text-white/50 block">Du bist angemeldet als:</span>
                <span className="font-bold text-white">{displayName}</span>
              </div>
            </div>
            <button
              onClick={() => { setMobileMenuOpen(false); openRolePicker(); }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#f5d77f] font-semibold text-[11px] transition"
            >
              Wechseln
            </button>
          </div>

          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-[#fae298] font-medium">
            <span>Alle 9 Bereiche</span>
            <span className="text-[10px] text-white/60">Tippe zum Auswählen</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id as ActiveTab)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0a232c] border-2 border-[#dfba61] shadow-lg font-bold'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/80'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-[#dfba61]/15 text-[#dfba61] shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="gold-gradient-text truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. DESKTOP & TABLET NAVIGATION BAR (>= md breakpoint: Full-width elegant row with Role Badge) */}
      <div className="hidden md:flex max-w-7xl mx-auto py-2.5 px-4 items-center justify-between gap-4">
        
        <nav className="flex flex-wrap items-center justify-center gap-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#071920] border-2 border-[#dfba61] shadow-lg font-bold scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 text-[#e6d3a3] shrink-0" />
                <span className="gold-gradient-text text-center leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Desktop Role Switcher Badge */}
        <button
          onClick={openRolePicker}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition hover:scale-105 shadow-md ${
            role === 'sonne'
              ? 'bg-[#dfba61]/20 border-[#dfba61] text-[#f5d77f]'
              : 'bg-[#f5d77f]/20 border-[#f5d77f]/60 text-[#f5d77f]'
          }`}
          title="Klicke hier, um zwischen Sonne und Mond zu wechseln"
        >
          {role === 'sonne' ? <Sun className="w-4 h-4 text-[#dfba61]" /> : <Moon className="w-4 h-4 text-[#f5d77f]" />}
          <span>{displayName}</span>
          <span className="text-[10px] opacity-60 underline">Wechseln</span>
        </button>

        {/* Desktop Notification Bell Button */}
        <button
          onClick={onOpenNotifications}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#f5d77f] border border-[#dfba61]/40 transition text-xs font-medium"
          title="Handy-Benachrichtigungen verwalten"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Mitteilungen</span>
        </button>

        {/* Desktop App Icon / Home Screen Button */}
        {onOpenInstallModal && (
          <button
            onClick={onOpenInstallModal}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#f5d77f] border border-[#dfba61]/40 transition text-xs font-medium"
            title="App-Icon wählen & auf den Startbildschirm legen"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">App-Icon</span>
          </button>
        )}

      </div>

    </header>
  );
};
