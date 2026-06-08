import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, ListTodo, LayoutDashboard, Sparkles, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';

const mainItems = [
  { path: '/', icon: CalendarDays, label: 'Planner' },
  { path: '/tasks', icon: ListTodo, label: 'Tarefas' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/templates', icon: LayoutTemplate, label: 'Templates' },
  { path: '/assistant', icon: Sparkles, label: 'IA' },
];

export default function BottomNav() {
  const location = useLocation();

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
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {mainItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]"
              style={isActive ? {
                background: 'rgba(168, 85, 247, 0.15)',
              } : {}}
            >
              <item.icon
                className="w-5 h-5 transition-all duration-200"
                style={isActive ? {
                  color: '#a855f7',
                  filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))',
                } : { color: 'rgba(255,255,255,0.4)' }}
              />
              <span
                className="text-[10px] font-medium transition-all duration-200"
                style={isActive ? { color: '#a855f7' } : { color: 'rgba(255,255,255,0.4)' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}