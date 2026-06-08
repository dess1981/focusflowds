import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CalendarDays, ListTodo, FolderKanban, 
  Clock, Settings, ChevronLeft, ChevronRight, Plus, 
  Sparkles, Tag, Menu, X, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button 
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card shadow-lg border border-border"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-card border-r border-border z-50 flex flex-col transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-border",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg tracking-tight">FocusFlow</span>
            </div>
          )}
          <button 
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Add */}
        <div className="p-3">
          <Link to="/tasks?new=true" onClick={() => setMobileOpen(false)}>
            <Button className={cn(
              "w-full gap-2 rounded-xl shadow-sm",
              collapsed && "px-0"
            )}>
              <Plus className="w-4 h-4" />
              {!collapsed && <span>Nova Tarefa</span>}
            </Button>
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
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <Link 
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            <Settings className="w-[18px] h-[18px]" />
            {!collapsed && <span>Configurações</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}