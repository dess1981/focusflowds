import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { Trash2, Plus, Phone, MessageCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function FocusModeSettings({ open, onOpenChange }) {
  const [newContact, setNewContact] = useState({ name: '', phone: '', method: 'whatsapp' });
  
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['focus-settings'],
    queryFn: async () => {
      const list = await base44.entities.FocusSettings.list();
      return list[0] || {};
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return await base44.entities.FocusSettings.update(settings.id, data);
      } else {
        return await base44.entities.FocusSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-settings'] });
    },
  });

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) return;
    
    const updated = {
      ...settings,
      emergency_contacts: [...(settings?.emergency_contacts || []), { ...newContact, id: Date.now().toString() }],
    };
    
    await updateSettingsMutation.mutateAsync(updated);
    setNewContact({ name: '', phone: '', method: 'whatsapp' });
  };

  const handleRemoveContact = async (contactId) => {
    const updated = {
      ...settings,
      emergency_contacts: (settings?.emergency_contacts || []).filter(c => c.id !== contactId),
    };
    
    await updateSettingsMutation.mutateAsync(updated);
  };

  const handleToggle = async (field) => {
    const updated = {
      ...settings,
      [field]: !settings?.[field],
    };
    
    await updateSettingsMutation.mutateAsync(updated);
  };

  const handleUpdateMessage = async (message) => {
    const updated = {
      ...settings,
      auto_response_message: message,
    };
    
    await updateSettingsMutation.mutateAsync(updated);
  };

  if (!settings) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>⏱️ Configurações do Modo Foco</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Auto-response toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <p className="text-sm font-medium">Resposta Automática</p>
              <p className="text-xs text-muted-foreground">Enviar mensagem padrão quando alguém entrar em contato</p>
            </div>
            <Switch
              checked={settings.auto_response_enabled}
              onCheckedChange={() => handleToggle('auto_response_enabled')}
            />
          </div>

          {/* Auto-response message */}
          {settings.auto_response_enabled && (
            <div>
              <Label className="text-xs">Mensagem de Resposta</Label>
              <Textarea
                value={settings.auto_response_message || ''}
                onChange={e => handleUpdateMessage(e.target.value)}
                placeholder="Estou em foco agora..."
                className="mt-1 h-20"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                💡 Esta mensagem será enviada automaticamente para contatos que tentarem se comunicar
              </p>
            </div>
          )}

          {/* Emergency notifications */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <p className="text-sm font-medium">Notificar Emergência</p>
              <p className="text-xs text-muted-foreground">Avisar contatos ao iniciar foco</p>
            </div>
            <Switch
              checked={settings.notify_emergency_contacts}
              onCheckedChange={() => handleToggle('notify_emergency_contacts')}
            />
          </div>

          {/* End notification */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <p className="text-sm font-medium">Notificar Fim</p>
              <p className="text-xs text-muted-foreground">Avisar quando foco termina</p>
            </div>
            <Switch
              checked={settings.focus_end_notification}
              onCheckedChange={() => handleToggle('focus_end_notification')}
            />
          </div>

          {/* Emergency contacts */}
          <div>
            <Label className="text-xs">Contatos de Emergência</Label>
            <p className="text-[10px] text-muted-foreground mb-2.5">
              Serão notificados durante sessões de foco
            </p>
            
            <div className="space-y-2 mb-3">
              {(settings.emergency_contacts || []).map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {contact.method === 'whatsapp' ? (
                      <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{contact.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{contact.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveContact(contact.id)}
                    className="p-1 hover:bg-destructive/20 rounded transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add contact form */}
            <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-muted/20">
              <Input
                placeholder="Nome"
                value={newContact.name}
                onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                className="text-sm h-8"
              />
              <Input
                placeholder="+55 11 9999-9999"
                value={newContact.phone}
                onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                className="text-sm h-8 font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setNewContact({ ...newContact, method: 'whatsapp' })}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded transition-colors border",
                    newContact.method === 'whatsapp'
                      ? "bg-green-500/20 border-green-500/50 text-green-400"
                      : "bg-muted/30 border-border"
                  )}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setNewContact({ ...newContact, method: 'sms' })}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded transition-colors border",
                    newContact.method === 'sms'
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                      : "bg-muted/30 border-border"
                  )}
                >
                  SMS
                </button>
              </div>
              <Button
                onClick={handleAddContact}
                size="sm"
                className="w-full h-8 text-xs"
                disabled={!newContact.name || !newContact.phone}
              >
                <Plus className="w-3 h-3 mr-1" /> Adicionar
              </Button>
            </div>
          </div>

          {/* Info box */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-xs leading-relaxed">
              📱 <strong>Nota:</strong> Para usar WhatsApp e SMS, você precisa conectar suas credenciais (Twilio/WhatsApp Business API) nas configurações.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}