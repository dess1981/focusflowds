import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Tag, Trash2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import TaskListDrawer from '@/components/tasks/TaskListDrawer';

const COLORS = ['#4F6BED', '#2ECC94', '#F4A940', '#FF6B6B', '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB'];

export default function Categories() {
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm] = useState({ name: '', color: '#4F6BED' });
  const [drawerCategory, setDrawerCategory] = useState(null);
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editCategory) {
        await base44.entities.Category.update(editCategory.id, data);
      } else {
        await base44.entities.Category.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const openForm = (cat) => {
    if (cat) {
      setEditCategory(cat);
      setForm({ name: cat.name, color: cat.color || '#4F6BED' });
    } else {
      setEditCategory(null);
      setForm({ name: '', color: '#4F6BED' });
    }
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Organize suas tarefas por categorias</p>
        </div>
        <Button onClick={() => openForm(null)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat, i) => {
          const count = tasks.filter(t => t.category_id === cat.id).length;
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:shadow-md transition-all group relative"
                onClick={() => setDrawerCategory(cat)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                    <Tag className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{count} tarefa{count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => { e.stopPropagation(); openForm(cat); }}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(cat.id); }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-16">
          <Tag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhuma categoria criada</p>
        </div>
      )}

      <TaskListDrawer
        open={!!drawerCategory}
        onOpenChange={(v) => !v && setDrawerCategory(null)}
        title={drawerCategory?.name || ''}
        color={drawerCategory?.color}
        tasks={tasks.filter(t => t.category_id === drawerCategory?.id)}
        onEdit={() => { openForm(drawerCategory); setDrawerCategory(null); }}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome da categoria" className="mt-1" />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name.trim()}>
              {editCategory ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}