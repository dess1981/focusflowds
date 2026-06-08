import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Plus, MessageSquare, Sparkles, Calendar, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const AGENTS = [
  {
    id: 'focusflow_assistant',
    name: 'Assistente FocusFlow',
    description: 'Organiza tarefas, projetos e dá dicas para TDAH',
    icon: Sparkles,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'schedule_advisor',
    name: 'Planejador do Dia',
    description: 'Analisa tarefas e cria o melhor cronograma para hoje',
    icon: Calendar,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
];

function ToolCallBubble({ toolCall }) {
  const status = toolCall?.status || 'pending';
  const name = (toolCall?.name || '').replace(/([A-Z])/g, ' $1').trim();
  const isRunning = status === 'running' || status === 'in_progress' || status === 'pending';
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 rounded-lg border border-border bg-muted/30 w-fit">
      <motion.div
        className={cn("w-1.5 h-1.5 rounded-full", isRunning ? "bg-amber-400" : status === 'completed' ? "bg-green-400" : "bg-red-400")}
        animate={isRunning ? { opacity: [1, 0.3, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <span>{name}</span>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-primary" />
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
        {message.tool_calls?.map((tc, i) => (
          <ToolCallBubble key={i} toolCall={tc} />
        ))}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [activeAgentId, setActiveAgentId] = useState('focusflow_assistant');
  const [conversations, setConversations] = useState({});
  const [activeConvByAgent, setActiveConvByAgent] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const unsubRef = useRef(null);

  const activeAgent = AGENTS.find(a => a.id === activeAgentId);
  const activeConv = activeConvByAgent[activeAgentId] || null;
  const agentConvs = conversations[activeAgentId] || [];

  useEffect(() => {
    loadConversations(activeAgentId);
  }, [activeAgentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (!activeConv) return;
    const unsub = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      setMessages(data.messages || []);
    });
    unsubRef.current = unsub;
    return () => { unsub(); unsubRef.current = null; };
  }, [activeConv?.id]);

  const loadConversations = async (agentId) => {
    const convs = await base44.agents.listConversations({ agent_name: agentId });
    setConversations(prev => ({ ...prev, [agentId]: convs || [] }));
    if (convs?.length > 0 && !activeConvByAgent[agentId]) {
      selectConversation(convs[0], agentId);
    } else if (!convs?.length) {
      setMessages([]);
    }
  };

  const selectConversation = async (conv, agentId = activeAgentId) => {
    const full = await base44.agents.getConversation(conv.id);
    setActiveConvByAgent(prev => ({ ...prev, [agentId]: full }));
    setMessages(full.messages || []);
  };

  const newConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: activeAgentId,
      metadata: { name: `Conversa ${new Date().toLocaleDateString('pt-BR')}` },
    });
    setConversations(prev => ({ ...prev, [activeAgentId]: [conv, ...(prev[activeAgentId] || [])] }));
    setActiveConvByAgent(prev => ({ ...prev, [activeAgentId]: conv }));
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
        agent_name: activeAgentId,
        metadata: { name: text.slice(0, 40) },
      });
      setConversations(prev => ({ ...prev, [activeAgentId]: [conv, ...(prev[activeAgentId] || [])] }));
      setActiveConvByAgent(prev => ({ ...prev, [activeAgentId]: conv }));
    }

    await base44.agents.addMessage(conv, { role: 'user', content: text });
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const switchAgent = (agentId) => {
    setActiveAgentId(agentId);
    setMessages([]);
    setInput('');
  };

  const AgentIcon = activeAgent?.icon || Sparkles;

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Sidebar */}
      <div className="w-64 shrink-0 flex flex-col gap-3 hidden lg:flex">
        {/* Agent selector */}
        <div className="space-y-1.5">
          {AGENTS.map(agent => {
            const Icon = agent.icon;
            const isActive = agent.id === activeAgentId;
            return (
              <button
                key={agent.id}
                onClick={() => switchAgent(agent.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 border",
                  isActive
                    ? "border-primary/40 bg-primary/10"
                    : "border-transparent hover:bg-muted"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", agent.bg)}>
                  <Icon className={cn("w-4 h-4", agent.color)} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium truncate", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {agent.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="h-px bg-border" />

        {/* Conversations for active agent */}
        <Button variant="outline" className="w-full justify-start gap-2" onClick={newConversation}>
          <Plus className="w-4 h-4" /> Nova Conversa
        </Button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {agentConvs.map(conv => (
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
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", activeAgent?.bg)}>
            <AgentIcon className={cn("w-5 h-5", activeAgent?.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{activeAgent?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{activeAgent?.description}</p>
          </div>
          {/* Mobile agent switcher */}
          <div className="flex gap-1 lg:hidden">
            {AGENTS.map(agent => {
              const Icon = agent.icon;
              return (
                <button
                  key={agent.id}
                  onClick={() => switchAgent(agent.id)}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center border transition-colors",
                    agent.id === activeAgentId ? "border-primary/40 bg-primary/10" : "border-border hover:bg-muted"
                  )}
                >
                  <Icon className={cn("w-4 h-4", agent.color)} />
                </button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" className="hidden lg:inline-flex ml-auto" onClick={newConversation}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-10">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", activeAgent?.bg)}>
                <AgentIcon className={cn("w-7 h-7", activeAgent?.color)} />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">{activeAgent?.name}</p>
                <p className="text-muted-foreground text-sm max-w-xs">{activeAgent?.description}</p>
              </div>
              {activeAgentId === 'schedule_advisor' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setInput('Analise minhas tarefas e me sugira o melhor cronograma para hoje');
                    setTimeout(() => document.getElementById('chat-input')?.focus(), 100);
                  }}
                >
                  ✨ Sugerir cronograma para hoje
                </Button>
              )}
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
              <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", activeAgent?.bg)}>
                <AgentIcon className={cn("w-4 h-4", activeAgent?.color)} />
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
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
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border flex gap-2">
          <Input
            id="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={activeAgentId === 'schedule_advisor'
              ? "Peça um cronograma ou faça uma pergunta..."
              : "Pergunte algo ou peça para criar uma tarefa..."}
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