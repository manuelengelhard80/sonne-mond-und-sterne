import React, { useState, useEffect } from 'react';
import { Mail, Clock, Trash, ExternalLink } from 'lucide-react';
import { getNotificationLogs, removeNotificationLogEntry } from '../services/notificationService';
import { NotificationLogEntry, ActiveTab } from '../types';

export const Messages: React.FC = () => {
  const [logs, setLogs] = useState<NotificationLogEntry[]>([]);

  useEffect(() => {
    setLogs(getNotificationLogs());

    const handleLogUpdated = () => {
      setLogs(getNotificationLogs());
    };
    
    window.addEventListener('notification-log-updated', handleLogUpdated);
    return () => {
      window.removeEventListener('notification-log-updated', handleLogUpdated);
    };
  }, []);

  useEffect(() => {
    const logs = getNotificationLogs();
    if (logs.length > 0) {
      localStorage.setItem('last_read_log_id', logs[0].id);
      window.dispatchEvent(new CustomEvent('notification-log-updated'));
    }
  }, []);

  const handleRemoveLog = (id: string) => {
    removeNotificationLogEntry(id);
  };

  const getTargetTabForLog = (log: NotificationLogEntry): { tab: ActiveTab; label: string } | null => {
    if (log.type === 'sternschnuppe' || log.title.includes('Sternschnuppe')) {
      return { tab: 'stars', label: '🌠 Zur Unterseite Sternschnuppen' };
    }
    if (log.type === 'gedanken' || log.title.includes('Gedanken')) {
      return { tab: 'journal', label: '💌 Zu Gedanken teilen' };
    }
    if (log.type === 'lake' || log.title.includes('Sommernacht')) {
      return { tab: 'lake', label: '🌙🌊 Zu Sommernacht am See' };
    }
    if (log.type === 'himmelsbegegnung' || log.title.includes('Himmelsbegegnung')) {
      return { tab: 'story', label: '📖 Zur Geschichte' };
    }
    if (log.title.includes('Meditation')) {
      return { tab: 'meditation', label: '🧘 Zu den Meditationen' };
    }
    if (log.title.includes('Traumreise')) {
      return { tab: 'traumreisen', label: '🪶 Zu den Traumreisen' };
    }
    if (log.type === 'morgen_affirmation') {
      return { tab: 'reflection', label: '☀️ Zum Sonnenstrahl' };
    }
    return null;
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
        {logs.length === 0 ? (
          <div className="py-12 text-center space-y-4">
            <Clock className="w-12 h-12 text-white/20 mx-auto" />
            <p className="text-sm text-white/60">
              Noch keine Mitteilungen im Postfach vorhanden.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const targetInfo = getTargetTabForLog(log);
              return (
                <div
                  key={log.id}
                  className={`p-4 rounded-2xl border text-sm space-y-2 transition relative group ${
                    log.isTest
                      ? 'bg-[#c79b78]/10 border-[#c79b78]/40 text-white'
                      : 'bg-white/5 border-white/10 text-white'
                  }`}
                >
                  {/* Header Line */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {log.isTest && (
                        <span className="px-2 py-0.5 rounded-md bg-[#c79b78] text-[#071920] font-bold text-[10px] uppercase tracking-wider">
                          [TEST]
                        </span>
                      )}
                      <span className="font-bold text-[#ebd8c8] flex items-center gap-1.5">
                        {log.type === 'lake' || log.title.includes('Sommernacht am See') ? (
                          <>
                            <img
                              src="/lake-moon-icon.png"
                              className="w-5 h-5 rounded-full object-cover shrink-0 inline-block shadow-sm ring-1 ring-[#c79b78]/40"
                              alt="Sommernacht am See"
                            />
                            <span>{log.title.replace(/^[🌙🌊\s]+/, '').trim()}</span>
                          </>
                        ) : (
                          log.title
                        )}
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
                  
                  {/* Bottom Bar: Action Link + Trash */}
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
                        handleRemoveLog(log.id);
                      }}
                      className="p-1.5 rounded-lg text-white/30 hover:text-rose-300 hover:bg-white/5 transition"
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
