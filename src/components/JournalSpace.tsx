import React, { useState, useEffect } from 'react';
import { JournalEntry } from '../types';
import { Heart, Plus, Trash2, Calendar, Sun, Moon, Sparkles, Cloud, Users, RefreshCw, Copy, Check, Quote, Send } from 'lucide-react';
import { soundSynth } from '../services/soundSynth';
import { useUserRole } from '../context/UserRoleContext';
import { db, ensureAuthenticated } from '../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { sendAppNotification } from '../services/notificationService';

const DAILY_AFFIRMATIONS: string[] = [
  "Du musst heute niemandem etwas beweisen. Dein Dasein allein ist wertvoll und vollkommen genug.",
  "So wie die Sonne jeden Morgen verlässlich aufgeht, darfst auch du deinem ganz eigenen Rhythmus vertrauen.",
  "Atme tief ein: Du bist geliebt, beschützt und sanft getragen – genau so, wie du jetzt gerade bist.",
  "Nimm dir die Zeit, die du brauchst. Die Welt wartet auf dich, ganz ohne Eile und ohne Druck.",
  "In der Stille liegt deine innere Kraft. Es ist vollkommen in Ordnung, heute einfach nur zu sein.",
  "Deine Wärme erhellt das Leben der Menschen um dich herum, selbst in Momenten, in denen du es nicht merkst.",
  "Du bist stärker, als du in schweren Momenten glaubst, und unendlich wertvoller, als du ahnst.",
  "Erlaube dir selbst, Pausen einzulegen und durchzuatmen. Perfektion ist keine Voraussetzung für Liebe.",
  "Deine Gefühle haben Gewicht und Sinn. Gib ihnen liebevollen Raum, ohne dich von ihnen erdrücken zu lassen.",
  "Wie Sonne, Mond und Sterne ihren Platz am Himmel haben, gehörst du unersetzbar und einzigartig hierher.",
  "Lass die Erwartungen anderer sanft an dir vorbeiziehen. Dieser Augenblick gehört deiner inneren Ruhe.",
  "Jeder noch so kleine Schritt auf deinem Weg verdient Aufmerksamkeit. Sei sanft und stolz auf dich.",
  "Schenke dir selbst heute genau die Wärme und Sanftheit, die du allen anderen so großzügig schenkst.",
  "Du darfst Anspannung loslassen und deine Schultern senken. Es ist für alles gesorgt.",
  "Selbst hinter den dichtesten Wolken leuchten die Sterne unverändert – genau wie dein inneres Licht.",
  "Es liegt eine tiefe, wunderschöne Güte in der Art, wie du durch die Welt gehst.",
  "Erinnere dich daran: Schön, dass es dich gibt. Genau in diesem Universum, genau jetzt."
];

const INITIAL_DEFAULT_ENTRIES: JournalEntry[] = [
  {
    id: 'thought-welcome-1',
    timestamp: 'Heute',
    title: 'Unser gemeinsamer Raum',
    content: 'Dies ist unser Rückzugsort, um Gedanken, Wünsche und liebevolle Notizen miteinander zu teilen. Alles, was du hier schreibst, sieht der andere in Echtzeit.',
    mood: 'Sonnig',
    authorRole: 'sonne',
    authorName: 'Sonne & Mond',
    likes: ['mond', 'sonne'],
  }
];

export const JournalSpace: React.FC = () => {
  const { role, displayName, currentUserId } = useUserRole();

  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('sun_moon_journal');
      return saved ? JSON.parse(saved) : INITIAL_DEFAULT_ENTRIES;
    } catch {
      return INITIAL_DEFAULT_ENTRIES;
    }
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<JournalEntry['mood']>('Sonnig');
  const [isWriting, setIsWriting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Daily Affirmation state
  const [affirmation, setAffirmation] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Pick random affirmation on page load
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * DAILY_AFFIRMATIONS.length);
    setAffirmation(DAILY_AFFIRMATIONS[randomIndex]);
  }, []);

  // Real-time Cloud Sync for Shared Thoughts
  useEffect(() => {
    ensureAuthenticated().then(() => {
      const unsubscribe = onSnapshot(collection(db, 'shared_thoughts'), (snapshot) => {
        if (snapshot.empty) {
          // Seed the initial welcome thought into Firestore so it's ready for both
          INITIAL_DEFAULT_ENTRIES.forEach((e) => {
            setDoc(doc(db, 'shared_thoughts', e.id), e).catch(console.error);
          });
          return;
        }

        const cloudEntries: JournalEntry[] = [];
        snapshot.docs.forEach((d) => {
          cloudEntries.push({ ...(d.data() as JournalEntry), id: d.id });
        });

        // Sort newest first
        cloudEntries.sort((a, b) => {
          const timeA = a.id ? parseInt(a.id.replace('thought-', '')) || 0 : 0;
          const timeB = b.id ? parseInt(b.id.replace('thought-', '')) || 0 : 0;
          return timeB - timeA;
        });

        setEntries(cloudEntries);
        try {
          localStorage.setItem('sun_moon_journal', JSON.stringify(cloudEntries));
        } catch {
          // Ignore
        }
      }, (error) => {
        console.warn('Shared thoughts listener notice:', error);
      });

      return () => unsubscribe();
    }).catch(console.error);
  }, []);

  const handleRefreshAffirmation = () => {
    setIsRefreshing(true);
    soundSynth.playSoftBell();
    setTimeout(() => {
      let nextIndex = Math.floor(Math.random() * DAILY_AFFIRMATIONS.length);
      if (DAILY_AFFIRMATIONS.length > 1 && DAILY_AFFIRMATIONS[nextIndex] === affirmation) {
        nextIndex = (nextIndex + 1) % DAILY_AFFIRMATIONS.length;
      }
      setAffirmation(DAILY_AFFIRMATIONS[nextIndex]);
      setIsRefreshing(false);
    }, 300);
  };

  const handleCopyAffirmation = () => {
    navigator.clipboard.writeText(affirmation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleUseAffirmationInJournal = () => {
    setTitle('Gedanke zur Affirmation');
    setContent(`Tägliche Affirmation:\n"${affirmation}"\n\nMeine Gedanken dazu für uns:\n`);
    setIsWriting(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const user = await ensureAuthenticated();
    const thoughtId = `thought-${Date.now()}`;

    const newEntry: JournalEntry = {
      id: thoughtId,
      timestamp: new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      createdAt: new Date().toISOString(),
      title: title.trim() || 'Gedanke des Tages',
      content: content.trim(),
      mood,
      authorRole: role,
      authorName: displayName,
      authorUid: user?.uid || 'local-user',
      likes: [],
    };

    try {
      await setDoc(doc(db, 'shared_thoughts', thoughtId), newEntry);
      soundSynth.playSoftBell();
    } catch (err) {
      console.warn('Could not save thought to Firestore, keeping locally:', err);
      setEntries([newEntry, ...entries]);
    }

    sendAppNotification('💌 Gedanke geteilt!', {
      body: `"${title.trim() || 'Gedanke'}" wurde für euch beide geteilt.`,
      tag: `my-thought-${thoughtId}`,
    });

    setIsSubmitting(false);
    setTitle('');
    setContent('');
    setIsWriting(false);
  };

  const handleToggleLike = async (entryId: string, currentLikes: string[] = []) => {
    const hasLiked = currentLikes.includes(role);
    const updatedLikes = hasLiked
      ? currentLikes.filter((r) => r !== role)
      : [...currentLikes, role];

    soundSynth.playSoftBell();

    try {
      await updateDoc(doc(db, 'shared_thoughts', entryId), {
        likes: updatedLikes,
      });
    } catch (err) {
      console.error('Could not toggle like on thought:', err);
      // Local optimistic update
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, likes: updatedLikes } : e))
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shared_thoughts', id));
    } catch (err) {
      console.error('Failed to delete thought from cloud:', err);
    }
    setEntries(entries.filter((e) => e.id !== id));
  };

  const moodIcons = {
    Sonnig: <Sun className="w-4 h-4 text-[#e6d3a3]" />,
    Ruhig: <Moon className="w-4 h-4 text-[#f5d77f]" />,
    Sternenklar: <Sparkles className="w-4 h-4 text-[#dfba61]" />,
    Gedankenvoll: <Cloud className="w-4 h-4 text-teal-300" />,
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
      
      {/* Header with Cloud Sync Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#dfba61]/30 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#e6d3a3] text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" /> Euer geteilter Herzensraum (Live-Sync)
          </div>
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Gedanken teilen
          </h2>
          <p className="text-xs text-white/70 mt-1">
            Alles, was du hier schreibst, kann auch die andere Person in Echtzeit lesen und mit einem Herzchen erwidern.
          </p>
        </div>

        <button
          onClick={() => setIsWriting(!isWriting)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-sm shadow-lg transition transform hover:scale-105 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#0a232c]" />
          <span>{isWriting ? 'Schließen' : 'Gedanken schreiben'}</span>
        </button>
      </div>

      {/* Daily Affirmation Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#071920] via-[#0a232c] to-[#0f3844] text-white border-2 border-[#dfba61] shadow-xl space-y-4">
        
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#dfba61]/15 rounded-full blur-2xl pointer-events-none" />
        <Quote className="absolute top-4 right-4 w-12 h-12 text-white/5 pointer-events-none" />

        <div className="flex items-center justify-between text-xs font-semibold tracking-wider">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#e6d3a3]" />
            <span className="gold-gradient-text font-bold">Tägliche Affirmation</span>
          </div>

          <div className="flex items-center gap-2 text-white/80">
            <button
              onClick={handleRefreshAffirmation}
              disabled={isRefreshing}
              className="flex items-center gap-1 hover:text-white transition text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg"
              title="Neue Affirmation generieren"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Neuer Gedanke</span>
            </button>

            <button
              onClick={handleCopyAffirmation}
              className="flex items-center gap-1 hover:text-white transition text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg"
              title="Affirmation kopieren"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Kopiert' : 'Kopieren'}</span>
            </button>
          </div>
        </div>

        {/* Affirmation Text */}
        <p className="font-serif-serif text-xl sm:text-2xl italic leading-relaxed text-white drop-shadow-sm transition-all duration-300">
          "{affirmation}"
        </p>

        {/* Bottom CTA to reflect on this affirmation */}
        <div className="pt-2 flex justify-between items-center text-xs text-white/70 border-t border-white/10">
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-[#dfba61] fill-[#dfba61]" />
            <span>Für eure gemeinsame Achtsamkeit</span>
          </span>

          <button
            onClick={handleUseAffirmationInJournal}
            className="text-[#e6d3a3] hover:underline font-medium flex items-center gap-1"
          >
            <span>Dazu für euch schreiben</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Writing Form */}
      {isWriting && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#071920] border border-[#dfba61]/40 space-y-4 animate-fade-in">
          
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
            <div className="flex items-center gap-1.5 text-[#dfba61] font-semibold">
              {role === 'sonne' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-[#f5d77f]" />}
              <span>Du schreibst als: {displayName}</span>
            </div>
            <span className="text-white/60">Wird für beide in Echtzeit sichtbar</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Titel deiner Notiz (z.B. Ein leiser Gedanke, Für dich)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#dfba61]"
            />

            {/* Mood selector */}
            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/20 text-xs font-medium">
              {(['Sonnig', 'Ruhig', 'Sternenklar', 'Gedankenvoll'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMood(m)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                    mood === m ? 'gold-gradient-btn text-[#0a232c] font-bold' : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  {moodIcons[m]}
                  <span className="hidden sm:inline">{m}</span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            required
            rows={4}
            placeholder="Schreibe frei von Seele, für dich und für deinen Lieblingsmenschen..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-white/40 text-sm font-serif-serif text-base focus:outline-none focus:border-[#dfba61]"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:bg-white/10"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs shadow transition active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-[#0a232c]" />
              <span>Mit dem Partner teilen</span>
            </button>
          </div>
        </form>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="text-center py-12 text-white/60 font-serif-serif italic">
            Noch keine geteilten Gedanken vorhanden. Verfasse den ersten Gedanken für euch beide!
          </div>
        ) : (
          entries.map((item) => {
            const hasLiked = item.likes?.includes(role) ?? false;
            const partnerRole = role === 'sonne' ? 'mond' : 'sonne';
            const partnerLiked = item.likes?.includes(partnerRole) ?? false;

            return (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-[#071920] border border-[#dfba61]/30 shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-white/70">
                  <div className="flex items-center gap-2">
                    {/* Author Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        item.authorRole === 'sonne'
                          ? 'bg-[#dfba61]/20 border border-[#dfba61]/40 text-[#f5d77f]'
                          : item.authorRole === 'mond'
                          ? 'bg-[#f5d77f]/20 border border-[#f5d77f]/40 text-[#f5d77f]'
                          : 'bg-white/10 text-white/80'
                      }`}
                    >
                      {item.authorRole === 'sonne' ? (
                        <Sun className="w-3 h-3 text-[#dfba61]" />
                      ) : item.authorRole === 'mond' ? (
                        <Moon className="w-3 h-3 text-[#f5d77f]" />
                      ) : null}
                      <span>{item.authorName || (item.authorRole === 'sonne' ? 'Sonne' : 'Mond')}</span>
                    </span>

                    <span className="flex items-center gap-1.5 font-medium text-white/60">
                      {moodIcons[item.mood]}
                      <span>{item.mood}</span>
                      <span>·</span>
                      <Calendar className="w-3.5 h-3.5 text-white/40" />
                      <span>{item.timestamp}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-white/40 hover:text-red-400 p-1 transition"
                    title="Eintrag löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-serif-serif text-xl font-bold gold-gradient-text">
                  {item.title}
                </h3>

                <p className="font-serif-serif text-base text-white/90 leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>

                {/* Partner Heart Reaction Bar */}
                <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(item.id, item.likes)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition text-xs font-semibold ${
                        hasLiked
                          ? 'bg-rose-500/25 border border-rose-400/50 text-rose-300'
                          : 'bg-white/5 hover:bg-white/15 border border-white/10 text-white/70'
                      }`}
                      title={hasLiked ? 'Herzchen entfernen' : 'Herzchen schenken'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          hasLiked ? 'fill-rose-400 text-rose-400' : 'text-white/60'
                        }`}
                      />
                      <span>{hasLiked ? 'Mit Liebe gelesen' : 'Herzchen senden'}</span>
                    </button>

                    {/* Notice if partner reacted */}
                    {partnerLiked && (
                      <span className="text-[11px] text-[#f5d77f] flex items-center gap-1 bg-[#dfba61]/10 px-2.5 py-1 rounded-lg border border-[#dfba61]/30">
                        <Sparkles className="w-3 h-3 text-[#dfba61]" />
                        <span>Dein Partner hat diesen Gedanken mit Liebe gelesen ❤️</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-white/50">
                    Für beide synchronisiert
                  </span>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
