import React, { useState, useEffect, useRef } from 'react';
import { StarNote } from '../types';
import { X, Send, Calendar, Clock, Trash2, Sun, Moon, Sparkles, CheckCircle2 } from 'lucide-react';
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

  const [stars, setStars] = useState<StarNote[]>(() => {
    try {
      const saved = localStorage.getItem('sun_moon_stars');
      if (saved) {
        const parsed: StarNote[] = JSON.parse(saved);
        return parsed.map((s, idx) => normalizeStar(s, idx));
      }
      return DEFAULT_STARS;
    } catch {
      return DEFAULT_STARS;
    }
  });

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

        const cloudStars: StarNote[] = [];
        snapshot.docs.forEach((d) => {
          const data = d.data() as StarNote;
          const starId = d.id;

          // Check if star has an expiration date that already passed
          if (data.expiresAt) {
            const expTime = new Date(data.expiresAt).getTime();
            if (!isNaN(expTime) && expTime <= now) {
              // Automatically delete expired star from Firestore
              deleteDoc(doc(db, 'shooting_stars', starId)).catch(console.error);
              return; // Do not display
            }
          }

          cloudStars.push(normalizeStar({ ...data, id: starId }, cloudStars.length));
        });

        setStars(cloudStars);
        try {
          localStorage.setItem('sun_moon_stars', JSON.stringify(cloudStars));
        } catch {
          // Ignore storage quota
        }
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
    // Format to YYYY-MM-DDTHH:mm for datetime-local input
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

    // Save directly to Firestore for live real-time sync with partner
    try {
      await setDoc(doc(db, 'shooting_stars', starId), newStarNote);
    } catch (err) {
      console.warn('Could not save star to Firestore, keeping locally:', err);
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
      console.error('Failed to delete star from cloud:', err);
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (diffMs <= 0) {
      return {
        formattedDate,
        relativeStr: 'Termin ist erreicht',
      };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let relativeStr = '';
    if (diffDays > 0) {
      relativeStr = `noch ca. ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tage'}`;
    } else {
      relativeStr = `noch ca. ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`;
    }

    return {
      formattedDate,
      relativeStr,
    };
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Title & Intro Banner with Cloud Status */}
      <div className="text-center space-y-2 text-white">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dfba61]/20 border border-[#dfba61]/40 text-[#f5d77f] text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Echtzeit-Sternenhimmel für Sonne & Mond</span>
        </div>
        <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
          Sternschnuppen
        </h2>
        <p className="text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
          Tippe auf eine Sternschnuppe, um liebevolle Worte zu lesen – oder klicke an eine freie Stelle am Himmel: Eine feine Sternschnuppe zieht in weicher, sanfter Flugbahn genau an deinen gewählten Ort.
        </p>
      </div>

      {/* Interactive Canvas Sky Box: Deep pure midnight sky */}
      <div
        ref={skyContainerRef}
        onClick={handleSkyClick}
        className="relative w-full h-[460px] sm:h-[540px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#050505] via-[#101010] to-[#1a1a1a] border-2 border-[#dfba61]/60 shadow-2xl cursor-crosshair group select-none"
      >
        
        {/* Celestial Deep Space Atmospheric Glows */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-[#dfba61]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-[#dfba61]/5 blur-3xl pointer-events-none" />

        {/* Ambient background micro-stars */}
        <div className="absolute inset-0 pointer-events-none opacity-45">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                top: `${(i * 17) % 95}%`,
                left: `${(i * 23) % 95}%`,
                width: `${(i % 3) + 1}px`,
                height: `${(i % 3) + 1}px`,
                opacity: 0.25 + (i % 4) * 0.2,
                animation: `pulse ${(i % 4) + 2.5}s infinite ease-in-out`,
                animationDelay: `${(i % 5) * 0.7}s`,
              }}
            />
          ))}
        </div>

        {/* Dynamic Flying Shooting Star */}
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
              tailLength={38}
              curvature={flyingMeteor.curvature}
              starRadius={8.5}
              glowIntensity="bright"
            />
          </div>
        )}

        {/* Active Landing Beacon (when write modal is open) */}
        {clickPos && isAdding && (
          <div
            className="star-element absolute pointer-events-none z-20"
            style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%` }}
          >
            <CurvedShootingStar
              angle={clickPos.angle}
              tailLength={32}
              curvature={clickPos.curvature}
              starRadius={8.5}
              glowIntensity="bright"
            />
            <div className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#fae298]/30 blur-sm animate-pulse" />
            <span className="absolute top-6 left-0 -translate-x-1/2 whitespace-nowrap bg-black/90 border border-[#dfba61] text-[#fff5c5] text-[11px] font-medium px-3 py-1 rounded-full shadow-2xl">
              Stern gelandet · Schreibe deinen Wunsch
            </span>
          </div>
        )}

        {/* All Existing Authentic Shooting Stars */}
        {stars.map((s, idx) => {
          const tailAngle = s.angle ?? (idx % 2 === 0 ? 44 : 136);
          const curvature = s.curvature ?? (tailAngle > 90 ? -10 : 10);
          const isLarge = s.size === 'large';
          const tailLength = isLarge ? 38 : 32;
          const starRadius = isLarge ? 9.2 : 8.0;
          const isHovered = hoveredStarId === s.id;
          const hasExpiryDate = Boolean(s.expiresAt);

          return (
            <div
              key={s.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStar(s);
              }}
              onMouseEnter={() => setHoveredStarId(s.id)}
              onMouseLeave={() => setHoveredStarId(null)}
              className="star-element absolute cursor-pointer group/meteor z-10 select-none"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            >
              {/* Refined Star with all points visible & soft background curved tail */}
              <CurvedShootingStar
                angle={tailAngle}
                tailLength={tailLength}
                curvature={curvature}
                starRadius={starRadius}
                isHovered={isHovered}
              />

              {/* Hit area centered directly over the star */}
              <div className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#fae298]/20 blur-sm group-hover/meteor:scale-150 transition-transform duration-300" />
              </div>

              {/* Elegant Minimal Title Tag with author indicator and expiration badge */}
              <div className="absolute top-5 left-0 -translate-x-1/2 whitespace-nowrap flex items-center gap-1.5 bg-black/85 border border-[#dfba61]/60 text-[#fae298] text-[11px] font-medium px-2.5 py-0.5 rounded-full opacity-80 group-hover/meteor:opacity-100 transition-opacity shadow-xl pointer-events-none">
                {s.authorRole === 'sonne' ? (
                  <Sun className="w-2.5 h-2.5 text-[#dfba61]" />
                ) : s.authorRole === 'mond' ? (
                  <Moon className="w-2.5 h-2.5 text-[#f5d77f]" />
                ) : null}
                <span>{s.title}</span>
                {hasExpiryDate && (
                  <span className="text-[9px] text-[#f5d77f] bg-white/10 px-1 py-0.2 rounded flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Termin</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Instructions overlay banner */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex justify-between items-center text-xs text-white/80 bg-black/60 px-4 py-2.5 rounded-xl backdrop-blur-md border border-[#dfba61]/30">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#fae298] inline-block shadow-[0_0_6px_#fae298]" />
            Tippe irgendwo am Himmel: Deine Sternschnuppe zieht live für euch beide ein
          </span>
          <span className="hidden sm:inline font-medium text-[#fae298]">
            {stars.length} {stars.length === 1 ? 'Sternschnuppe' : 'Sternschnuppen'} aktiv
          </span>
        </div>

      </div>

      {stars.length > 0 && (
        <div className="bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl p-6 shadow-2xl text-white">
          <h3 className="font-serif-serif text-xl font-bold gold-gradient-text mb-4 text-center">
            Alle Sternschnuppen im Überblick
          </h3>
          <div className="space-y-4">
            {stars.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-[#dfba61]/50 transition cursor-pointer"
                onClick={() => setSelectedStar(s)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-white/90 text-sm truncate">{s.title}</h4>
                  <span className="text-[10px] text-white/40 shrink-0 ml-2">{s.date}</span>
                </div>
                <p className="text-xs text-white/60 line-clamp-2">{s.content}</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-white/40">
                  <span>{s.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shooting Star View Modal */}
      {selectedStar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl shadow-2xl p-6 sm:p-8 text-white space-y-6">
            
            <button
              onClick={() => setSelectedStar(null)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Edit Mode Content */}
            <div className="space-y-4">
              <input
                type="text"
                value={selectedStar.title}
                onChange={(e) => setSelectedStar({ ...selectedStar, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-lg font-bold focus:outline-none focus:border-[#dfba61]"
              />
              <textarea
                rows={3}
                value={selectedStar.content}
                onChange={(e) => setSelectedStar({ ...selectedStar, content: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-sm focus:outline-none focus:border-[#dfba61]"
              />
              
              {/* Expiry Editor */}
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#dfba61]" />
                    <span className="text-xs font-medium text-white/90">
                      Termin setzen
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!selectedStar.expiresAt}
                    onChange={(e) => {
                      const newExpiry = e.target.checked ? new Date(new Date().setHours(23, 59, 0, 0)).toISOString() : null;
                      setSelectedStar({ ...selectedStar, expiresAt: newExpiry });
                    }}
                    className="w-4 h-4 accent-[#dfba61] rounded cursor-pointer"
                  />
                </div>
                {selectedStar.expiresAt && (
                  <input
                    type="datetime-local"
                    value={selectedStar.expiresAt.substring(0, 16)}
                    onChange={(e) => setSelectedStar({ ...selectedStar, expiresAt: new Date(e.target.value).toISOString() })}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/20 text-white text-xs focus:outline-none focus:border-[#dfba61]"
                  />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => { handleDeleteStar(selectedStar.id); setSelectedStar(null); }}
                className="p-2 text-white/50 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
                title="Sternschnuppe löschen"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <button
                onClick={async () => {
                  try {
                    await setDoc(doc(db, 'shooting_stars', selectedStar.id), selectedStar);
                    setSelectedStar(null);
                  } catch (err) {
                    console.error('Failed to update star:', err);
                  }
                }}
                className="px-6 py-2.5 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs transition shadow"
              >
                Speichern
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Star Modal (Opens calmly after the shooting star arrives) */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0a232c] border-2 border-[#dfba61] rounded-2xl shadow-2xl p-6 text-white space-y-4">
            
            <button
              onClick={() => { setIsAdding(false); setClickPos(null); }}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
              title="Abbrechen"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs text-[#dfba61] font-semibold mb-1">
                {role === 'sonne' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>Als {displayName}</span>
              </div>
              <h3 className="font-serif-serif text-xl sm:text-2xl font-bold gold-gradient-text">
                Sternschnuppe verewigen
              </h3>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                Deine Sternschnuppe ist gelandet. Sie wird live in der Cloud gespeichert und ist für euch beide sichtbar.
              </p>
            </div>

            <form onSubmit={handleAddStar} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/90 mb-1">Titel der Sternschnuppe</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Für mein Herz, Ein Date am See, Unser Versprechen..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#dfba61]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/90 mb-1">Deine Botschaft / Wunsch</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Schreibe etwas Liebevolles oder deinen Herzenswunsch..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#dfba61]"
                />
              </div>

              {/* Requirement 2: Optional Appointment / Expiration date */}
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#dfba61]" />
                    <span className="text-xs font-medium text-white/90">
                      Termin setzen (löscht sich nach Ablauf)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="hasExpiry"
                    checked={hasExpiry}
                    onChange={(e) => setHasExpiry(e.target.checked)}
                    className="w-4 h-4 accent-[#dfba61] rounded cursor-pointer"
                  />
                </div>

                {hasExpiry && (
                  <div className="space-y-2.5 pt-1 animate-fade-in">
                    <p className="text-[11px] text-white/70">
                      Sobald dieser Zeitpunkt erreicht ist, verblasst die Sternschnuppe sanft und wird automatisch aus eurem Himmel gelöscht.
                    </p>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSetPresetExpiry(12)}
                        className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 transition text-[11px]"
                      >
                        In 12 Stunden
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPresetExpiry(24)}
                        className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 transition text-[11px]"
                      >
                        Morgen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPresetExpiry(72)}
                        className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 transition text-[11px]"
                      >
                        In 3 Tagen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPresetExpiry(168)}
                        className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 transition text-[11px]"
                      >
                        In 1 Woche
                      </button>
                    </div>

                    <div className="pt-1">
                      <label className="block text-[11px] text-white/60 mb-1">Datum & Uhrzeit:</label>
                      <input
                        type="datetime-local"
                        value={expiryDateTime}
                        onChange={(e) => setExpiryDateTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/20 text-white text-xs focus:outline-none focus:border-[#dfba61]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setClickPos(null); }}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-white/70 hover:bg-white/10"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg gold-gradient-btn text-[#0a232c] font-bold text-xs transition shadow"
                >
                  <Send className="w-3.5 h-3.5 text-[#0a232c]" />
                  <span>Sternschnuppe verewigen</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
