import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, ListTodo, LayoutDashboard, Sparkles, LayoutTemplate, FolderKanban, Clock, Calendar, BarChart3, TrendingUp, CheckCircle2, Tag, Settings, Menu, X, Mic, Heart, Brain, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import BottomNavCustomizer from './BottomNavCustomizer';

const mainItems = [
  { path: '/', icon: CalendarDays, label: 'Planner' },
  { path: '/tasks', icon: ListTodo, label: 'Tarefas' },
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

          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 px-1 transition-all duration-200 border-b-2"
            style={{
              borderColor: menuOpen ? '#a855f7' : 'transparent',
              background: menuOpen ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
              color: menuOpen ? '#a855f7' : 'rgba(255,255,255,0.5)',
            }}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-[10px] font-medium leading-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* Expanded Menu Modal */}
      {menuOpen && (
        <>
          <div 
            className="lg:hidden fixed bottom-0 left-0 right-0 top-0 z-40"
            style={{ background: 'rgba(0, 0, 0, 0.4)' }}
            onClick={() => setMenuOpen(false)}
          />
          <div 
            className="lg:hidden fixed bottom-0 left-0 right-0 max-h-96 overflow-y-auto z-50 rounded-t-2xl p-4"
            style={{
              background: 'rgba(13, 15, 26, 0.95)',
              backdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(168, 85, 247, 0.2)',
            }}
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <div className="grid grid-cols-5 gap-3">
              {allItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200"
                    style={isActive ? {
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                    } : {
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {typeof item.icon === 'string' ? (
                      <span className="text-2xl">{item.icon}</span>
                    ) : (
                      <item.icon
                        className="w-6 h-6 transition-all duration-200"
                        style={isActive ? {
                          color: '#a855f7',
                          filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))',
                        } : { color: 'rgba(255,255,255,0.6)' }}
                      />
                    )}
                    <span
                      className="text-[11px] font-medium transition-all duration-200 line-clamp-2 text-center"
                      style={isActive ? { color: '#a855f7' } : { color: 'rgba(255,255,255,0.6)' }}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
            {/* Customizer Button */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setCustomOpen(true);
                  setMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 bg-primary/10 hover:bg-primary/20 text-primary"
              >
                <Sliders className="w-4 h-4" />
                <span className="text-sm font-medium">Personalizar</span>
              </button>
            </div>
            <div className="h-4" />
          </div>
        </>
      )}
    </>
  );
}