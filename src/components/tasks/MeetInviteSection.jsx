import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Plus, X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MeetInviteSection({ meetLink, title, dueDate, startTime, endTime }) {
  const [emails, setEmails] = useState([]);
  const [inputEmail, setInputEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const addEmail = () => {
    const trimmed = inputEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Email inválido');
      return;
    }
    if (emails.includes(trimmed)) {
      setError('Email já adicionado');
      return;
    }
    setEmails(prev => [...prev, trimmed]);
    setInputEmail('');
    setError('');
    setSent(false);
  };

  const removeEmail = (email) => {
    setEmails(prev => prev.filter(e => e !== email));
    setSent(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail();
    }
  };

  const formatDate = () => {
    if (!dueDate) return '';
    try {
      const d = new Date(dueDate + 'T12:00:00');
      return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dueDate;
    }
  };

  const buildEmailBody = () => {
    const dateStr = formatDate();
    const timeStr = startTime
      ? `${startTime}${endTime ? ` – ${endTime}` : ''}`
      : '';

    return `
Olá!

Você está convidado(a) para a reunião: <strong>${title || 'Reunião'}</strong>

${dateStr ? `📅 Data: ${dateStr}` : ''}
${timeStr ? `🕐 Horário: ${timeStr}` : ''}

🔗 Link para entrar: <a href="${meetLink}">${meetLink}</a>

Clique no link acima para acessar a reunião pelo Google Meet.

Até lá!
    `.trim();
  };

  const handleSend = async () => {
    if (emails.length === 0) return;
    setSending(true);
    setError('');
    try {
      const subject = `Convite: ${title || 'Reunião'}`;
      const body = buildEmailBody();
      await Promise.all(
        emails.map(email =>
          base44.integrations.Core.SendEmail({ to: email, subject, body })
        )
      );
      setSent(true);
    } catch (e) {
      setError('Erro ao enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <Label className="text-sm font-semibold">Convidar por Email</Label>
      </div>

      {/* Email input */}
      <div className="flex gap-2">
        <Input
          type="email"
          value={inputEmail}
          onChange={e => { setInputEmail(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="email@exemplo.com"
          className="flex-1 h-8 text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addEmail}
          className="h-8 px-2.5"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground -mt-1">Pressione Enter ou vírgula para adicionar</p>

      {/* Email tags */}
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {emails.map(email => (
            <span
              key={email}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(34,211,238,0.12)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.3)' }}
            >
              {email}
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Send button */}
      {emails.length > 0 && (
        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          disabled={sending || sent}
          className={cn(
            "w-full gap-2 transition-all",
            sent && "bg-green-600 hover:bg-green-600"
          )}
        >
          {sending ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
          ) : sent ? (
            <><CheckCircle2 className="w-3.5 h-3.5" /> Convites enviados!</>
          ) : (
            <><Send className="w-3.5 h-3.5" /> Enviar convite para {emails.length} {emails.length === 1 ? 'pessoa' : 'pessoas'}</>
          )}
        </Button>
      )}
    </div>
  );
}