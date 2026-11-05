import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Sparkles, Sun, Moon, Clock, Check, X, Smartphone, AlertCircle } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
} from '../services/notificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { role, displayName } = useUserRole();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);
  const [morningEnabled, setMorningEnabled] = useState(true);

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : getNotificationPermission());
    if (granted) {
      await sendTestNotification(role);
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  const handleSendTest = async () => {
    const sent = await sendTestNotification(role);
    if (sent) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  const partnerLabel = role === 'sonne' ? 'Mond (Manuel)' : 'Sonne (Stefanie)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0a232c] border-2 border-[#dfba61] rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#dfba61]/20 border border-[#dfba61]/40 flex items-center justify-center text-[#dfba61]">
            <BellRing className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-serif-serif text-2xl sm:text-3xl font-bold gold-gradient-text">
            Handy-Benachrichtigungen
          </h3>
          <p className="text-xs sm:text-sm text-white/80 max-w-sm mx-auto">
            Bleibt sanft miteinander verbunden – egal wo ihr euch gerade befindet.
          </p>
        </div>

        {/* 3 Notifications Included */}
        <div className="space-y-3">
          
          {/* Feature 1: Shooting Star */}
          <div className="p-3.5 rounded-2xl bg-[#071920] border border-[#dfba61]/30 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#dfba61]/15 text-[#dfba61] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-[#f5d77f]">Neue Sternschnuppen</div>
              <p className="text-white/70">
                Du wirst sofort benachrichtigt, sobald {partnerLabel} eine neue Sternschnuppe an euren Himmel setzt.
              </p>
            </div>
          </div>

          {/* Feature 2: Shared Thought */}
          <div className="p-3.5 rounded-2xl bg-[#071920] border border-[#dfba61]/30 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#dfba61]/15 text-[#dfba61] shrink-0 mt-0.5">
              {role === 'sonne' ? <Moon className="w-4 h-4 text-[#38bdf8]" /> : <Sun className="w-4 h-4 text-[#dfba61]" />}
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-[#f5d77f]">Geteilte Gedanken</div>
              <p className="text-white/70">
                Erhaltet eine Mitteilung, wenn {partnerLabel} einen liebevollen Gedanken oder eine Notiz verfasst.
              </p>
            </div>
          </div>

          {/* Feature 3: Interaktive Himmelsbegegnung */}
          <div className="p-3.5 rounded-2xl bg-[#071920] border border-[#dfba61]/30 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#dfba61]/15 text-[#dfba61] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-[#f5d77f]" />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-[#f5d77f]">Himmelsbegegnung (Sonne & Mond)</div>
              <p className="text-white/70">
                Wenn du oder {partnerLabel} in der interaktiven Begegnung Sonne und Mond zusammenführt, wird der Partner sofort mit einer liebevollen Nachricht benachrichtigt.
              </p>
            </div>
          </div>

          {/* Feature 4: Daily 5:00 AM Morning Message */}
          <div className="p-3.5 rounded-2xl bg-[#071920] border border-[#dfba61]/30 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#dfba61]/15 text-[#dfba61] shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-[#f5d77f]">Täglich um 5:00 Uhr morgens</div>
                <p className="text-white/70">
                  Jeden Morgen um 5:00 Uhr eine herzerwärmende, positive Botschaft für einen erfüllten und kraftvollen Tag.
                </p>
              </div>
            </div>
            <div className="flex items-center pt-1">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-medium">Aktiv</span>
            </div>
          </div>

        </div>

        {/* Permission Action Area */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70">Mitteilungs-Status:</span>
            {permission === 'granted' ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" /> Erlaubt & Aktiv
              </span>
            ) : permission === 'denied' ? (
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Im Browser blockiert
              </span>
            ) : (
              <span className="text-[#fae298] font-semibold">
                Noch nicht aktiviert
              </span>
            )}
          </div>

          {permission !== 'granted' ? (
            <button
              onClick={handleRequestPermission}
              className="w-full py-3 rounded-xl gold-gradient-btn text-[#0a232c] font-bold text-xs tracking-wide shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4 text-[#0a232c]" />
              <span>Benachrichtigungen auf dem Handy erlauben</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendTest}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#dfba61]" />
                <span>Test-Mitteilung aufs Handy senden</span>
              </button>
            </div>
          )}

          {testSent && (
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-center text-xs animate-fade-in flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Test-Benachrichtigung wurde gesendet! Prüfe dein Handy.</span>
            </div>
          )}
        </div>

        {/* Mobile Setup Hints for iOS and Android */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#dfba61] font-semibold text-[11px]">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Tipp für das beste Handy-Erlebnis (App-Gefühl):</span>
          </div>
          <p className="text-[11px] text-white/70 leading-relaxed">
            <strong className="text-white">iPhone (Safari):</strong> Tippe unten auf das Teilen-Symbol (Viereck mit Pfeil) und wähle <span className="text-[#f5d77f]">„Zum Home-Bildschirm“</span>.<br />
            <strong className="text-white">Android (Chrome):</strong> Tippe im Menü (drei Punkte) auf <span className="text-[#f5d77f]">„App installieren“</span>.
          </p>
        </div>

        {/* Bottom Close */}
        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-xs font-semibold transition"
          >
            Fertig
          </button>
        </div>

      </div>
    </div>
  );
};
