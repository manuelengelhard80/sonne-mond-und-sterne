import React, { useState, useEffect } from 'react';
import { Mail, Clock, Trash, ExternalLink } from 'lucide-react';
import { getNotificationLogs, removeNotificationLogEntry } from '../services/notificationService';
import { NotificationLogEntry, ActiveTab } from '../types';
import { useUserRole } from '../context/UserRoleContext';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

export const Messages: React.FC = () => {
  const { role } = useUserRole();
  const [messages, setMessages] = useState<NotificationLogEntry[]>([]);

  useEffect(() => {
    // 1. Real-time Firestore sync with partner_notifications
    let firestoreEntries: NotificationLogEntry[] = [];
    const unsub = onSnapshot(collection(db, 'partner_notifications'), (snapshot) => {
      const cloudList: NotificationLogEntry[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        // Strictly filter to messages addressed to this device's role
        if (data.targetRole === role) {
          cloudList.push({
            id: docSnap.id,
            timestamp: data.timestamp || new Date(data.createdAt || Date.now()).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            title: data.title,
            body: data.body,
            isTest: false,
            type: data.type || 'system',
            targetRole: data.targetRole,
          });
        }
      });
      firestoreEntries = cloudList;
      mergeAndSetMessages();
    }, (err) => {
      console.warn('Messages partner_notifications listener notice:', err);
    });

    // 2. Local storage sync (for Morgen Affirmation and local events)
    const mergeAndSetMessages = () => {
      const localLogs = getNotificationLogs().filter((l) => {
        if (l.isTest) return false; // Testnachrichten nur im Mitteilungs-Log!
        if (l.targetRole && l.targetRole !== role) return false;
        return true;
      });

      // Merge firestore and local logs, deduplicating by ID
      const map = new Map<string, NotificationLogEntry>();
      // First add cloud entries
      firestoreEntries.forEach((m) => map.set(m.id, m));
      // Then add local entries (unless already in map)
      localLogs.forEach((l) => {
        if (!map.has(l.id)) {
          map.set(l.id, l);
        }
      });

      const combined = Array.from(map.values());
      // Sort newest first based on id or timestamp
      combined.sort((a, b) => b.id.localeCompare(a.id));
      setMessages(combined);

      // Update last read ID so badge clears
      if (combined.length > 0) {
        localStorage.setItem('last_read_log_id', combined[0].id);
        window.dispatchEvent(new CustomEvent('notification-log-updated'));
      }
    };

    mergeAndSetMessages();
    window.addEventListener('notification-log-updated', mergeAndSetMessages);

    return () => {
      unsub();
      window.removeEventListener('notification-log-updated', mergeAndSetMessages);
    };
  }, [role]);

  const handleRemoveMessage = async (id: string) => {
    // Delete from Firestore if it exists there
    try {
      await deleteDoc(doc(db, 'partner_notifications', id));
    } catch (_) {}
    // Delete from local storage
    removeNotificationLogEntry(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const getTargetTabForLog = (log: NotificationLogEntry): { tab: ActiveTab; label: string } | null => {
    // User requested NO linking for Affirmation, Geführte Meditation, Himmelsbegegnung, Sommernacht am See, Paar-Meditation, Traumreise
    if (log.type === 'sternschnuppe' || log.title.includes('Sternschnuppe')) {
      return { tab: 'stars', label: '🌠 Zur Unterseite Sternschnuppen' };
    }
    if (log.type === 'gedanken' || log.title.includes('Gedanken')) {
      return { tab: 'journal', label: '💌 Zu Gedanken teilen' };
    }
    return null;
  };

  // Helper to extract or supply emoji for notification icon
  const getEmojiForMessage = (log: NotificationLogEntry): string => {
    if (log.title.includes('🌅') || log.type === 'morgen_affirmation') return '🌅';
    if (log.title.includes('🌠') || log.type === 'sternschnuppe') return '🌠';
    if (log.title.includes('💌') || log.type === 'gedanken') return '💌';
    if (log.title.includes('☀️🌕') || log.type === 'himmelsbegegnung') return '☀️🌕';
    if (log.title.includes('✨') || log.type === 'lake') return '✨';
    if (log.title.includes('🧘💞')) return '🧘💞';
    if (log.title.includes('🧘')) return '🧘';
    if (log.title.includes('🛋️')) return '🛋️';
    return '✨';
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 p-6 sm:p-10 rounded-2xl bg-[#0a232c] shadow-2xl border-2 border-[#dfba61] text-white">
      {/* Header in the exact style of Gedanken teilen */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#dfba61]/30 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#e6d3a3] text-xs font-semibold uppercase tracking-wider mb-1">
            <Mail className="w-3.5 h-3.5 text-[#dfba61]" /> Empfangene Mitteilungen
          </div>
          <h2 className="font-serif-serif text-3xl sm:text-4xl font-bold gold-gradient-text">
            Nachrichten
          </h2>
          <p className="text-xs text-white/70 mt-1">
            Alle Benachrichtigungen und liebevollen Botschaften, die dich erreicht haben.
          </p>
        </div>
      </div>

      <div>
        {messages.length === 0 ? (
          <div className="py-12 text-center space-y-4">
            <Clock className="w-12 h-12 text-white/20 mx-auto" />
            <p className="text-sm text-white/60">
              Noch keine Mitteilungen im Postfach vorhanden.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((log) => {
              const targetInfo = getTargetTabForLog(log);
              const emoji = getEmojiForMessage(log);

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl border text-sm space-y-2 transition relative group bg-white/5 border-white/10 text-white"
                >
                  {/* Header Line with Emoji from title */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none shrink-0">{emoji}</span>
                      <span className="font-bold text-[#ebd8c8]">
                        {log.title}
                      </span>
                    </div>
                    {/* Top Right: Date/Time */}
                    <span className="text-[11px] text-white/50 shrink-0 text-right">
                      {log.timestamp}
                    </span>
                  </div>

                  {/* Body */}
                  {log.body && (
                    <p className="text-[13px] text-white/80 leading-relaxed pl-1 whitespace-pre-line">
                      {log.body}
                    </p>
                  )}
                  
                  {/* Bottom Bar: Action Link (only for stars & thoughts) + Trash */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    {targetInfo ? (
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: targetInfo.tab } }))}
                        className="text-xs font-bold text-[#dfba61] hover:text-[#ebd8c8] hover:underline flex items-center gap-1.5 cursor-pointer py-1"
                      >
                        <span>{targetInfo.label}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#dfba61]" />
                      </button>
                    ) : (
                      <div />
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMessage(log.id);
                      }}
                      className="p-1.5 rounded-lg text-white/30 hover:text-rose-300 hover:bg-white/5 transition cursor-pointer"
                      title="Nachricht löschen"
                      aria-label="Nachricht löschen"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
