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
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Calendar, Clock, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MedicalAppointmentsPanel() {
  const [showForm, setShowForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [form, setForm] = useState({
    doctor_name: '',
    specialty: '',
    clinic_name: '',
    date: '',
    time: '',
    location: '',
    phone: '',
    reason: '',
    notes: '',
    status: 'agendada',
    health_insurance: '',
  });
  const queryClient = useQueryClient();

  const { data: appointments = [] } = useQuery({
    queryKey: ['medical-appointments'],
    queryFn: () => base44.entities.MedicalAppointment.list('-date'),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingAppt) {
        await base44.entities.MedicalAppointment.update(editingAppt.id, data);
      } else {
        await base44.entities.MedicalAppointment.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-appointments'] });
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MedicalAppointment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medical-appointments'] }),
  });

  const resetForm = () => {
    setEditingAppt(null);
    setForm({
      doctor_name: '',
      specialty: '',
      clinic_name: '',
      date: '',
      time: '',
      location: '',
      phone: '',
      reason: '',
      notes: '',
      status: 'agendada',
      health_insurance: '',
    });
  };

  const openForm = (appt = null) => {
    if (appt) {
      setEditingAppt(appt);
      setForm({ ...appt });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const statusConfig = {
    agendada: { label: 'Agendada', color: 'bg-blue-500/20 text-blue-600' },
    realizada: { label: 'Realizada', color: 'bg-green-500/20 text-green-600' },
    cancelada: { label: 'Cancelada', color: 'bg-red-500/20 text-red-600' },
  };

  const upcomingAppointments = appointments.filter(a => a.status === 'agendada');
  const pastAppointments = appointments.filter(a => a.status !== 'agendada');

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Consultas Médicas</CardTitle>
            <Button size="sm" onClick={() => openForm()} className="gap-1">
              <Plus className="w-3 h-3" />
              Nova Consulta
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingAppointments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">PRÓXIMAS CONSULTAS</h4>
              {upcomingAppointments.map(appt => (
                <div key={appt.id} className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{appt.doctor_name}</p>
                      {appt.specialty && (
                        <p className="text-xs text-muted-foreground">{appt.specialty}</p>
                      )}
                    </div>
                    <Badge className={statusConfig[appt.status].color}>
                      {statusConfig[appt.status].label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {appt.date && appt.time && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(appt.date), 'dd/MMM', { locale: ptBR })} às {appt.time}
                      </div>
                    )}
                    {appt.clinic_name && (
                      <p>📍 {appt.clinic_name}</p>
                    )}
                    {appt.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        {appt.phone}
                      </div>
                    )}
                    {appt.reason && (
                      <p>Motivo: {appt.reason}</p>
                    )}
                  </div>

                  <div className="flex gap-1 pt-1">
                    <button
                      onClick={() => openForm(appt)}
                      className="p-1.5 hover:bg-primary/10 rounded-lg text-primary text-xs transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(appt.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive text-xs transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pastAppointments.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              <h4 className="text-xs font-semibold text-muted-foreground">HISTÓRICO</h4>
              {pastAppointments.map(appt => (
                <div key={appt.id} className="p-2 rounded-lg bg-muted/30 border border-border/50 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{appt.doctor_name}</p>
                      <p className="text-muted-foreground">{format(new Date(appt.date), 'dd/MMM/yyyy', { locale: ptBR })}</p>
                    </div>
                    <Badge variant="outline">{statusConfig[appt.status].label}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {appointments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma consulta registrada</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAppt ? 'Editar Consulta' : 'Nova Consulta Médica'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Médico *</Label>
                <Input
                  value={form.doctor_name}
                  onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
                  placeholder="Dr. João Silva"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Especialidade</Label>
                <Input
                  value={form.specialty}
                  onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                  placeholder="Cardiologia"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Clínica/Hospital</Label>
              <Input
                value={form.clinic_name}
                onChange={e => setForm(f => ({ ...f, clinic_name: e.target.value }))}
                placeholder="Hospital Central"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Horário *</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Endereço</Label>
              <Input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Rua, número..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Plano de Saúde</Label>
                <Input
                  value={form.health_insurance}
                  onChange={e => setForm(f => ({ ...f, health_insurance: e.target.value }))}
                  placeholder="Unimed, Bradesco..."
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Motivo da Consulta</Label>
              <Input
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Acompanhamento, avaliação..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="realizada">Realizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notas sobre a consulta..."
                className="mt-1 min-h-[60px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.doctor_name.trim() || !form.date || !form.time || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}