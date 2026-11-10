import React, { useState, useEffect } from 'react';
import { Mail, Trash2, Clock, Trash } from 'lucide-react';
import { getNotificationLogs, clearNotificationLogs, removeNotificationLogEntry } from '../services/notificationService';
import { NotificationLogEntry } from '../types';

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

  const handleClearLogs = () => {
    clearNotificationLogs();
  };

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

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif-serif text-3xl font-bold gold-gradient-text flex items-center gap-3">
          <Mail className="w-8 h-8 text-[#dfba61]" />
          Nachrichten
        </h1>
      </div>

      <div className="bg-[#0a232c] border border-[#c79b78]/30 rounded-3xl p-6 shadow-xl">
        {logs.length === 0 ? (
          <div className="py-12 text-center space-y-4">
            <Clock className="w-12 h-12 text-white/20 mx-auto" />
            <p className="text-sm text-white/60">
              Noch keine Mitteilungen im Log vorhanden.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-2xl border text-sm space-y-1.5 transition relative group ${
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
                    <span className="font-bold text-[#ebd8c8]">
                      {log.title}
                    </span>
                  </div>
                  {/* Top Right: Date/Time */}
                  <span className="text-[11px] text-white/50 shrink-0">
                    {log.timestamp}
                  </span>
                </div>

                {/* Body */}
                {log.body && (
                  <p className="text-[13px] text-white/80 leading-relaxed pl-1">
                    {log.body}
                  </p>
                )}
                
                {/* Bottom Right: Trash */}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleRemoveLog(log.id)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-rose-300 hover:bg-white/5 transition"
                    title="Nachricht löschen"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
