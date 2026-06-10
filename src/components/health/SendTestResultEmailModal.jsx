import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/dateUtils';

export default function SendTestResultEmailModal({ test, open, onClose }) {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  // Pre-populate when test changes
  useEffect(() => {
    if (!test) return;
    const dateStr = test.date_result
      ? format(parseLocalDate(test.date_result), 'dd/MM/yyyy', { locale: ptBR })
      : '';
    setSubject(`Resultado do exame: ${test.test_name}`);
    setBody(
      `Olá,\n\nSegue o resultado do exame:\n\n` +
      `📋 Exame: ${test.test_name}\n` +
      (test.doctor_requested ? `👨‍⚕️ Médico solicitante: ${test.doctor_requested}\n` : '') +
      (test.lab_name ? `🏥 Laboratório: ${test.lab_name}\n` : '') +
      (dateStr ? `📅 Data do resultado: ${dateStr}\n` : '') +
      (test.result ? `\nResultado:\n${test.result}\n` : '') +
      (test.notes ? `\nObservações:\n${test.notes}\n` : '') +
      (test.file_url ? `\n📎 Arquivo: ${test.file_url}\n` : '') +
      `\nAtenciosamente.`
    );
  }, [test]);

  const handleSend = async () => {
    if (!toEmail.trim() || !subject.trim()) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: toEmail.trim(),
        subject: subject.trim(),
        body: body,
      });
      toast.success('Email enviado com sucesso!');
      onClose();
    } catch (e) {
      toast.error('Erro ao enviar email: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Enviar Resultado por Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="mb-1 block">Para *</Label>
            <Input
              type="email"
              placeholder="medico@clinica.com.br"
              value={toEmail}
              onChange={e => setToEmail(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">Assunto *</Label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">Mensagem</Label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              className="min-h-[160px] resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>Cancelar</Button>
          <Button
            onClick={handleSend}
            disabled={!toEmail.trim() || !subject.trim() || sending}
            className="gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}