import { cn } from '@/lib/utils';
import { Circle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const statusConfig = {
  todo: { label: 'A Fazer', icon: Circle, classes: 'text-slate-500' },
  in_progress: { label: 'Em Progresso', icon: Loader2, classes: 'text-blue-500' },
  done: { label: 'Concluída', icon: CheckCircle2, classes: 'text-green-500' },
  cancelled: { label: 'Cancelada', icon: XCircle, classes: 'text-red-400' },
};

export default function StatusBadge({ status, onClick }) {
  const config = statusConfig[status] || statusConfig.todo;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      title={`Status: ${config.label} — clique para avançar`}
      className={cn(
        "transition-all hover:scale-125 active:scale-95 rounded-full p-0.5 hover:bg-white/10 cursor-pointer",
        config.classes
      )}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}