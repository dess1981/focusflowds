import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import DailyTasksWidget from '@/components/home/DailyTasksWidget';
import SmartNotifications from '@/components/SmartNotifications';
import HealthSummaryWidget from '@/components/home/HealthSummaryWidget';
import CategoryPieChart from '@/components/home/CategoryPieChart';
import { Send, Sparkles, CheckCircle2, Clock, AlertTriangle, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'ai'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [activeConv, setActiveConv] = useState(null);
  const [user, setUser] = useState(null);
  const unsubRef = React.useRef(null);
  const scrollRef = React.useRef(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-home-stats'],
    queryFn: () => base44.entities.Task.list('-created_date', 300),
  });

  const stats = useMemo(() => {
    const todayTasks = tasks.filter(t => t.due_date === today);
    const done = todayTasks.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done' && t.status !== 'cancelled').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    // streak
    let streak = 0;
    const completedDates = new Set(tasks.filter(t => t.completed_at).map(t => t.completed_at.split('T')[0]));
    let d = new Date();
    while (completedDates.has(format(d, 'yyyy-MM-dd'))) { streak++; d = new Date(d.getTime() - 86400000); }
    return { todayTotal: todayTasks.length, done, overdue, inProgress, streak };
  }, [tasks, today]);

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
    <div className="space-y-5">
      {/* Greeting Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight text-white"
          style={{ textShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
          {getGreeting()}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-sm mt-0.5 capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Hoje', value: `${stats.done}/${stats.todayTotal}`, icon: CheckCircle2, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)' },
          { label: 'Em Progresso', value: stats.inProgress, icon: Clock, color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
          { label: 'Atrasadas', value: stats.overdue, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
          { label: 'Sequência', value: `${stats.streak}🔥`, icon: Flame, color: '#22d3ee', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: bg, border: `1px solid ${border}` }}>
            <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
            <div>
              <p className="text-xs text-white/50">{label}</p>
              <p className="text-lg font-bold text-white leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <HealthSummaryWidget />
          <CategoryPieChart />
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
              Alertas
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
            <div className="flex-1 overflow-y-auto p-4">
              <SmartNotifications />
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
    </div>
  );
}