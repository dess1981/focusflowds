import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Mail, RefreshCw, Trash2, Archive, AlertOctagon, CheckCheck,
  Search, Loader2, Unplug, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CONNECTOR_ID = '6a2653358a1cda4730de81b3';

export default function EmailManager() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState('is:unread label:INBOX');
  const [actionLoading, setActionLoading] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState(null);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getInboxMessages', { query, maxResults: 30 });
      setEmails(res.data.messages || []);
      setConnected(true);
      setSelected(new Set());
    } catch {
      setConnected(false);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    base44.auth.isAuthenticated().then(authed => {
      if (authed) fetchEmails();
    });
  }, []);

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        fetchEmails();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
    setEmails([]);
  };

  const executeAction = async (action, ids) => {
    if (!ids || ids.length === 0) return;
    setActionLoading(action);
    try {
      await base44.functions.invoke('executeEmailAction', { action, messageIds: ids });
      await fetchEmails();
    } catch (e) {
      alert('Erro ao executar ação: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === emails.length) setSelected(new Set());
    else setSelected(new Set(emails.map(e => e.id)));
  };

  const selectedIds = [...selected];
  const hasSelected = selectedIds.length > 0;

  if (!connected && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">Conecte seu Gmail</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Autorize o acesso ao seu Gmail para visualizar e gerenciar sua caixa de entrada direto aqui.
          </p>
        </div>
        <Button onClick={handleConnect} className="gap-2">
          <Mail className="w-4 h-4" />
          Conectar Gmail
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Gerenciador de Gmail</h1>
          <p className="text-sm text-muted-foreground">{emails.length} email(s) encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-1.5 text-xs">
            <Unplug className="w-3.5 h-3.5" />
            Desconectar
          </Button>
          <Button variant="outline" size="sm" onClick={fetchEmails} disabled={loading} className="gap-1.5">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchEmails()}
            placeholder="Filtro Gmail (ex: is:unread, from:alguem@, subject:fatura)"
            className="pl-9"
          />
        </div>
        <Button onClick={fetchEmails} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Buscar
        </Button>
      </div>

      {/* Bulk actions */}
      {emails.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {selected.size === emails.length ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
          {hasSelected && (
            <>
              <span className="text-xs text-muted-foreground">· {selectedIds.length} selecionado(s)</span>
              <div className="flex gap-1.5 ml-auto flex-wrap">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
                  disabled={!!actionLoading} onClick={() => executeAction('read', selectedIds)}>
                  {actionLoading === 'read' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                  Marcar lido
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
                  disabled={!!actionLoading} onClick={() => executeAction('archive', selectedIds)}>
                  {actionLoading === 'archive' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}
                  Arquivar
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 text-amber-500 border-amber-500/30"
                  disabled={!!actionLoading} onClick={() => executeAction('spam', selectedIds)}>
                  {actionLoading === 'spam' ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertOctagon className="w-3 h-3" />}
                  Spam
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 text-destructive border-destructive/30"
                  disabled={!!actionLoading} onClick={() => {
                    if (confirm(`Mover ${selectedIds.length} email(s) para lixeira?`)) executeAction('delete', selectedIds);
                  }}>
                  {actionLoading === 'delete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Excluir
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Email list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum email encontrado para este filtro</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {emails.map(email => {
            const isSelected = selected.has(email.id);
            const isUnread = email.labels?.includes('UNREAD');
            const isOpen = expanded === email.id;

            return (
              <div
                key={email.id}
                className={cn(
                  'rounded-xl border transition-all',
                  isSelected ? 'border-primary/40 bg-primary/5' : 'border-border bg-card/50',
                  isUnread && !isSelected && 'border-primary/20'
                )}
              >
                <div className="flex items-start gap-3 p-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(email.id)}
                    className="mt-1 flex-shrink-0 accent-primary"
                  />

                  {/* Content */}
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => setExpanded(isOpen ? null : email.id)}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn('text-sm truncate', isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                        {email.from?.replace(/<.*>/, '').trim() || '(Desconhecido)'}
                      </span>
                      {isUnread && <Badge variant="default" className="text-[10px] px-1.5 py-0 flex-shrink-0">Novo</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                        {email.date ? new Date(email.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                      </span>
                    </div>
                    <p className={cn('text-sm truncate', isUnread ? 'font-medium' : 'text-muted-foreground')}>
                      {email.subject}
                    </p>
                    {!isOpen && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{email.snippet}</p>
                    )}
                  </button>

                  {/* Expand toggle */}
                  <button onClick={() => setExpanded(isOpen ? null : email.id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-1">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded snippet + actions */}
                {isOpen && (
                  <div className="px-4 pb-3 space-y-3 border-t border-border/50 pt-3">
                    <p className="text-sm text-muted-foreground">{email.snippet}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7"
                        disabled={!!actionLoading} onClick={() => executeAction('read', [email.id])}>
                        <CheckCheck className="w-3 h-3" /> Marcar lido
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7"
                        disabled={!!actionLoading} onClick={() => executeAction('archive', [email.id])}>
                        <Archive className="w-3 h-3" /> Arquivar
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 text-amber-500 border-amber-500/30"
                        disabled={!!actionLoading} onClick={() => executeAction('spam', [email.id])}>
                        <AlertOctagon className="w-3 h-3" /> Spam
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 text-destructive border-destructive/30"
                        disabled={!!actionLoading} onClick={() => executeAction('delete', [email.id])}>
                        <Trash2 className="w-3 h-3" /> Excluir
                      </Button>
                      <a
                        href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs h-7 px-2 rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground"
                      >
                        <ExternalLink className="w-3 h-3" /> Abrir no Gmail
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}