import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pause, Play, CheckCircle2, Zap, Brain, Target, Flame } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const ADHD_MESSAGES = [
  "🧠 Seu cérebro está em modo turbo agora!",
  "🔥 Cada segundo conta. Você está arrasando!",
  "⚡ Foco total. O mundo pode esperar.",
  "🎯 Uma coisa de cada vez. Você consegue!",
  "🌟 Você escolheu esta tarefa. Termine ela!",
  "🚀 Sem distrações. Apenas você e a missão.",
  "💪 Seu futuro eu vai agradecer por isso.",
  "🎮 Você está no modo FOCO. Não pare agora!",
  "🦁 Concentração de campeão. Vai fundo!",
  "✨ Este momento é tudo. Fique aqui.",
];

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusTimer({ task, onClose, onComplete }) {
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const startedAt = useRef(new Date().toISOString());
  const intervalRef = useRef(null);
  const msgIntervalRef = useRef(null);

  // Timer
  useEffect(() => {
    if (!paused) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [paused]);

  // Rotate ADHD messages every 25s
  useEffect(() => {
    msgIntervalRef.current = setInterval(() => {
      setMsgIndex(i => (i + 1) % ADHD_MESSAGES.length);
    }, 25000);
    return () => clearInterval(msgIntervalRef.current);
  }, []);

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    clearInterval(intervalRef.current);
    clearInterval(msgIntervalRef.current);

    const endedAt = new Date().toISOString();
    const durationSeconds = seconds;

    const prevSessions = task.focus_sessions || [];
    const prevTotal = task.total_focus_seconds || 0;

    await base44.entities.Task.update(task.id, {
      status: 'done',
      completed_at: endedAt,
      focus_sessions: [
        ...prevSessions,
        { started_at: startedAt.current, ended_at: endedAt, duration_seconds: durationSeconds }
      ],
      total_focus_seconds: prevTotal + durationSeconds,
    });

    onComplete?.();
    onClose();
  }, [seconds, task, onClose, onComplete]);

  const handleStop = useCallback(async () => {
    clearInterval(intervalRef.current);
    clearInterval(msgIntervalRef.current);

    if (seconds > 0) {
      const endedAt = new Date().toISOString();
      const prevSessions = task.focus_sessions || [];
      const prevTotal = task.total_focus_seconds || 0;
      await base44.entities.Task.update(task.id, {
        focus_sessions: [
          ...prevSessions,
          { started_at: startedAt.current, ended_at: endedAt, duration_seconds: seconds }
        ],
        total_focus_seconds: prevTotal + seconds,
      });
    }

    onClose();
  }, [seconds, task, onClose]);

  // Progress ring
  const estimated = (task.estimated_minutes || 25) * 60;
  const progress = Math.min(seconds / estimated, 1);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 40 }}
      className="fixed bottom-6 right-6 z-[100] w-80 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: 'rgba(10, 12, 22, 0.97)',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        boxShadow: '0 0 60px rgba(168, 85, 247, 0.25), 0 20px 60px rgba(0,0,0,0.6)',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(168,85,247,0.15)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ background: paused ? '#f59e0b' : '#22c55e', boxShadow: `0 0 8px ${paused ? '#f59e0b' : '#22c55e'}` }}
          />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(168,85,247,0.8)' }}>
            {paused ? 'PAUSADO' : 'EM FOCO'}
          </span>
        </div>
        <button
          onClick={handleStop}
          className="p-1 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-4 flex flex-col items-center gap-4">
        {/* Task name */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Você está realizando</p>
          <p className="text-base font-bold text-white leading-snug line-clamp-2">{task.title}</p>
        </div>

        {/* SVG Timer ring */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="rgba(168,85,247,0.12)"
              strokeWidth="8"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="url(#timerGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center z-10">
            <p className="text-3xl font-mono font-bold text-white">{formatTime(seconds)}</p>
            {task.estimated_minutes && (
              <p className="text-xs text-muted-foreground mt-0.5">
                meta {formatTime(estimated)}
              </p>
            )}
          </div>
        </div>

        {/* ADHD message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={msgIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-center px-2"
          >
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {ADHD_MESSAGES[msgIndex]}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2 w-full">
          <button
            onClick={() => setPaused(p => !p)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {paused ? 'Continuar' : 'Pausar'}
          </button>
          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
              color: 'white',
              boxShadow: '0 4px 16px rgba(168,85,247,0.4)',
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            {completing ? 'Salvando...' : 'Concluir'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}