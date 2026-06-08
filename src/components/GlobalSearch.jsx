import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, CheckCircle2, Calendar, Pill, FileText, Clock, Loader2 } from 'lucide-react';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({});
      setLoading(false);
      return;
    }

    setLoading(true);
    base44.functions.invoke('globalSearch', { query }).then(res => {
      setResults(res.data.results || {});
      setLoading(false);
    });
  }, [query]);

  const handleSelectTask = (taskId) => {
    setOpen(false);
    navigate(`/tasks?id=${taskId}`);
  };

  const handleSelectDiary = (date) => {
    setOpen(false);
    navigate(`/daily-list?date=${date}`);
  };

  const handleSelectAppointment = (appointmentId) => {
    setOpen(false);
    navigate(`/health?tab=appointments&id=${appointmentId}`);
  };

  const handleSelectTest = (testId) => {
    setOpen(false);
    navigate(`/health?tab=tests&id=${testId}`);
  };

  const handleSelectMedication = (medId) => {
    setOpen(false);
    navigate(`/health?tab=medications&id=${medId}`);
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Buscar tarefas, diário, saúde..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Buscando...
            </div>
          )}

          {!loading && !query && (
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              Comece a digitar para buscar...
            </CommandEmpty>
          )}

          {!loading && query && Object.values(results).every(r => r.length === 0) && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}

          {results.tasks?.length > 0 && (
            <CommandGroup heading="📋 Tarefas">
              {results.tasks.map(task => (
                <CommandItem
                  key={task.id}
                  onSelect={() => handleSelectTask(task.id)}
                  className="cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2 opacity-50" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground">{format(new Date(task.due_date), 'PPP', { locale: ptBR })}</p>
                    )}
                  </div>
                  <span className="text-xs ml-2 opacity-50">{task.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.diary?.length > 0 && (
            <CommandGroup heading="📔 Diário">
              {results.diary.map(entry => (
                <CommandItem
                  key={entry.id}
                  onSelect={() => handleSelectDiary(entry.date)}
                  className="cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2 opacity-50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">
                      {format(new Date(entry.date), 'PPP', { locale: ptBR })} {entry.mood}
                    </p>
                    <p className="text-sm truncate text-foreground">{entry.diary_text || entry.goals_text}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.appointments?.length > 0 && (
            <CommandGroup heading="🏥 Consultas">
              {results.appointments.map(appt => (
                <CommandItem
                  key={appt.id}
                  onSelect={() => handleSelectAppointment(appt.id)}
                  className="cursor-pointer"
                >
                  <Calendar className="w-4 h-4 mr-2 opacity-50" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{appt.doctor_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appt.date), 'PPP', { locale: ptBR })} às {appt.time}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.tests?.length > 0 && (
            <CommandGroup heading="🧪 Exames">
              {results.tests.map(test => (
                <CommandItem
                  key={test.id}
                  onSelect={() => handleSelectTest(test.id)}
                  className="cursor-pointer"
                >
                  <Search className="w-4 h-4 mr-2 opacity-50" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{test.test_name}</p>
                    <p className="text-xs text-muted-foreground">{test.lab_name}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.medications?.length > 0 && (
            <CommandGroup heading="💊 Medicamentos">
              {results.medications.map(med => (
                <CommandItem
                  key={med.id}
                  onSelect={() => handleSelectMedication(med.id)}
                  className="cursor-pointer"
                >
                  <Pill className="w-4 h-4 mr-2 opacity-50" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.dosage}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors text-sm text-muted-foreground md:bottom-auto md:top-[100px] md:right-4 z-40"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Buscar</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded bg-muted text-xs font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    </>
  );
}