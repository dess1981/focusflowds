import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomeStats({ stats }) {
  const statCards = [
    {
      label: 'A Fazer',
      value: stats.todo,
      icon: AlertCircle,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
    },
    {
      label: 'Em Progresso',
      value: stats.inProgress,
      icon: Clock,
      color: '#f97316',
      bg: 'rgba(249,115,22,0.1)',
    },
    {
      label: 'Concluídas',
      value: stats.done,
      icon: CheckCircle2,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.1)',
    },
    {
      label: 'Urgentes',
      value: stats.urgentCount,
      icon: Zap,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="rounded-xl p-4 border"
            style={{
              background: card.bg,
              border: `1px solid ${card.color}40`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color: card.color }} />
              <span className="text-xs font-medium text-white/70">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </div>
        );
      })}
    </motion.div>
  );
}