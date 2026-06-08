import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Mail, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const GMAIL_CONNECTOR_ID = 'gmail_conn_id';

export default function GmailIntegration() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const msgs = await base44.functions.invoke('getInboxMessages', {
          query: 'is:unread label:INBOX',
          maxResults: 10
        });
        setMessages(msgs.data.messages || []);
        setConnected(true);
      } catch (error) {
        setConnected(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async () => {
    try {
      const url = await base44.connectors.connectAppUser(GMAIL_CONNECTOR_ID);
      const popup = window.open(url, 'GmailAuth', 'width=500,height=600');

      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          // Retry loading messages after connection
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }, 500);
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleRefreshMessages = async () => {
    setLoadingMessages(true);
    try {
      const result = await base44.functions.invoke('getInboxMessages', {
        query: 'is:unread label:INBOX',
        maxResults: 20
      });
      setMessages(result.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;

    setCreatingTask(true);
    try {
      const emailText = `Email de: ${selectedEmail.from}\n\n${selectedEmail.snippet}`;
      
      await base44.entities.Task.create({
        title: taskTitle,
        description: taskDesc || emailText,
        status: 'todo',
        priority: 'high',
        task_type: 'task',
        notes: `📧 Responder: ${selectedEmail.from}`
      });

      setSelectedEmail(null);
      setTaskTitle('');
      setTaskDesc('');
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setCreatingTask(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="max-w-md w-full glass rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Conectar Gmail</h2>
            <p className="text-muted-foreground text-sm">
              Autorize o acesso ao seu Gmail para gerenciar emails que precisam resposta
            </p>
          </div>
          <Button onClick={handleConnect} className="w-full">
            <LinkIcon className="w-4 h-4 mr-2" />
            Conectar Gmail
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciador de Email</h1>
            <p className="text-muted-foreground mt-1">Converta emails em tarefas para responder</p>
          </div>
          <Button onClick={handleRefreshMessages} disabled={loadingMessages}>
            {loadingMessages ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Atualizar
          </Button>
        </div>

        {/* Messages list */}
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum email não lido</p>
            </div>
          ) : (
            messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelectedEmail(msg)}
                className="w-full glass rounded-xl p-4 text-left hover:bg-muted/30 transition-colors border border-border"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{msg.subject}</p>
                    <p className="text-sm text-muted-foreground truncate">{msg.from}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{msg.snippet}</p>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Create task dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Tarefa do Email</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
              <p className="text-xs text-muted-foreground font-semibold">DE</p>
              <p className="text-sm">{selectedEmail?.from}</p>
              <p className="text-xs text-muted-foreground font-semibold mt-3">ASSUNTO</p>
              <p className="text-sm font-medium">{selectedEmail?.subject}</p>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Título da Tarefa *</label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="ex: Responder email de..."
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Descrição (opcional)</label>
              <textarea
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Adicione notas sobre a resposta..."
                className="w-full h-20 px-3 py-2 rounded-md bg-input border border-border text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEmail(null)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTask} disabled={!taskTitle.trim() || creatingTask}>
              {creatingTask ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}