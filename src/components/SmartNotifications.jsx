import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Bell, X, AlertTriangle, Info, Zap, Lightbulb, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TYPE_CONFIG = {
  urgent: {
    icon: AlertTriangle,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
    label: 'Urgente',
  },
  warning: {
    icon: Zap,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    border: 'rgba(249,115,22,0.3)',
    label: 'Atenção',
  },
  info: {
    icon: Info,
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.1)',
    border: 'rgba(34,211,238,0.3)',
    label: 'Info',
  },
  tip: {
    icon: Lightbulb,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.1)',
    border: 'rgba(168,85,247,0.3)',
    label: 'Dica',
  },
};

function NotificationCard({ notif, onDismiss }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;

  return (
    <div
      className="flex gap-3 p-3 rounded-xl transition-all"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug">{notif.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
        {notif.action && notif.action_link && (
          <Link
            to={notif.action_link}
            className="inline-block mt-1.5 text-xs font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: cfg.color }}
          >
            {notif.action} →
          </Link>
        )}
      </div>
      <button
        onClick={() => onDismiss(notif)}
        className="flex-shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

export default function SmartNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [lastLoaded, setLastLoaded] = useState(null);
  const [meta, setMeta] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getSmartNotifications', {});
      setNotifications(res.data.notifications || []);
      setMeta(res.data.meta || null);
      setDismissed([]);
      setLastLoaded(new Date());
    } catch (e) {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDismiss = (notif) => {
    setDismissed(prev => [...prev, notif.title]);
  };

  const visible = notifications.filter(n => !dismissed.includes(n.title));
  const urgentCount = visible.filter(n => n.type === 'urgent').length;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Notificações Inteligentes</span>
          {urgentCount > 0 && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
            >
              {urgentCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); load(); }}
            disabled={loading}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", loading && "animate-spin")} />
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-3 space-y-2">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center gap-2 py-3 justify-center">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Analisando suas tarefas com IA...</span>
            </div>
          ) : (
            <>
              {visible.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <Bell className="w-8 h-8 text-primary/30" />
                  <p className="text-sm font-medium text-foreground/60">Tudo em dia!</p>
                  <p className="text-xs text-muted-foreground">Nenhum alerta pendente no momento.</p>
                </div>
              )}
              {visible.map((notif, i) => (
                <NotificationCard key={i} notif={notif} onDismiss={handleDismiss} />
              ))}

              {/* Meta summary */}
              {meta && (
                <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
                  {meta.overdue_count > 0 && (
                    <span className="text-red-400">⚠ {meta.overdue_count} atrasada{meta.overdue_count > 1 ? 's' : ''}</span>
                  )}
                  {meta.due_today_count > 0 && (
                    <span>📅 {meta.due_today_count} para hoje</span>
                  )}
                  {meta.due_soon_count > 0 && (
                    <span>🔜 {meta.due_soon_count} em breve</span>
                  )}
                  {meta.scheduled_minutes > 0 && (
                    <span>🕐 {Math.round(meta.scheduled_minutes / 60 * 10) / 10}h agendadas</span>
                  )}
                </div>
              )}

              {lastLoaded && (
                <p className="text-[10px] text-muted-foreground/50 text-right">
                  Atualizado às {lastLoaded.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}