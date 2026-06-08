import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const availableItems = [
  { path: '/', icon: '📅', label: 'Planner' },
  { path: '/daily-list', icon: '✅', label: 'Hoje' },
  { path: '/tasks', icon: '📝', label: 'Tarefas' },
  { path: '/projects', icon: '📁', label: 'Projetos' },
  { path: '/time-blocks', icon: '⏱️', label: 'Blocos' },
  { path: '/calendar', icon: '📆', label: 'Calendário' },
  { path: '/templates', icon: '📋', label: 'Templates' },
  { type: 'voice', icon: '🎤', label: 'Voz' },
  { path: '/health', icon: '❤️', label: 'Saúde' },
  { path: '/email-manager', icon: '✉️', label: 'Gmail' },
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/reports', icon: '📈', label: 'Relatórios' },
  { path: '/monthly', icon: '📉', label: 'Análise' },
  { path: '/categories', icon: '🏷️', label: 'Categorias' },
  { path: '/assistant', icon: '🧠', label: 'IA' },
  { path: '/settings', icon: '⚙️', label: 'Config' },
];

export default function BottomNavCustomizer({ isOpen, onClose }) {
  const [customButtons, setCustomButtons] = useState([]);
  const [available, setAvailable] = useState(availableItems);

  useEffect(() => {
    const saved = localStorage.getItem('customBottomNav');
    if (saved) {
      setCustomButtons(JSON.parse(saved));
      updateAvailable(JSON.parse(saved));
    } else {
      setCustomButtons([
        availableItems[0],
        availableItems[2],
        { type: 'voice', icon: '🎤', label: 'Voz' },
        availableItems[13],
        availableItems[9],
      ]);
    }
  }, [isOpen]);

  const updateAvailable = (selected) => {
    const selectedPaths = selected.map(item => item.path || item.type);
    setAvailable(availableItems.filter(item => !selectedPaths.includes(item.path || item.type)));
  };

  const addButton = (item) => {
    if (customButtons.length >= 5) {
      alert('Máximo 5 botões permitidos');
      return;
    }
    const updated = [...customButtons, item];
    setCustomButtons(updated);
    updateAvailable(updated);
  };

  const removeButton = (index) => {
    const updated = customButtons.filter((_, i) => i !== index);
    setCustomButtons(updated);
    updateAvailable(updated);
  };

  const moveButton = (index, direction) => {
    const updated = [...customButtons];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setCustomButtons(updated);
  };

  const save = () => {
    localStorage.setItem('customBottomNav', JSON.stringify(customButtons));
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Personalizar Menu Inferior</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Botões Selecionados */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Meus Botões ({customButtons.length}/5)</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {customButtons.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-accent/10 border border-accent/30"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{item.label}</span>
                  <div className="flex gap-1">
                    {idx > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveButton(idx, 'up')}
                        className="h-6 w-6 p-0"
                      >
                        ▲
                      </Button>
                    )}
                    {idx < customButtons.length - 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveButton(idx, 'down')}
                        className="h-6 w-6 p-0"
                      >
                        ▼
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeButton(idx)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Itens Disponíveis */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Disponíveis</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {available.map((item) => (
                <button
                  key={item.path || item.type}
                  onClick={() => addButton(item)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left text-sm"
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} className="ml-auto">
            Salvar Customização
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}