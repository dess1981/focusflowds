import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CalendarDays, ListTodo, FolderKanban, 
  Clock, Settings, ChevronLeft, ChevronRight, Plus, 
  Sparkles, Tag, X, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: CalendarDays, label: 'Planner Diário' },
  { path: '/calendar', icon: Calendar, label: 'Calendário' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tasks', icon: ListTodo, label: 'Tarefas' },
  { path: '/projects', icon: FolderKanban, label: 'Projetos' },
  { path: '/time-blocks', icon: Clock, label: 'Blocos de Tempo' },
  { path: '/categories', icon: Tag, label: 'Categorias' },
  { path: '/assistant', icon: Sparkles, label: 'Assistente IA' },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Sidebar — desktop only */}
      <aside
        className={cn(
          "hidden lg:flex fixed top-0 left-0 h-full z-50 flex-col transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
        style={{
          background: 'rgba(10, 12, 22, 0.9)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(168, 85, 247, 0.15)',
        }}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center h-16 px-4 transition-all",
          collapsed ? "justify-center" : "justify-between"
        )}
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
                  boxShadow: '0 0 16px rgba(168, 85, 247, 0.5)',
                }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span
                className="font-heading font-bold text-lg tracking-tight text-white"
                style={{ textShadow: '0 0 20px rgba(168,85,247,0.5)' }}
              >
                FocusFlow
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Add */}
        <div className="p-3">
          <Link to="/tasks?new=true">
            <button
              className={cn(
                "w-full flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200",
                collapsed && "justify-center px-0"
              )}
              style={{
                background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                boxShadow: '0 4px 20px rgba(168, 85, 247, 0.35)',
              }}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>Nova Tarefa</span>}
            </button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-0"
                )}
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(34,211,238,0.1))',
                  color: '#a855f7',
                  border: '1px solid rgba(168,85,247,0.3)',
                  boxShadow: '0 0 16px rgba(168,85,247,0.1)',
                } : {
                  color: 'rgba(255,255,255,0.45)',
                  border: '1px solid transparent',
                }}
              >
                <item.icon
                  className="w-[18px] h-[18px] flex-shrink-0"
                  style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))' } : {}}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              collapsed && "justify-center px-0"
            )}
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <Settings className="w-[18px] h-[18px]" />
            {!collapsed && <span>Configurações</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}