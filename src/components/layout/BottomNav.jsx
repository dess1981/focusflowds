import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, ListTodo, LayoutDashboard, Sparkles, LayoutTemplate, FolderKanban, Clock, Calendar, BarChart3, TrendingUp, CheckCircle2, Tag, Settings, Menu, X, Mic, Heart, Brain, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import BottomNavCustomizer from './BottomNavCustomizer';

const mainItems = [
  { path: '/', icon: CalendarDays, label: 'Planner' },
  { path: '/tasks', icon: ListTodo, label: 'Tarefas' },
  { type: 'voice', icon: Mic, label: 'Voz' },
  { path: '/assistant', icon: Brain, label: 'IA' },
  { path: '/email-manager', icon: Sparkles, label: 'Gmail' },
];

const allItems = [
  { path: '/', icon: CalendarDays, label: 'Planner' },
  { path: '/daily-list', icon: CheckCircle2, label: 'Hoje' },
  { path: '/tasks', icon: ListTodo, label: 'Tarefas' },
  { path: '/projects', icon: FolderKanban, label: 'Projetos' },
  { path: '/time-blocks', icon: Clock, label: 'Blocos' },
  { path: '/calendar', icon: Calendar, label: 'Calendário' },
  { path: '/templates', icon: LayoutTemplate, label: 'Templates' },
  { path: '/health', icon: Heart, label: 'Saúde' },
  { path: '/email-manager', icon: Sparkles, label: 'Gmail' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/reports', icon: BarChart3, label: 'Relatórios' },
  { path: '/monthly', icon: TrendingUp, label: 'Análise' },
  { path: '/categories', icon: Tag, label: 'Categorias' },
  { path: '/assistant', icon: Brain, label: 'IA' },
  { path: '/settings', icon: Settings, label: 'Config' },
];

export default function BottomNav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customItems, setCustomItems] = useState(mainItems);

  useEffect(() => {
    const saved = localStorage.getItem('customBottomNav');
    if (saved) {
      setCustomItems(JSON.parse(saved));
    }
  }, []);

  return (
    <>
      <BottomNavCustomizer isOpen={customOpen} onClose={() => setCustomOpen(false)} />
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(13, 15, 26, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(168, 85, 247, 0.2)',
          boxShadow: '0 -4px 30px rgba(168, 85, 247, 0.1)',
        }}
      >
        <div className="flex items-stretch justify-between px-1 pb-safe">
          {customItems.map((item) => {
            const isActive = item.path && location.pathname === item.path;
            const isVoiceActive = item.type === 'voice' && menuOpen;
            const itemElement = (
              <button
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 px-1 transition-all duration-200 border-b-2"
                style={{
                  borderColor: (isActive || isVoiceActive) ? '#a855f7' : 'transparent',
                  background: (isActive || isVoiceActive) ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                }}
                onClick={() => {
                  if (item.type === 'voice') {
                    setMenuOpen(!menuOpen);
                  } else {
                    setMenuOpen(false);
                  }
                }}
              >
                <item.icon
                  className="w-5 h-5 transition-all duration-200"
                  style={(isActive || isVoiceActive) ? {
                    color: '#a855f7',
                    filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))',
                  } : { color: 'rgba(255,255,255,0.5)' }}
                />
                <span
                  className="text-[10px] font-medium transition-all duration-200 leading-tight line-clamp-1"
                  style={(isActive || isVoiceActive) ? { color: '#a855f7' } : { color: 'rgba(255,255,255,0.5)' }}
                >
                  {item.label}
                </span>
              </button>
            );
            
            return item.path ? (
              <Link key={item.path} to={item.path} className="flex-1">
                {itemElement}
              </Link>
            ) : (
              <div key={item.type} className="flex-1">
                {itemElement}
              </div>
            );
          })}

          {/* Customizer Button */}
          <button
            onClick={() => setCustomOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 px-1 transition-all duration-200 border-b-2 hover:bg-accent/10"
            style={{
              borderColor: 'transparent',
              color: 'rgba(255,255,255,0.5)',
            }}
            title="Editar Menu"
          >
            <Edit2 className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">Editar</span>
          </button>
        </div>
      </nav>


    </>
  );
}