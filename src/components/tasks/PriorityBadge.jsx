import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

const priorityConfig = {
  urgent: { label: 'Urgente', icon: AlertTriangle, classes: 'bg-red-100 text-red-700 border-red-200' },
  high: { label: 'Alta', icon: ArrowUp, classes: 'bg-orange-100 text-orange-700 border-orange-200' },
  medium: { label: 'Média', icon: Minus, classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  low: { label: 'Baixa', icon: ArrowDown, classes: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function PriorityBadge({ priority, size = 'sm' }) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-medium",
      config.classes,
      size === 'sm' ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
    )}>
      <Icon className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
}