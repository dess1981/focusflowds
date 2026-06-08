import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, ListTodo, LayoutDashboard, Sparkles, LayoutTemplate, FolderKanban, Clock, Calendar, BarChart3, TrendingUp, CheckCircle2, Tag, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const allItems = [
  { path: '/', icon: CalendarDays, label: 'Planner' },
  { path: '/daily-list', icon: CheckCircle2, label: 'Hoje' },
  { path: '/tasks', icon: ListTodo, label: 'Tarefas' },
  { path: '/projects', icon: FolderKanban, label: 'Projetos' },
  { path: '/time-blocks', icon: Clock, label: 'Blocos' },
  { path: '/calendar', icon: Calendar, label: 'Calendário' },
  { path: '/templates', icon: LayoutTemplate, label: 'Templates' },
  { path: '/health', icon: '💚', label: 'Saúde' },
  { path: '/email-manager', icon: Sparkles, label: 'Gmail' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/reports', icon: BarChart3, label: 'Relatórios' },
  { path: '/monthly', icon: TrendingUp, label: 'Análise' },
  { path: '/categories', icon: Tag, label: 'Categorias' },
  { path: '/assistant', icon: Sparkles, label: 'IA' },
  { path: '/settings', icon: Settings, label: 'Config' },
];

export default function BottomNav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(13, 15, 26, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(168, 85, 247, 0.2)',
        boxShadow: '0 -4px 30px rgba(168, 85, 247, 0.1)',
      }}
    >
      <div className="flex items-center justify-between px-2 py-2 pb-safe">
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {allItems.slice(0, 4).map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 flex-shrink-0"
                style={isActive ? {
                  background: 'rgba(168, 85, 247, 0.15)',
                } : {}}
                onClick={() => setMenuOpen(false)}
              >
                {typeof item.icon === 'string' ? (
                  <span className="text-base">{item.icon}</span>
                ) : (
                  <item.icon
                    className="w-4 h-4 transition-all duration-200"
                    style={isActive ? {
                      color: '#a855f7',
                      filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))',
                    } : { color: 'rgba(255,255,255,0.4)' }}
                  />
                )}
                <span
                  className="text-[9px] font-medium transition-all duration-200 leading-none"
                  style={isActive ? { color: '#a855f7' } : { color: 'rgba(255,255,255,0.4)' }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 rounded-lg transition-colors flex-shrink-0 ml-1"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded Menu */}
      {menuOpen && (
        <div 
          className="absolute bottom-[58px] left-0 right-0 max-h-72 overflow-y-auto p-2"
          style={{
            background: 'rgba(13, 15, 26, 0.95)',
            borderTop: '1px solid rgba(168, 85, 247, 0.2)',
          }}
        >
          <div className="grid grid-cols-4 gap-2">
            {allItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all duration-200 text-center"
                  style={isActive ? {
                    background: 'rgba(168, 85, 247, 0.15)',
                  } : {}}
                  onClick={() => setMenuOpen(false)}
                >
                  {typeof item.icon === 'string' ? (
                    <span className="text-lg">{item.icon}</span>
                  ) : (
                    <item.icon
                      className="w-5 h-5 transition-all duration-200"
                      style={isActive ? {
                        color: '#a855f7',
                        filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))',
                      } : { color: 'rgba(255,255,255,0.4)' }}
                    />
                  )}
                  <span
                    className="text-[9px] font-medium transition-all duration-200 line-clamp-1"
                    style={isActive ? { color: '#a855f7' } : { color: 'rgba(255,255,255,0.4)' }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}