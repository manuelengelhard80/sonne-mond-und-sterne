import React, { useState, useEffect, useRef } from 'react';
import { StarNote } from '../types';
import { X, Send, Calendar, Clock, Trash2, Sun, Moon, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { CurvedShootingStar } from './CurvedShootingStar';
import { useUserRole } from '../context/UserRoleContext';
import { db, ensureAuthenticated } from '../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { sendAppNotification } from '../services/notificationService';

const DEFAULT_STARS: StarNote[] = [
  {
    id: 'star-1',
    x: 22,
    y: 26,
    title: 'Eigene Wildheit',
    content: 'Die Sonne strahlt in ihrer ganz eigenen, schönen Wildheit. Verbiege dich nie für andere.',
    author: 'Mond (Manuel)',
    authorRole: 'mond',
    date: 'Für immer',
    size: 'large',
    angle: 44,
    curvature: 10,
  },
  {
    id: 'star-2',
    x: 76,
    y: 28,
    title: 'Keine Pflichten',
    content: 'Dieser Raum ist nur für dich. Kein Müssen, keine Erwartungen. Du darfst einfach sein.',
    author: 'Sonne (Stefanie)',
    authorRole: 'sonne',
    date: 'Für immer',
    size: 'large',
    angle: 136,
    curvature: -10,
  },
  {
    id: 'star-3',
    x: 48,
    y: 56,
    title: 'Wahrhaftige Liebe',
    content: 'In den Momenten, in denen Tag und Nacht sich sanft berühren, begegnen sie sich in wahrhaftiger Liebe.',
    author: 'Sonne & Mond',
    date: 'Für immer',
    size: 'large',
    angle: 48,
    curvature: 12,
  },
  {
    id: 'star-4',
    x: 32,
    y: 78,
    title: 'Behütet & Beschützt',
    content: 'Sternschnuppen füllen den Raum mit Leben und Freude – von Liebe getragen, behütet und beschützt.',
    author: 'Mond (Manuel)',
    authorRole: 'mond',
    date: 'Heute',
    size: 'medium',
    angle: 40,
    curvature: 8,
  },
  {
    id: 'star-5',
    x: 84,
    y: 72,
    title: 'Danke fürs Dasein',
    content: 'Schön, dass es dich gibt. Deine Wärme macht die Welt ein Stück helleren und schöner.',
    author: 'Sonne (Stefanie)',
    authorRole: 'sonne',
    date: 'Heute',
    size: 'medium',
    angle: 132,
    curvature: -10,
  },
];

// Ensure any loaded star angles are strictly upward-pointing (25° - 155°)
const normalizeStar = (s: StarNote, idx: number): StarNote => {
  let ang = s.angle ?? (idx % 2 === 0 ? 44 : 136);
  if (ang < 0) ang = Math.abs(ang);
  if (ang < 25) ang = 44;
  if (ang > 155) ang = 136;
  if (ang > 75 && ang < 105) {
    ang = (s.x ?? 50) > 50 ? 136 : 44;
  }
  return {
    ...s,
    angle: ang,
    curvature: s.curvature ? Math.max(-12, Math.min(12, s.curvature)) : (ang > 90 ? -10 : 10),
  };
};

interface FlyingMeteorState {
  x: number;
  y: number;
  angle: number;
  opacity: number;
  curvature: number;
}

export const StarrySky: React.FC = () => {
  const { role, displayName, currentUserId } = useUserRole();

  const [stars, setStars] = useState<StarNote[]>([]);
  const [selectedStar, setSelectedStar] = useState<StarNote | null>(null);
  const [hoveredStarId, setHoveredStarId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  // Expiration / Appointment state
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDateTime, setExpiryDateTime] = useState('');

  const [clickPos, setClickPos] = useState<{ x: number; y: number; angle: number; curvature: number } | null>(null);
  const [flyingMeteor, setFlyingMeteor] = useState<FlyingMeteorState | null>(null);
  const skyContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Real-time Firestore sync & Auto-Deletion of expired stars
  useEffect(() => {
    ensureAuthenticated().then(() => {
      const unsubscribe = onSnapshot(collection(db, 'shooting_stars'), (snapshot) => {
        const now = Date.now();
        
        if (snapshot.empty) {
          // Fallback to local defaults if nothing in cloud
          setStars(DEFAULT_STARS.map((s, idx) => normalizeStar(s, idx)));
          return;
        }

        const cloudStars: StarNote[] = [];
        snapshot.docs.forEach((d) => {
          const data = d.data() as StarNote;
          const starId = d.id;

          // Check if star has an expiration date that already passed
          if (data.expiresAt) {
            const expTime = new Date(data.expiresAt).getTime();
            if (!isNaN(expTime) && expTime <= now) {
              deleteDoc(doc(db, 'shooting_stars', starId)).catch(console.error);
              return; 
            }
          }

          cloudStars.push(normalizeStar({ ...data, id: starId }, cloudStars.length));
        });

        setStars(cloudStars);
      }, (error) => {
        console.warn('Shooting stars listener notice:', error);
      });

      return () => unsubscribe();
    }).catch(console.error);
  }, []);

  // Periodic check (every 30 seconds) to clean up expired stars on screen
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setStars((prev) => {
        const filtered = prev.filter((s) => {
          if (!s.expiresAt) return true;
          const expTime = new Date(s.expiresAt).getTime();
          const isExpired = !isNaN(expTime) && expTime <= now;
          if (isExpired) {
            deleteDoc(doc(db, 'shooting_stars', s.id)).catch(console.error);
          }
          return !isExpired;
        });
        return filtered;
      });
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Sky click: Launch a shooting star smoothly across the heavens
  const handleSkyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.star-element') || flyingMeteor || isAdding) return;
    if (!skyContainerRef.current) return;

    const rect = skyContainerRef.current.getBoundingClientRect();
    const targetX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const targetY = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const fromTopLeft = Math.random() < 0.5;
    let originX: number;
    let originY: number;

    if (fromTopLeft) {
      originX = -12 + Math.random() * 20;
      originY = -24 + Math.random() * 14;
    } else {
      originX = 92 + Math.random() * 20;
      originY = -24 + Math.random() * 14;
    }

    const dx = targetX - originX;
    const dy = targetY - originY;
    const flightAngle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));
    const tailCurvature = fromTopLeft ? 10 : -10;

    const flightDist = Math.hypot(dx, dy) || 1;
    const perpX = -dy / flightDist;
    const perpY = dx / flightDist;
    const curveSide = fromTopLeft ? 1 : -1;
    const curveAmp = flightDist * 0.08 * curveSide;

    const p1x = (originX + targetX) / 2 + perpX * curveAmp;
    const p1y = (originY + targetY) / 2 + perpY * curveAmp;

    const duration = 1450;
    const startTime = performance.now();

    const animateFlight = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const inv = 1 - ease;

      const curX = inv * inv * originX + 2 * inv * ease * p1x + ease * ease * targetX;
      const curY = inv * inv * originY + 2 * inv * ease * p1y + ease * ease * targetY;
      const opacity = Math.min(progress / 0.10, 1);

      setFlyingMeteor({
        x: curX,
        y: curY,
        angle: flightAngle,
        opacity,
        curvature: tailCurvature,
      });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateFlight);
      } else {
        setClickPos({ x: targetX, y: targetY, angle: flightAngle, curvature: tailCurvature });
        setTimeout(() => {
          setFlyingMeteor(null);
          setIsAdding(true);
        }, 240);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateFlight);
  };

  const handleSetPresetExpiry = (hoursFromNow: number) => {
    const d = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setExpiryDateTime(formatted);
    setHasExpiry(true);
  };

  const handleAddStar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const user = await ensureAuthenticated();
    const starId = `star-${Date.now()}`;

    const newStarNote: StarNote = {
      id: starId,
      x: clickPos ? clickPos.x : Math.floor(Math.random() * 80) + 10,
      y: clickPos ? clickPos.y : Math.floor(Math.random() * 70) + 15,
      title: newTitle.trim(),
      content: newContent.trim(),
      author: displayName,
      authorRole: role,
      authorUid: user?.uid || 'local-user',
      date: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      createdAt: new Date().toISOString(),
      size: 'medium',
      angle: clickPos ? clickPos.angle : 44,
      curvature: clickPos ? clickPos.curvature : 10,
      expiresAt: hasExpiry && expiryDateTime ? new Date(expiryDateTime).toISOString() : null,
    };

    try {
      await setDoc(doc(db, 'shooting_stars', starId), newStarNote);
    } catch (err) {
      console.warn('Firestore error, using local fallback:', err);
      setStars((prev) => [...prev, newStarNote]);
    }

    sendAppNotification('🌟 Sternschnuppe am Himmel verewigt!', {
      body: `"${newTitle.trim()}" leuchtet jetzt für euch beide am Himmel.`,
      tag: `my-star-${starId}`,
    });

    setNewTitle('');
    setNewContent('');
    setHasExpiry(false);
    setExpiryDateTime('');
    setIsAdding(false);
    setClickPos(null);
  };

  const handleDeleteStar = async (starId: string) => {
    try {
      await deleteDoc(doc(db, 'shooting_stars', starId));
    } catch (err) {
      console.error('Delete error:', err);
    }
    setStars((prev) => prev.filter((s) => s.id !== starId));
    setSelectedStar(null);
  };

  const formatExpiryNotice = (expiresAtStr?: string | null): { formattedDate: string; relativeStr: string } | null => {
    if (!expiresAtStr) return null;
    const expDate = new Date(expiresAtStr);
    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();

    const formattedDate = expDate.toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    if (diffMs <= 0) return { formattedDate, relativeStr: 'Termin erreicht' };

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    return {
      formattedDate,
      relativeStr: diffDays > 0 ? `noch ca. ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tage'}` : `noch ca. ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`,
    };
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 pb-24">
      
      {/* 1. Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a232c] border border-[#dfba61]/40 shadow-lg">
          <Sparkles className="w-4 h-4 text-[#dfba61]" />
          <span className="text-[#f5d77f] text-xs font-bold uppercase tracking-widest">Himmelsbotschaften</span>
        </div>
        <h2 className="font-serif-serif text-4xl sm:text-5xl font-bold gold-gradient-text leading-tight">
          Eure Sternschnuppen
        </h2>
        <p className="text-sm text-white/70 max-w-2xl mx-auto leading-relaxed font-serif-serif italic">
          Tippe in den Nachthimmel, um eine neue Sternschnuppe zu schicken. Jede Botschaft leuchtet in Echtzeit für euch beide.
        </p>
      </div>

      {/* 2. Interactive Sky Canvas */}
      <div
        ref={skyContainerRef}
        onClick={handleSkyClick}
        className="relative w-full h-[500px] sm:h-[600px] rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#02060e] via-[#050f1e] to-[#0a172e] border-2 border-[#dfba61]/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-crosshair group select-none"
      >
        {/* Celestial Atmos */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-[#1e2952]/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] rounded-full bg-[#dfba61]/5 blur-[120px] pointer-events-none" />

        {/* Distant Stars */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                top: `${(i * 13) % 98}%`,
                left: `${(i * 31) % 98}%`,
                width: `${(i % 2) + 1}px`,
                height: `${(i % 2) + 1}px`,
                opacity: 0.1 + (i % 5) * 0.15,
                animation: `pulse ${(i % 3) + 3}s infinite ease-in-out`,
                animationDelay: `${(i % 5) * 0.8}s`,
              }}
            />
          ))}
        </div>

        {/* Dynamic Flying Meteor */}
        {flyingMeteor && (
          <div
            className="absolute pointer-events-none z-30 transition-opacity duration-150"
            style={{
              left: `${flyingMeteor.x}%`,
              top: `${flyingMeteor.y}%`,
              opacity: flyingMeteor.opacity,
            }}
          >
            <CurvedShootingStar
              angle={flyingMeteor.angle}
              tailLength={40}
              curvature={flyingMeteor.curvature}
              starRadius={9}
              glowIntensity="bright"
            />
          </div>
        )}

        {/* Landing Beacon */}
        {clickPos && isAdding && (
          <div
            className="star-element absolute pointer-events-none z-20"
            style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%` }}
          >
            <CurvedShootingStar
              angle={clickPos.angle}
              tailLength={34}
              curvature={clickPos.curvature}
              starRadius={9}
              glowIntensity="bright"
            />
            <div className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#fae298]/20 blur-md animate-pulse" />
          </div>
        )}

        {/* Active Stars in the Heavens */}
        {stars.map((s, idx) => {
          const tailAngle = s.angle ?? (idx % 2 === 0 ? 44 : 136);
          const curvature = s.curvature ?? (tailAngle > 90 ? -10 : 10);
          const isHovered = hoveredStarId === s.id;
          const hasExpiryDate = Boolean(s.expiresAt);

          return (
            <div
              key={s.id}
              onClick={(e) => { e.stopPropagation(); setSelectedStar(s); }}
              onMouseEnter={() => setHoveredStarId(s.id)}
              onMouseLeave={() => setHoveredStarId(null)}
              className="star-element absolute cursor-pointer group/meteor z-10 select-none touch-manipulation"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            >
              <CurvedShootingStar
                angle={tailAngle}
                tailLength={s.size === 'large' ? 42 : 34}
                curvature={curvature}
                starRadius={s.size === 'large' ? 10 : 8.5}
                isHovered={isHovered}
              />

              {/* Floating Marquee Label */}
              <div className="absolute top-6 left-0 -translate-x-1/2 whitespace-nowrap flex items-center gap-2 bg-[#071920]/90 border border-[#dfba61]/40 text-[#ebd8c8] text-[11px] font-bold px-3 py-1 rounded-full opacity-0 group-hover/meteor:opacity-100 transition-all duration-300 shadow-2xl scale-90 group-hover/meteor:scale-100 pointer-events-none overflow-hidden max-w-[150px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  {s.authorRole === 'sonne' ? <Sun className="w-3 h-3 text-[#dfba61]" /> : s.authorRole === 'mond' ? <Moon className="w-3 h-3 text-[#f5d77f]" /> : null}
                  <div className="overflow-hidden whitespace-nowrap relative [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]">
                    <div className="animate-marquee inline-flex gap-4">
                      <span>{s.title}</span>
                      {hasExpiryDate && <Clock className="w-3 h-3 text-[#f5d77f]" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Instructions */}
        <div className="absolute bottom-6 left-6 right-6 pointer-events-none flex justify-between items-center text-[10px] sm:text-xs text-white/60 bg-black/40 px-5 py-3 rounded-2xl backdrop-blur-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#dfba61] shadow-[0_0_10px_#dfba61] animate-pulse" />
            <span>Klicke am Himmel, um eine Sternschnuppe zu schicken</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[#f5d77f]">
            <Sparkles className="w-3 h-3" />
            <span className="font-bold">{stars.length} Sterne leuchten</span>
          </div>
        </div>
      </div>

      {/* 3. Redesigned Overview List */}
      {stars.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <h3 className="font-serif-serif text-2xl font-bold gold-gradient-text">Übersicht aller Wünsche</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-[#dfba61]/40 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stars.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStar(s)}
                className="group relative text-left p-6 rounded-3xl bg-[#0a232c] border-2 border-[#dfba61]/20 hover:border-[#dfba61]/60 transition-all duration-500 shadow-xl hover:shadow-[#dfba61]/10 flex flex-col justify-between min-h-[180px] overflow-hidden"
              >
                {/* Subtle Background Icon */}
                <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 group-hover:rotate-0 duration-700">
                  {s.authorRole === 'sonne' ? <Sun className="w-32 h-32 text-[#dfba61]" /> : <Moon className="w-32 h-32 text-[#dfba61]" />}
                </div>

                <div className="relative z-10 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#dfba61]/10 flex items-center justify-center border border-[#dfba61]/30">
                        {s.authorRole === 'sonne' ? <Sun className="w-4 h-4 text-[#dfba61]" /> : <Moon className="w-4 h-4 text-[#f5d77f]" />}
                      </div>
                      <span className="text-[10px] font-bold text-[#dfba61] uppercase tracking-tighter">{s.author}</span>
                    </div>
                    {s.expiresAt && <Clock className="w-3.5 h-3.5 text-[#f5d77f] animate-pulse" />}
                  </div>

                  <div>
                    <h4 className="font-serif-serif text-lg font-bold text-[#ebd8c8] group-hover:text-white transition-colors line-clamp-1">{s.title}</h4>
                    <p className="text-xs text-white/50 line-clamp-3 mt-1 font-serif-serif italic leading-relaxed">"{s.content}"</p>
                  </div>
                </div>

                <div className="relative z-10 pt-4 flex justify-between items-center border-t border-white/5 mt-auto">
                  <span className="text-[10px] text-white/30 font-mono">{s.date}</span>
                  <div className="flex items-center gap-1 text-[#dfba61] text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                    <span>Lesen</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Modals */}
      {selectedStar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedStar(null)} />
          <div className="relative w-full max-w-xl bg-[#0a232c] border-2 border-[#dfba61] rounded-[2.5rem] shadow-[0_0_100px_rgba(223,186,97,0.15)] p-8 sm:p-12 text-white animate-fade-in-up">
            
            <button
              onClick={() => setSelectedStar(null)}
              className="absolute top-6 right-6 p-2 text-white/40 hover:text-white rounded-full bg-white/5 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full gold-gradient-btn flex items-center justify-center text-[#0a232c] shadow-[0_0_30px_rgba(223,186,97,0.4)]">
                {selectedStar.authorRole === 'mond' ? <Moon className="w-8 h-8" /> : <Sun className="w-8 h-8" />}
              </div>

              <div className="space-y-2">
                <h3 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text tracking-tight">
                  {selectedStar.title}
                </h3>
                <div className="flex items-center justify-center gap-3 text-xs text-white/50 uppercase tracking-widest font-bold">
                  <span>{selectedStar.date}</span>
                  <span className="w-1 h-1 rounded-full bg-[#dfba61]" />
                  <span className="text-[#f5d77f]">Von {selectedStar.author}</span>
                </div>
              </div>

              <div className="w-full font-serif-serif text-xl sm:text-2xl leading-relaxed text-[#ebd8c8] italic bg-black/30 p-8 rounded-[2rem] border border-[#dfba61]/20 relative">
                <Sparkles className="absolute -top-3 -left-3 w-8 h-8 text-[#dfba61]/30" />
                <span className="relative z-10 whitespace-pre-line">"{selectedStar.content}"</span>
                <Sparkles className="absolute -bottom-3 -right-3 w-8 h-8 text-[#dfba61]/30" />
              </div>

              {selectedStar.expiresAt && (() => {
                const info = formatExpiryNotice(selectedStar.expiresAt);
                if (!info) return null;
                return (
                  <div className="w-full p-5 rounded-2xl bg-[#071920] border border-[#dfba61]/30 flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-full bg-[#dfba61]/10 flex items-center justify-center border border-[#dfba61]/20">
                      <Clock className="w-5 h-5 text-[#dfba61]" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#dfba61] uppercase tracking-widest">Termin Gültig bis</div>
                      <div className="text-sm font-serif-serif">{info.formattedDate} ({info.relativeStr})</div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between w-full pt-4">
                <button
                  onClick={() => handleDeleteStar(selectedStar.id)}
                  className="flex items-center gap-2 text-xs text-white/30 hover:text-red-400 transition-colors group"
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Stern verabschieden</span>
                </button>
                <button
                  onClick={() => setSelectedStar(null)}
                  className="gold-gradient-btn px-10 py-3 rounded-full text-[#0a232c] font-black text-sm uppercase tracking-tighter active:scale-95 transition-all shadow-xl"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Star Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { setIsAdding(false); setClickPos(null); }} />
          <div className="relative w-full max-w-lg bg-[#0a232c] border-2 border-[#dfba61] rounded-[2.5rem] shadow-2xl p-8 sm:p-10 text-white animate-fade-in-up">
            
            <button
              onClick={() => { setIsAdding(false); setClickPos(null); }}
              className="absolute top-6 right-6 p-2 text-white/40 hover:text-white rounded-full bg-white/5 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center space-y-4 mb-8">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold text-[#dfba61] uppercase tracking-widest bg-[#dfba61]/10 px-3 py-1 rounded-full border border-[#dfba61]/20">
                {role === 'sonne' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                <span>Schreiben als {displayName}</span>
              </div>
              <h3 className="font-serif-serif text-3xl font-bold gold-gradient-text">Wunsch verewigen</h3>
              <p className="text-xs text-white/50 italic leading-relaxed">
                Deine Sternschnuppe ist gelandet. Verleihe ihr nun deine Worte.
              </p>
            </div>

            <form onSubmit={handleAddStar} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#dfba61] uppercase tracking-widest ml-1">Titel</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Unser nächstes Abenteuer..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#dfba61] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#dfba61] uppercase tracking-widest ml-1">Botschaft</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Was möchtest du sagen? Dein Wunsch wird im Himmel leuchten..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#dfba61] transition-all italic font-serif-serif"
                />
              </div>

              {/* Appointment / Expiry */}
              <div className="p-6 rounded-3xl bg-black/30 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#dfba61]/10 flex items-center justify-center border border-[#dfba61]/20">
                      <Calendar className="w-5 h-5 text-[#dfba61]" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#dfba61] uppercase tracking-widest">Termin setzen</div>
                      <div className="text-[9px] text-white/40">Löscht sich nach Ablauf automatisch</div>
                    </div>
                  </div>
                  <div 
                    onClick={() => setHasExpiry(!hasExpiry)}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${hasExpiry ? 'bg-[#dfba61]' : 'bg-white/10'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${hasExpiry ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>

                {hasExpiry && (
                  <div className="space-y-4 pt-2 animate-fade-in">
                    <div className="flex flex-wrap gap-2">
                      {[12, 24, 72, 168].map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleSetPresetExpiry(h)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-[#dfba61]/40 text-[10px] text-white/70 hover:text-[#f5d77f] transition-all"
                        >
                          {h === 24 ? 'Morgen' : h === 168 ? '1 Woche' : `${h} Std.`}
                        </button>
                      ))}
                    </div>
                    <input
                      type="datetime-local"
                      value={expiryDateTime}
                      onChange={(e) => setExpiryDateTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#dfba61]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setClickPos(null); }}
                  className="flex-1 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-[2] flex items-center justify-center gap-2 px-8 py-4 rounded-full gold-gradient-btn text-[#0a232c] font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Verewigen</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
