/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { Messages } from './components/Messages';
import { HappinessKey } from './components/HappinessKey';
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
  const { role, currentUserId, isConfigured } = useUserRole();
  const [activeTab, setActiveTab] = useState<ActiveTab>('story');
  const [currentSound, setCurrentSound] = useState<SoundMode>('off');
  const [isMindfulnessPlaying, setIsMindfulnessPlaying] = useState<boolean>(false);
  const [mindfulnessTimeLeft, setMindfulnessTimeLeft] = useState<number>(300); // 5 minutes = 300s

  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return isConfigured && localStorage.getItem('onboarding_3steps_done') === 'true';
  });

  // Listen for onboarding completion event
  useEffect(() => {
    const handleCompleted = () => {
      setIsOnboardingCompleted(true);
    };
    window.addEventListener('onboarding-completed', handleCompleted);
    return () => {
      window.removeEventListener('onboarding-completed', handleCompleted);
    };
  }, []);

  // Sync initial state if isConfigured updates
  useEffect(() => {
    if (isConfigured && localStorage.getItem('onboarding_3steps_done') === 'true') {
      setIsOnboardingCompleted(true);
    }
  }, [isConfigured]);

  // Initialize service worker, 5:00 AM morning message scheduler, and real-time partner activity alerts
  useEffect(() => {
    initServiceWorker();
    scheduleDailyMorningAffirmation(role);
    const unsub = listenForPartnerActivities(role, currentUserId);

    // Request permissions and setup FCM if onboarding is done
    if (isOnboardingCompleted) {
      requestNotificationPermission();
    }

    const handleNavigateTab = (e: any) => {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab as ActiveTab);
      }
    };

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE_TAB' && event.data.tab) {
        setActiveTab(event.data.tab as ActiveTab);
      }
    };

    // Check URL query parameter on load (e.g. /?tab=stars)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam as ActiveTab);
      }
    }

    window.addEventListener('navigate-tab', handleNavigateTab);
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      unsub();
      window.removeEventListener('navigate-tab', handleNavigateTab);
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [role, currentUserId]);

  const mindfulnessAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleGlobalPause = (e: any) => {
      if (e.detail?.id !== '/five_min.mp3' && isMindfulnessPlaying) {
        mindfulnessAudioRef.current?.pause();
        setIsMindfulnessPlaying(false);
      }
    };
    window.addEventListener('app-audio-play', handleGlobalPause);
    return () => window.removeEventListener('app-audio-play', handleGlobalPause);
  }, [isMindfulnessPlaying]);

  // Countdown timer for 5 Minuten Achtsamkeit audio
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMindfulnessPlaying && mindfulnessTimeLeft > 0) {
      interval = setInterval(() => {
        setMindfulnessTimeLeft((prev) => {
          if (prev <= 1) {
            mindfulnessAudioRef.current?.pause();
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
    const audio = mindfulnessAudioRef.current;
    if (!audio) return;

    if (isMindfulnessPlaying) {
      audio.pause();
      setIsMindfulnessPlaying(false);
      setCurrentSound('off');
    } else {
      window.dispatchEvent(new CustomEvent('app-audio-play', { detail: { id: '/five_min.mp3' } }));
      audio.currentTime = 0;
      audio.play()
        .then(() => {
          setIsMindfulnessPlaying(true);
          setCurrentSound('sun');
          if (mindfulnessTimeLeft <= 0) {
            setMindfulnessTimeLeft(300);
          }
        })
        .catch((err) => {
          console.warn('Mindfulness audio play notice:', err);
          setIsMindfulnessPlaying(false);
        });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#071920] text-white flex flex-col justify-between transition-colors duration-700 w-full overflow-x-hidden relative">
      <audio
        ref={mindfulnessAudioRef}
        src="/five_min.mp3"
        preload="auto"
      />

      {/* Onboarding Overlay */}
      {!isOnboardingCompleted && (
        <div className="fixed inset-0 z-[100] bg-[#071920]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden select-none">
          <AndroidBottomHelperBar />
        </div>
      )}
      
      {/* 1. Full Bleed Hero Header Image */}
      <div className="relative w-full bg-[#0a232c] overflow-hidden flex items-center justify-center portrait:h-[50vh] portrait:min-h-[380px] portrait:max-h-[540px] landscape:h-[60vh] landscape:min-h-[440px] landscape:max-h-[720px] sm:h-[60vh] sm:min-h-[440px] sm:max-h-[700px]">
        <img
          src="/assets/aistudio/SMS-Banner.png"
          alt="Sonne, Mond und Sterne"
          className="w-full h-full object-cover object-center block select-none pointer-events-none transition-all duration-300"
          style={{ objectPosition: '50% 50%' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#071920] via-[#071920]/60 to-transparent pointer-events-none" />
      </div>

      {/* 2. Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 3. Dedicated 5 Minuten Achtsamkeit Audio Controller (nur bei Geschichten, mittig zentriert) */}
      {activeTab === 'story' && (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-3 pb-1 flex justify-center items-center">
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
      )}

      {/* 4. Main Content Area */}
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
        {activeTab === 'messages' && <Messages />}
        {activeTab === 'happiness' && <HappinessKey />}
        {activeTab === 'settings' && <SettingsSpace />}
      </main>

      {/* Loving Footer */}
      <footer className="py-8 border-t border-[#dfba61]/30 text-center space-y-4 backdrop-blur-md bg-black/40">
        <h3 className="font-serif-serif text-2xl sm:text-3xl font-bold gold-gradient-text mb-2">
          Schön, dass du da bist.
        </h3>
        <div className="flex items-center justify-center gap-1.5 font-serif-serif text-sm text-[#f5d77f]">
          <span>Dein Raum. Wann immer du magst. Ganz ohne Erwartung.</span>
          <Heart className="w-3.5 h-3.5 text-[#dfba61] fill-[#dfba61]" />
        </div>
        <div className="text-white/70 flex items-center justify-center gap-2 text-xs">
          <span className="font-script text-lg text-[#dfba61]">Sonne & Mond</span>
          <span>·</span>
          <span>Liebe, Freiheit, Achtsamkeit.</span>
        </div>
      </footer>

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

