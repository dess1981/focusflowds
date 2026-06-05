import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCard from './TaskCard';

const COLUMNS = [
  { id: 'todo', label: 'A Fazer', color: 'bg-slate-100 border-slate-200', dot: 'bg-slate-400' },
  { id: 'in_progress', label: 'Em Progresso', color: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  { id: 'done', label: 'Concluído', color: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  { id: 'cancelled', label: 'Cancelado', color: 'bg-red-50 border-red-200', dot: 'bg-red-400' },
];

export default function KanbanBoard({ tasks, onStatusChange, onTaskClick, onNewTask }) {
  const [draggingId, setDraggingId] = useState(null);

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id);
    return acc;
  }, {});

  const handleDragEnd = (result) => {
    setDraggingId(null);
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const task = tasks.find(t => t.id === draggableId);
    if (task) {
      onStatusChange(task, destination.droppableId);
    }
  };

  return (
    <DragDropContext
      onDragStart={(start) => setDraggingId(start.draggableId)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus[col.id] || [];
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-[280px] flex flex-col"
            >
              {/* Column header */}
              <div className={cn('rounded-t-xl border px-3 py-2.5 flex items-center justify-between', col.color)}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', col.dot)} />
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="text-xs text-muted-foreground bg-white/60 px-1.5 py-0.5 rounded-full font-medium">
                    {colTasks.length}
                  </span>
                </div>
                {col.id === 'todo' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onNewTask()}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {/* Droppable area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex-1 rounded-b-xl border border-t-0 p-2 space-y-2 transition-colors min-h-[120px]',
                      col.color,
                      snapshot.isDraggingOver && 'ring-2 ring-primary/30 bg-primary/5'
                    )}
                  >
                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              'rounded-xl transition-shadow',
                              snapshot.isDragging && 'shadow-xl rotate-1 opacity-90'
                            )}
                          >
                            <TaskCard
                              task={task}
                              compact
                              onStatusChange={onStatusChange}
                              onClick={() => onTaskClick(task)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-6 text-xs text-muted-foreground italic">
                        Arraste tarefas aqui
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}