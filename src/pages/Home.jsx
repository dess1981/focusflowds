import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import DailyTasksWidget from '@/components/home/DailyTasksWidget';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className="flex flex-col gap-1.5 max-w-[80%]">
        {message.content && (
          <div className={cn("rounded-2xl px-4 py-2.5 text-sm",
            isUser ? "bg-primary text-primary-foreground" : "bg-card border border-border"
          )}>
            {isUser ? (
              <p>{message.content}</p>
            ) : (
              <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'ai'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [activeConv, setActiveConv] = useState(null);
  const unsubRef = React.useRef(null);

  const scrollRef = React.useRef(null);

  // Subscribe to conversation updates
  React.useEffect(() => {
    if (unsubRef.current) { 
      unsubRef.current(); 
      unsubRef.current = null; 
    }
    if (!activeConv) return;
    
    const unsub = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      setMessages(data.messages || []);
    });
    unsubRef.current = unsub;
    return () => { 
      unsub(); 
      unsubRef.current = null; 
    };
  }, [activeConv?.id]);

  // Auto-scroll
  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Tasks */}
      <div className="lg:col-span-2">
        <DailyTasksWidget />
      </div>

      {/* Sidebar - AI Assistant */}
      <div className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden h-fit lg:h-[calc(100vh-8rem)] sticky top-24">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('tasks')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors text-center",
              activeTab === 'tasks'
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Resumo
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors text-center",
              activeTab === 'ai'
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            IA
          </button>
        </div>

        {/* Content */}
        {activeTab === 'tasks' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-2 opacity-60" />
              <p className="text-sm text-muted-foreground">
                Veja suas tarefas na coluna principal
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Assistente FocusFlow</p>
                    <p className="text-muted-foreground text-xs max-w-xs">
                      Faça perguntas ou peça para criar tarefas
                    </p>
                  </div>
                </div>
              )}
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <MessageBubble message={msg} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {sending && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/50"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Pergunte algo..."
                className="flex-1 text-sm"
              />
              <Button onClick={sendMessage} disabled={!input.trim() || sending} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}