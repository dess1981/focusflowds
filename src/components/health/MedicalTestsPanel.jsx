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
import { Plus, Pencil, Trash2, FileText, Download, Mail } from 'lucide-react';
import SendTestResultEmailModal from './SendTestResultEmailModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/dateUtils';

export default function MedicalTestsPanel() {
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [emailTest, setEmailTest] = useState(null);
  const [form, setForm] = useState({
    test_name: '',
    date_requested: '',
    date_performed: '',
    date_result: '',
    doctor_requested: '',
    lab_name: '',
    result: '',
    status: 'pendente',
    file_url: '',
    notes: '',
  });
  const queryClient = useQueryClient();

  const { data: tests = [] } = useQuery({
    queryKey: ['medical-tests'],
    queryFn: () => base44.entities.MedicalTest.list('-date_requested'),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTest) {
        await base44.entities.MedicalTest.update(editingTest.id, data);
      } else {
        await base44.entities.MedicalTest.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-tests'] });
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MedicalTest.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medical-tests'] }),
  });

  const resetForm = () => {
    setEditingTest(null);
    setForm({
      test_name: '',
      date_requested: '',
      date_performed: '',
      date_result: '',
      doctor_requested: '',
      lab_name: '',
      result: '',
      status: 'pendente',
      file_url: '',
      notes: '',
    });
  };

  const openForm = (test = null) => {
    if (test) {
      setEditingTest(test);
      setForm({ ...test });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const statusConfig = {
    pendente: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-600', icon: '⏳' },
    em_andamento: { label: 'Em andamento', color: 'bg-blue-500/20 text-blue-600', icon: '⚙️' },
    realizado: { label: 'Realizado', color: 'bg-green-500/20 text-green-600', icon: '✓' },
    sem_resultado: { label: 'Sem resultado', color: 'bg-gray-500/20 text-gray-600', icon: '❌' },
  };

  const pendingTests = tests.filter(t => t.status === 'pendente' || t.status === 'em_andamento');
  const completedTests = tests.filter(t => t.status === 'realizado' || t.status === 'sem_resultado');

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Exames Médicos</CardTitle>
            <Button size="sm" onClick={() => openForm()} className="gap-1">
              <Plus className="w-3 h-3" />
              Novo Exame
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingTests.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">EXAMES PENDENTES</h4>
              {pendingTests.map(test => (
                <div key={test.id} className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{test.test_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Solicitado em {format(parseLocalDate(test.date_requested), 'dd/MMM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <Badge className={statusConfig[test.status].color}>
                      {statusConfig[test.status].icon} {statusConfig[test.status].label}
                    </Badge>
                  </div>

                  {test.doctor_requested && (
                    <p className="text-xs text-muted-foreground">Solicitado por: {test.doctor_requested}</p>
                  )}
                  {test.lab_name && (
                    <p className="text-xs text-muted-foreground">Lab: {test.lab_name}</p>
                  )}

                  <div className="flex gap-1 pt-1">
                    <button
                      onClick={() => openForm(test)}
                      className="p-1.5 hover:bg-primary/10 rounded-lg text-primary text-xs transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setEmailTest(test)}
                      className="p-1.5 hover:bg-accent/10 rounded-lg text-accent text-xs transition-colors"
                      title="Enviar por email"
                    >
                      <Mail className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(test.id)}
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

          {completedTests.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              <h4 className="text-xs font-semibold text-muted-foreground">RESULTADOS</h4>
              {completedTests.map(test => (
                <div key={test.id} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{test.test_name}</p>
                      {test.date_result && (
                        <p className="text-xs text-muted-foreground">
                          Resultado: {format(parseLocalDate(test.date_result), 'dd/MMM/yyyy', { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">{statusConfig[test.status].icon}</Badge>
                  </div>

                  {test.result && (
                    <p className="text-xs text-foreground">Resultado: {test.result}</p>
                  )}

                  <div className="flex gap-1 pt-1">
                    <button
                      onClick={() => openForm(test)}
                      className="p-1.5 hover:bg-primary/10 rounded-lg text-primary text-xs transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setEmailTest(test)}
                      className="p-1.5 hover:bg-accent/10 rounded-lg text-accent text-xs transition-colors"
                      title="Enviar resultado por email"
                    >
                      <Mail className="w-3 h-3" />
                    </button>
                    {test.file_url && (
                      <a
                        href={test.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-accent/10 rounded-lg text-accent text-xs transition-colors"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(test.id)}
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

          {tests.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum exame registrado</p>
          )}
        </CardContent>
      </Card>

      <SendTestResultEmailModal
        test={emailTest}
        open={!!emailTest}
        onClose={() => setEmailTest(null)}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTest ? 'Editar Exame' : 'Registrar Novo Exame'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label>Nome do Exame *</Label>
              <Input
                value={form.test_name}
                onChange={e => setForm(f => ({ ...f, test_name: e.target.value }))}
                placeholder="Hemograma, Colesterol, Ultrassom..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Data Solicitação *</Label>
                <Input
                  type="date"
                  value={form.date_requested}
                  onChange={e => setForm(f => ({ ...f, date_requested: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Data Realizado</Label>
                <Input
                  type="date"
                  value={form.date_performed}
                  onChange={e => setForm(f => ({ ...f, date_performed: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Data Resultado</Label>
                <Input
                  type="date"
                  value={form.date_result}
                  onChange={e => setForm(f => ({ ...f, date_result: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Médico que Solicitou</Label>
                <Input
                  value={form.doctor_requested}
                  onChange={e => setForm(f => ({ ...f, doctor_requested: e.target.value }))}
                  placeholder="Dr. João Silva"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Laboratório</Label>
                <Input
                  value={form.lab_name}
                  onChange={e => setForm(f => ({ ...f, lab_name: e.target.value }))}
                  placeholder="Lab Central"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="sem_resultado">Sem resultado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Resultado</Label>
              <Textarea
                value={form.result}
                onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
                placeholder="Valores, análise..."
                className="mt-1 min-h-[60px] resize-none"
              />
            </div>

            <div>
              <Label>URL do Arquivo (PDF/Imagem)</Label>
              <Input
                value={form.file_url}
                onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))}
                placeholder="https://..."
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label>Notas Adicionais</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Observações..."
                className="mt-1 min-h-[50px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.test_name.trim() || !form.date_requested || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}