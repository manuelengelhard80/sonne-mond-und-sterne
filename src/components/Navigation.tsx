import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab } from '../types';
import {
  BookOpen,
  Wind,
  Sun,
  Sparkles,
  Moon,
  Compass,
  Feather,
  Heart,
  Waves,
  Settings,
  LayoutGrid,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { isCopper } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Alle 10 Bereiche inklusive der neuen Unterseite "Einstellungen"
  const navItems = [
    { id: 'story', label: 'Geschichte', icon: BookOpen },
    { id: 'breath', label: 'Innehalten', icon: Wind },
    { id: 'reflection', label: 'Sonnenstrahl', icon: Sun },
    { id: 'moon', label: 'Mondkraft', icon: Moon },
    { id: 'stars', label: 'Sternschnuppen', icon: Sparkles },
    { id: 'meditation', label: 'Meditation', icon: Compass },
    { id: 'traumreisen', label: 'Traumreisen', icon: Feather },
    { id: 'lake', label: 'Sommernacht am See', icon: Waves },
    { id: 'journal', label: 'Gedanken teilen', icon: Heart },
    { id: 'settings', label: 'Einstellungen', icon: Settings },
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
      
      {/* 1. MOBILE NAVIGATION BAR (< md breakpoint: Horizontal Swipeable Pill Bar + Clean Grid Menu Button) */}
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
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-[#fae298] font-medium">
            <span>Alle 10 Bereiche</span>
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

      {/* 3. DESKTOP & TABLET NAVIGATION BAR (>= md breakpoint: Full-width elegant centered row) */}
      <div className="hidden md:flex max-w-7xl mx-auto py-2.5 px-4 items-center justify-center">
        <nav className="flex flex-wrap items-center justify-center gap-2">
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
      </div>

    </header>
  );
};
