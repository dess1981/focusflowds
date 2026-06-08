import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DelegateTaskDialog({ isOpen, onClose, task }) {
  const [email, setEmail] = useState('');
  const [createFollowup, setCreateFollowup] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelegate = async () => {
    if (!email.trim()) {
      toast.error('Informe o email do destinatário');
      return;
    }

    setIsLoading(true);
    try {
      await base44.functions.invoke('delegateTask', {
        taskId: task.id,
        delegatedTo: email,
        createFollowup
      });

      toast.success('Tarefa delegada com sucesso!');
      setEmail('');
      setCreateFollowup(true);
      onClose();
    } catch (error) {
      toast.error('Erro ao delegar tarefa: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delegar Tarefa</DialogTitle>
          <DialogDescription>
            Envie "{task?.title}" para alguém completar e devolver por email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Email do destinatário</label>
            <Input
              placeholder="nome@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Um email será enviado com os detalhes da tarefa
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="followup"
              checked={createFollowup}
              onCheckedChange={setCreateFollowup}
              disabled={isLoading}
            />
            <label htmlFor="followup" className="text-sm cursor-pointer">
              Criar tarefa de acompanhamento
            </label>
          </div>

          <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
            <p className="text-xs text-foreground/80">
              <strong>Como funciona:</strong>
              <br />
              1. Email é enviado com os dados da tarefa
              <br />
              2. Destinatário pode responder com o status
              <br />
              3. Resposta atualiza automaticamente a tarefa
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleDelegate} disabled={isLoading || !email.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Delegando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Delegar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}