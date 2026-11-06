/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, SoundMode } from './types';
import { Navigation } from './components/Navigation';
import { StorySanctuary } from './components/StorySanctuary';
import { BreathingCalm } from './components/BreathingCalm';
import { StarrySky } from './components/StarrySky';
import { SunInspiration } from './components/SunInspiration';
import { MoonPower } from './components/MoonPower';
import { MeditationSpace } from './components/MeditationSpace';
import { TraumreisenSpace } from './components/TraumreisenSpace';
import { JournalSpace } from './components/JournalSpace';
import { SommernachtSee } from './components/SommernachtSee';
import { SettingsSpace } from './components/SettingsSpace';
import { Heart, Play, Pause, Bell, X } from 'lucide-react';
import { soundSynth } from './services/soundSynth';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { UserRoleProvider, useUserRole } from './context/UserRoleContext';
import { IosBottomHelperBar } from './components/IosBottomHelperBar';
import { AndroidBottomHelperBar } from './components/AndroidBottomHelperBar';
import {
  initServiceWorker,
  scheduleDailyMorningAffirmation,
  listenForPartnerActivities,
  isNotificationSupported,
  requestNotificationPermission,
  sendTestNotification,
} from './services/notificationService';

function MainApp() {
  const { role, currentUserId } = useUserRole();
  const [activeTab, setActiveTab] = useState<ActiveTab>('story');
  const [currentSound, setCurrentSound] = useState<SoundMode>('off');
  const [isMindfulnessPlaying, setIsMindfulnessPlaying] = useState<boolean>(false);
  const [mindfulnessTimeLeft, setMindfulnessTimeLeft] = useState<number>(300); // 5 minutes = 300s
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isNotificationSupported() && Notification.permission === 'default';
  });

  // Initialize service worker, 5:00 AM morning message scheduler, and real-time partner activity alerts
  useEffect(() => {
    initServiceWorker();
    scheduleDailyMorningAffirmation(role);
    const unsub = listenForPartnerActivities(role, currentUserId);
    return () => {
      unsub();
    };
  }, [role, currentUserId]);

  const handleEnableNotificationsFromBanner = async () => {
    const granted = await requestNotificationPermission();
    setShowNotificationBanner(false);
    if (granted) {
      sendTestNotification(role);
    }
  };

  // Countdown timer for 5 Minuten Achtsamkeit audio
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMindfulnessPlaying && mindfulnessTimeLeft > 0) {
      interval = setInterval(() => {
        setMindfulnessTimeLeft((prev) => {
          if (prev <= 1) {
            soundSynth.playSoftBell();
            soundSynth.stopCurrent();
            setIsMindfulnessPlaying(false);
            setCurrentSound('off');
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMindfulnessPlaying, mindfulnessTimeLeft]);

  const toggleMindfulnessAudio = () => {
    if (isMindfulnessPlaying) {
      soundSynth.stopCurrent();
      setIsMindfulnessPlaying(false);
      setCurrentSound('off');
    } else {
      soundSynth.playSoftBell();
      soundSynth.playSound('sun');
      setIsMindfulnessPlaying(true);
      setCurrentSound('sun');
      if (mindfulnessTimeLeft <= 0) {
        setMindfulnessTimeLeft(300);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#071920] text-white flex flex-col justify-between transition-colors duration-700 w-full overflow-x-hidden">
      
      {/* 1. Full Bleed Hero Header Image (Centered horizontally and vertically for mobile and desktop) */}
      <div className="relative w-full bg-[#0a232c] overflow-hidden flex items-center justify-center portrait:h-[50vh] portrait:min-h-[380px] portrait:max-h-[540px] landscape:h-[60vh] landscape:min-h-[440px] landscape:max-h-[720px] sm:h-[60vh] sm:min-h-[440px] sm:max-h-[700px]">
        
        {/* Full image banner: perfectly centered horizontally and vertically */}
        <img
          src="/assets/aistudio/SMS-Banner.png"
          alt="Sonne, Mond und Sterne - Manuel & Stefanie"
          className="w-full h-full object-cover object-center block select-none pointer-events-none transition-all duration-300"
          style={{ objectPosition: '50% 50%' }}
        />

        {/* Soft bottom edge blend into navigation */}
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#071920] via-[#071920]/60 to-transparent pointer-events-none" />

      </div>

      {/* 2. Navigation Bar (Directly BELOW the full-width image, sticky on scroll) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 3. Dedicated 5 Minuten Achtsamkeit Audio Controller (Positioned directly under Nav on the right, starts audio with cleanly centered Play icon) */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-3 pb-1 flex justify-end items-center">
        <button
          onClick={toggleMindfulnessAudio}
          className={`gold-gradient-btn px-4 py-2 rounded-full flex items-center justify-center gap-2.5 transition shadow-lg select-none active:scale-95 ${
            isMindfulnessPlaying
              ? 'ring-2 ring-[#c79b78]/60 shadow-[0_0_18px_rgba(199,155,120,0.5)]'
              : ''
          }`}
          title={isMindfulnessPlaying ? '5 Minuten Achtsamkeits-Audio pausieren' : '5 Minuten Achtsamkeits-Audio starten'}
        >
          {isMindfulnessPlaying ? (
            <>
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c79b78] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#c79b78]"></span>
              </span>
              <Pause className="w-3.5 h-3.5 text-[#c79b78] fill-[#c79b78] shrink-0" />
              <span className="gold-gradient-text text-xs font-bold">
                Achtsamkeit läuft · {formatTime(mindfulnessTimeLeft)}
              </span>
            </>
          ) : (
            <>
              <div className="w-5 h-5 rounded-full bg-[#c79b78]/20 border border-[#c79b78]/40 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-[#c79b78] block" viewBox="0 0 16 16" fill="currentColor">
                  <polygon points="4.25,3.6 11.75,8 4.25,12.4" />
                </svg>
              </div>
              <span className="gold-gradient-text font-bold text-xs tracking-wide">
                5 Minuten Achtsamkeit
              </span>
            </>
          )}
        </button>
      </div>

      {/* Gentle Mobile Notification Activation Banner (Shows when permission is not yet granted) */}
      {showNotificationBanner && (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-1 pb-3">
          <div className="p-3 sm:p-4 rounded-2xl bg-[#0a232c] border border-[#dfba61] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-9 h-9 rounded-full bg-[#dfba61]/20 border border-[#dfba61]/40 flex items-center justify-center text-[#dfba61] shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <span className="font-bold text-[#f5d77f] block sm:inline">Handy-Benachrichtigungen aktivieren: </span>
                <span className="text-white/80">Erhalte eine Mitteilung auf dein Handy, sobald dein Partner eine Sternschnuppe setzt oder einen Gedanken teilt.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={handleEnableNotificationsFromBanner}
                className="px-4 py-2 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs tracking-wide shadow transition active:scale-95"
              >
                Jetzt aktivieren
              </button>
              <button
                onClick={() => setShowNotificationBanner(false)}
                className="p-2 rounded-xl text-white/50 hover:text-white transition"
                title="Ausblenden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Content Sanctuary Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto w-full flex items-center justify-center">
        {activeTab === 'story' && (
          <StorySanctuary
            onGoToBreath={() => setActiveTab('breath')}
            onGoToStars={() => setActiveTab('stars')}
          />
        )}

        {activeTab === 'breath' && <BreathingCalm />}

        {activeTab === 'reflection' && <SunInspiration />}

        {activeTab === 'stars' && <StarrySky />}

        {activeTab === 'lake' && <SommernachtSee />}

        {activeTab === 'moon' && <MoonPower />}

        {activeTab === 'meditation' && <MeditationSpace />}

        {activeTab === 'traumreisen' && <TraumreisenSpace />}

        {activeTab === 'journal' && <JournalSpace />}
        {activeTab === 'settings' && <SettingsSpace />}
      </main>

      {/* Loving Footer */}
      <footer className="py-6 border-t border-[#dfba61]/30 text-center text-xs text-white/80 space-y-2 backdrop-blur-md bg-black/40">
        <div className="flex items-center justify-center gap-1.5 font-serif-serif text-sm text-[#f5d77f]">
          <span>Dein Raum. Wann immer du magst. Ganz ohne Erwartung.</span>
          <Heart className="w-3.5 h-3.5 text-[#dfba61] fill-[#dfba61]" />
        </div>
        <div className="text-white/70 flex items-center justify-center gap-2">
          <span className="font-script text-lg text-[#dfba61]">Manuel & Stefanie</span>
          <span>·</span>
          <span>Liebe, Freiheit, Achtsamkeit.</span>
        </div>
      </footer>

      {/* Floating iPhone Safari Bottom Helper Bar with bouncing arrow */}
      <IosBottomHelperBar />

      {/* Single Bottom Bar Window: Sequential 3-Step Onboarding & Installation Guide */}
      <AndroidBottomHelperBar />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserRoleProvider>
        <MainApp />
      </UserRoleProvider>
    </ThemeProvider>
  );
}

