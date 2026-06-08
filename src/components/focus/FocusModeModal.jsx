import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Play, Pause, RotateCcw } from 'lucide-react';

export default function FocusModeModal({ taskId, onExit, isActive }) {
  const [task, setTask] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    if (!taskId) return;
    base44.entities.Task.list().then(tasks => {
      const found = tasks.find(t => t.id === taskId);
      if (found) {
        setTask(found);
        const estimatedSeconds = (found.estimated_minutes || 25) * 60;
        setTimeRemaining(estimatedSeconds);
        setTotalSeconds(estimatedSeconds);
      }
    });
  }, [taskId]);

  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalSeconds > 0 ? ((totalSeconds - timeRemaining) / totalSeconds) * 100 : 0;

  if (!isActive || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur border-primary/30">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-primary">Modo de Foco</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onExit}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Task Info */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tarefa Atual</p>
            <p className="text-lg font-semibold text-foreground">{task.title}</p>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
            )}
          </div>

          {/* Timer Display */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl font-bold font-mono text-primary mb-2">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-muted-foreground">
                {task.estimated_minutes || 25} minutos estimados
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <Button
              onClick={() => setIsRunning(!isRunning)}
              className="flex-1 gap-2"
              variant={isRunning ? 'secondary' : 'default'}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Iniciar
                </>
              )}
            </Button>

            <Button
              onClick={() => {
                setTimeRemaining(totalSeconds);
                setIsRunning(false);
              }}
              variant="outline"
              size="icon"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Notification Badge */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground">
              🔕 Notificações não essenciais bloqueadas
            </p>
          </div>

          {/* Exit Button */}
          <Button onClick={onExit} variant="outline" className="w-full">
            Sair do Modo de Foco
          </Button>
        </div>
      </Card>
    </div>
  );
}