import React, { useState, useEffect } from 'react';
import { Palette, Globe, Bell, User, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ResetDataButton from '@/components/dev/ResetDataButton';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: notifPrefs = [] } = useQuery({
    queryKey: ['notif-prefs'],
    queryFn: () => base44.entities.NotificationPreference.list(),
  });

  const prefs = notifPrefs[0] || {};

  const updatePrefs = useMutation({
    mutationFn: async (data) => {
      if (prefs.id) {
        await base44.entities.NotificationPreference.update(prefs.id, data);
      } else {
        await base44.entities.NotificationPreference.create(data);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notif-prefs'] }),
  });

  const togglePref = (key) => {
    updatePrefs.mutate({ ...prefs, [key]: !prefs[key] });
  };

  const themeLabels = {
    dark: t('darkMode'),
    purple: t('purple'),
    cyan: t('cyan'),
    forest: t('forest'),
  };

  const themePreview = {
    dark: 'bg-slate-900',
    purple: 'bg-purple-900',
    cyan: 'bg-cyan-900',
    forest: 'bg-emerald-900',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Personalize sua experiência no FocusFlow
        </p>
      </div>

      {/* Perfil do Usuário */}
      {user && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>Suas informações de conta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                {user.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold">{user.full_name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />{user.email}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">Função: {user.role || 'user'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tema */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>{t('theme')}</CardTitle>
              <CardDescription>Escolha o visual que mais gosta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(themeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`p-4 rounded-lg border-2 transition-all text-left group ${
                  theme === key
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${themePreview[key]} shadow-lg`} />
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {key === 'dark' && 'Escuro profundo'}
                      {key === 'purple' && 'Tons roxos'}
                      {key === 'cyan' && 'Tons ciano'}
                      {key === 'forest' && 'Tons verdes'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Idioma */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-accent" />
            <div>
              <CardTitle>{t('language')}</CardTitle>
              <CardDescription>Selecione seu idioma preferido</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-w-xs">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">🇧🇷 Português (Brasil)</SelectItem>
              <SelectItem value="en">🇺🇸 English (US)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-3">
            A interface será atualizada imediatamente após a mudança.
          </p>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-accent" />
            <div>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Controle quais alertas você recebe</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'medication_reminders', label: 'Lembretes de medicamentos', desc: 'Alertas sonoros e visuais na hora de tomar remédios' },
            { key: 'appointment_reminders', label: 'Lembretes de consultas', desc: 'Aviso antes das consultas médicas agendadas' },
            { key: 'task_reminders', label: 'Lembretes de tarefas', desc: 'Notificação de tarefas vencidas ou com prazo próximo' },
            { key: 'meditation_reminders', label: 'Lembretes de meditação', desc: 'Sugestão diária de prática de meditação' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={prefs[key] !== false}
                onCheckedChange={() => togglePref(key)}
                disabled={updatePrefs.isPending}
              />
            </div>
          ))}
          <div className="border-t border-border pt-3">
            <Label className="text-sm font-medium mb-2 block">Antecedência para medicamentos</Label>
            <Select
              value={String(prefs.medication_advance_minutes || 10)}
              onValueChange={(v) => updatePrefs.mutate({ ...prefs, medication_advance_minutes: Number(v) })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 minutos antes</SelectItem>
                <SelectItem value="30">30 minutos antes</SelectItem>
                <SelectItem value="60">1 hora antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-muted/50 border-muted-foreground/20">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              ✨ <strong>Toque especial:</strong> Suas preferências são salvas automaticamente no navegador.
            </p>
            <p className="text-muted-foreground">
              🚀 <strong>Sem espera:</strong> As mudanças são aplicadas instantaneamente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reset Data - Dev */}
      <Card className="bg-destructive/5 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetDataButton />
        </CardContent>
      </Card>
    </div>
  );
}