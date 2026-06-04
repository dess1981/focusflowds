import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Plus, MessageSquare, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-card border border-border"
      )}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeConv) return;
    const unsub = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [activeConv?.id]);

  const loadConversations = async () => {
    const convs = await base44.agents.listConversations({ agent_name: 'focusflow_assistant' });
    setConversations(convs || []);
    if (convs?.length > 0 && !activeConv) {
      selectConversation(convs[0]);
    }
  };

  const selectConversation = async (conv) => {
    const full = await base44.agents.getConversation(conv.id);
    setActiveConv(full);
    setMessages(full.messages || []);
  };

  const newConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: 'focusflow_assistant',
      metadata: { name: `Conversa ${new Date().toLocaleDateString('pt-BR')}` },
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConv(conv);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    let conv = activeConv;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: 'focusflow_assistant',
        metadata: { name: text.slice(0, 40) },
      });
      setConversations(prev => [conv, ...prev]);
      setActiveConv(conv);
    }

    await base44.agents.addMessage(conv, { role: 'user', content: text });
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Sidebar */}
      <div className="w-60 shrink-0 flex flex-col gap-2 hidden lg:flex">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={newConversation}>
          <Plus className="w-4 h-4" />
          Nova Conversa
        </Button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors truncate",
                activeConv?.id === conv.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5 inline mr-2 opacity-60" />
              {conv.metadata?.name || 'Conversa'}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Assistente FocusFlow</p>
            <p className="text-xs text-muted-foreground">Powered by AI</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto lg:hidden" onClick={newConversation}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-10">
              <Sparkles className="w-10 h-10 text-primary/30" />
              <p className="text-muted-foreground text-sm max-w-xs">
                Olá! Sou seu assistente de produtividade. Posso ajudar a organizar suas tarefas, criar novos itens e dar dicas para o seu dia.
              </p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <MessageBubble message={msg} />
              </motion.div>
            ))}
          </AnimatePresence>
          {sending && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary/50"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pergunte algo ou peça para criar uma tarefa..."
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!input.trim() || sending} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}