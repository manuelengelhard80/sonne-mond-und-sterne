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
  X,
  Mail,
  Key
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getNotificationLogs } from '../services/notificationService';
import { NotificationLogEntry } from '../types';

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
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  const checkUnread = () => {
    const logs = getNotificationLogs();
    if (logs.length === 0) {
      setUnreadCount(0);
      return;
    }
    const lastReadId = localStorage.getItem('last_read_log_id');
    if (!lastReadId) {
      setUnreadCount(logs.length);
      return;
    }
    const index = logs.findIndex((l) => l.id === lastReadId);
    if (index === -1) {
      setUnreadCount(logs.length);
    } else {
      setUnreadCount(index);
    }
  };

  useEffect(() => {
    const handleLogUpdate = () => {
      if (activeTab === 'messages') {
        const logs = getNotificationLogs();
        if (logs.length > 0) {
          localStorage.setItem('last_read_log_id', logs[0].id);
        }
        setUnreadCount(0);
      } else {
        checkUnread();
      }
    };

    if (activeTab === 'messages') {
      const logs = getNotificationLogs();
      if (logs.length > 0) {
        localStorage.setItem('last_read_log_id', logs[0].id);
      }
      setUnreadCount(0);
    } else {
      checkUnread();
    }

    window.addEventListener('notification-log-updated', handleLogUpdate);
    return () => {
      window.removeEventListener('notification-log-updated', handleLogUpdate);
    };
  }, [activeTab]);


  // Alle 10 Bereiche inklusive der neuen Unterseite "Einstellungen"
  const navItems = [
    { id: 'story', label: 'Geschichte', icon: BookOpen },
    { id: 'breath', label: 'Innehalten', icon: Wind },
    { id: 'reflection', label: 'Sonnenstrahl', icon: Sun },
    { id: 'moon', label: 'Mondkraft', icon: Moon },
    { id: 'stars', label: 'Sternschnuppen', icon: Sparkles },
    { id: 'meditation', label: 'Meditation', icon: Compass },
    { id: 'traumreisen', label: 'Traumreisen', icon: Feather },
    { id: 'lake', label: 'Das Mädchen vom See', icon: Waves },
    { id: 'happiness', label: 'Der Schlüssel zum Glück', icon: Key },
    { id: 'journal', label: 'Gedanken teilen', icon: Heart },
    { id: 'messages', label: 'Nachrichten', icon: Mail },
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
    if (tab === 'messages') {
      const logs = getNotificationLogs();
      if (logs.length > 0) {
        localStorage.setItem('last_read_log_id', logs[0].id);
      }
      setUnreadCount(0);
    }
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
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-white/12 text-[#ebd8c8] font-bold shadow-sm'
                    : 'text-[#c79b78]/75 hover:text-[#ebd8c8] hover:bg-white/5 font-medium'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-[#ebd8c8]' : 'text-[#c79b78]/80'}`} />
                <span className={isActive ? 'gold-gradient-text font-bold' : ''}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile All-Rooms Grid Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className={`shrink-0 p-2 rounded-xl border transition-all ${
            mobileMenuOpen
              ? 'bg-[#071920] text-[#ebd8c8] border-[#c79b78]'
              : 'bg-white/5 text-[#c79b78] border-[#c79b78]/30 hover:border-[#c79b78] hover:bg-white/10'
          }`}
          title={mobileMenuOpen ? 'Menü schließen' : 'Alle Bereiche anzeigen'}
          aria-label="Menü"
        >
          {mobileMenuOpen ? (
            <X className="w-4 h-4 text-[#ebd8c8]" />
          ) : (
            <LayoutGrid className="w-4 h-4 text-[#c79b78]" />
          )}
        </button>

      </div>

      {/* 2. EXPANDABLE MOBILE GRID OVERLAY (Shows when user taps the Grid Menu icon) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#c79b78]/30 bg-[#071920]/98 backdrop-blur-xl p-3 animate-fade-in shadow-2xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#c79b78]/20 text-xs text-[#c79b78]/70 font-medium">
            <span>Alle Bereiche</span>
            <span className="text-[10px] text-[#c79b78]/50">Tippe zum Auswählen</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isMessages = item.id === 'messages';
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id as ActiveTab)}
                  className={`relative flex items-center gap-2 p-2.5 rounded-xl text-left text-xs transition-all ${
                    isActive
                      ? 'bg-white/12 text-[#ebd8c8] font-bold shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-[#c79b78]/75 hover:text-[#ebd8c8]'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-[#c79b78]/25 text-[#ebd8c8]' : 'bg-[#c79b78]/10 text-[#c79b78]/80'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {isMessages && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#f04423] text-white text-[10px] font-bold rounded-full shadow-md border border-white/50 animate-pulse z-20 pointer-events-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={`truncate ${isActive ? 'gold-gradient-text font-bold' : ''}`}>{item.label}</span>
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
            const isMessages = item.id === 'messages';
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'messages') {
                    const logs = getNotificationLogs();
                    if (logs.length > 0) {
                      localStorage.setItem('last_read_log_id', logs[0].id);
                    }
                    setUnreadCount(0);
                  }
                  setActiveTab(item.id as ActiveTab);
                }}
                className={`relative flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all ${
                  isActive
                    ? 'bg-white/12 text-[#ebd8c8] font-bold shadow-sm scale-[1.02]'
                    : 'text-[#c79b78]/75 hover:text-[#ebd8c8] hover:bg-white/5 font-medium'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#ebd8c8]' : 'text-[#c79b78]/80'}`} />
                  {isMessages && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center bg-[#f04423] text-white text-[9px] font-bold rounded-full shadow-md border border-white/50 animate-pulse z-20 pointer-events-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-center leading-tight ${isActive ? 'gold-gradient-text font-bold' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

    </header>
  );
};
