import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, AlertCircle, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmailsSummary() {
  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['inbox-summary'],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke('getInboxMessages', { limit: 5, unreadOnly: true });
        return res.data?.messages || [];
      } catch (error) {
        console.error('Erro ao buscar emails:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (isLoading || emails.length === 0) return null;

  const unreadCount = emails.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(168,85,247,0.2)',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}
        >
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Emails</h3>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {unreadCount} não lido{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {emails.slice(0, 3).map((email, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-lg bg-white/2 hover:bg-white/5 transition-colors border border-white/5 cursor-pointer"
          >
            <p className="text-xs font-medium text-white truncate">
              {email.from || 'Desconhecido'}
            </p>
            <p className="text-xs mt-1 line-clamp-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {email.subject || '(sem assunto)'}
            </p>
          </div>
        ))}
      </div>

      {unreadCount > 3 && (
        <button
          className="w-full mt-3 py-1.5 text-xs font-medium rounded-lg transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Ver todos ({unreadCount} emails)
        </button>
      )}
    </motion.div>
  );
}