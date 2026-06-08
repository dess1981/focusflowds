import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCard from './TaskCard';

const COLUMNS = [
  { id: 'todo', label: 'A Fazer', headerBg: 'bg-slate-900 border-slate-700', dot: 'bg-slate-400', columnBg: 'bg-slate-950 border-slate-800' },
  { id: 'in_progress', label: 'Em Progresso', headerBg: 'bg-blue-950 border-blue-700', dot: 'bg-blue-400', columnBg: 'bg-blue-950/30 border-blue-800' },
  { id: 'done', label: 'Concluído', headerBg: 'bg-green-950 border-green-700', dot: 'bg-green-400', columnBg: 'bg-green-950/30 border-green-800' },
  { id: 'cancelled', label: 'Cancelado', headerBg: 'bg-red-950 border-red-700', dot: 'bg-red-400', columnBg: 'bg-red-950/30 border-red-800' },
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
              <div className={cn('rounded-t-xl border px-3 py-2.5 flex items-center justify-between', col.headerBg)}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', col.dot)} />
                  <span className="text-sm font-semibold text-white">{col.label}</span>
                  <span className="text-xs text-white/60 bg-white/10 px-1.5 py-0.5 rounded-full font-medium">
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
                      col.columnBg,
                      snapshot.isDraggingOver && 'ring-2 ring-primary/50'
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