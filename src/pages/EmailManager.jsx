import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const AGENT_NAME = 'email_manager';

export default function EmailManager() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(authed => {
      if (authed) {
        base44.auth.me().then(setUser);
      }
    });
  }, []);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
    });

    return unsubscribe;
  }, [conversationId]);

  const startNewConversation = async () => {
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: {
          name: 'Gerenciamento de Gmail',
          description: 'Conversa com o assistente de Gmail',
        },
      });
      setConversationId(conversation.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !conversationId || loading) return;

    const userMessage = inputValue;
    setInputValue('');
    setLoading(true);

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: userMessage,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-background">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-primary" />
            <div>
              <h1 className="font-semibold">Gerenciador de Gmail</h1>
              <p className="text-xs text-muted-foreground">
                {conversationId ? 'Conversa ativa' : 'Inicie uma conversa'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={startNewConversation}
            variant="outline"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nova Conversa
          </Button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!conversationId ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h2 className="text-lg font-semibold mb-2">Comece uma nova conversa</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Clique em "Nova Conversa" para começar a conversar com o assistente de Gmail.
              </p>
              <Button onClick={startNewConversation} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Iniciar Conversa
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h2 className="text-lg font-semibold mb-2">Pronto para começar</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Digite suas instruções abaixo. Exemplos:
                <br />• "Delete todos os emails de ofertas de empréstimo"
                <br />• "Marque como spam emails com 'compre agora'"
                <br />• "Archive todas as newsletters"
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-md rounded-lg px-4 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground border border-border'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        {conversationId && (
          <div className="border-t border-border p-4 space-y-3">
            <Textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  sendMessage();
                }
              }}
              placeholder="Digite sua instrução (Ctrl+Enter para enviar)..."
              className="resize-none h-20"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !inputValue.trim()}
              className="w-full gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Processando...' : 'Enviar'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}