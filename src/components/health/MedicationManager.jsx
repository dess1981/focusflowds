import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function MedicationManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [form, setForm] = useState({
    name: '',
    dosage: '',
    frequency: 'uma vez',
    time_of_day: [],
    doctor: '',
    notes: '',
  });
  const queryClient = useQueryClient();

  const { data: medications = [] } = useQuery({
    queryKey: ['medications'],
    queryFn: () => base44.entities.Medication.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingMed) {
        await base44.entities.Medication.update(editingMed.id, data);
      } else {
        await base44.entities.Medication.create({ ...data, active: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (medId) => base44.entities.Medication.update(medId, { active: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medications'] }),
  });

  const resetForm = () => {
    setEditingMed(null);
    setForm({
      name: '',
      dosage: '',
      frequency: 'uma vez',
      time_of_day: [],
      doctor: '',
      notes: '',
    });
  };

  const openForm = (med = null) => {
    if (med) {
      setEditingMed(med);
      setForm({
        name: med.name,
        dosage: med.dosage || '',
        frequency: med.frequency || 'uma vez',
        time_of_day: med.time_of_day || [],
        doctor: med.doctor || '',
        notes: med.notes || '',
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const addTime = () => {
    setForm(f => ({
      ...f,
      time_of_day: [...f.time_of_day, '08:00'],
    }));
  };

  const removeTime = (idx) => {
    setForm(f => ({
      ...f,
      time_of_day: f.time_of_day.filter((_, i) => i !== idx),
    }));
  };

  const updateTime = (idx, value) => {
    setForm(f => ({
      ...f,
      time_of_day: f.time_of_day.map((t, i) => (i === idx ? value : t)),
    }));
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Medicações Cadastradas</CardTitle>
            <Button size="sm" onClick={() => openForm()} className="gap-1">
              <Plus className="w-3 h-3" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {medications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhuma medicação cadastrada
            </p>
          ) : (
            medications.map(med => (
              <div key={med.id} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{med.name} - {med.dosage}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {med.time_of_day?.length > 0 ? `${med.frequency} · ${med.time_of_day.join(', ')}` : 'Sem horários'}
                    </p>
                    {med.doctor && (
                      <p className="text-xs text-muted-foreground mt-0.5">Dr. {med.doctor}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openForm(med)}
                      className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(med.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMed ? 'Editar Medicação' : 'Adicionar Medicação'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label>Nome do medicamento *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Ritalina"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Dosagem</Label>
              <Input
                value={form.dosage}
                onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))}
                placeholder="Ex: 10mg"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Frequência</Label>
              <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uma vez">Uma vez ao dia</SelectItem>
                  <SelectItem value="duas vezes">Duas vezes ao dia</SelectItem>
                  <SelectItem value="três vezes">Três vezes ao dia</SelectItem>
                  <SelectItem value="conforme necessário">Conforme necessário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Horários de ingestão</Label>
                <Button size="sm" variant="outline" onClick={addTime} className="h-7 gap-1">
                  <Plus className="w-3 h-3" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {form.time_of_day.map((time, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={e => updateTime(idx, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeTime(idx)}
                      className="px-2"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Médico prescrevente</Label>
              <Input
                value={form.doctor}
                onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))}
                placeholder="Nome do médico"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Notas adicionais</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Efeitos colaterais, observações..."
                className="mt-1 min-h-[80px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.name.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}