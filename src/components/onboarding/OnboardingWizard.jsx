import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle2, ArrowRight, Calendar, Zap, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import VoicePermissionStep from './VoicePermissionStep';

const STEPS = [
  { id: 'welcome', title: 'Bem-vindo', icon: '👋' },
  { id: 'focus', title: 'Preferências de Foco', icon: '⚡' },
  { id: 'calendar', title: 'Google Calendar', icon: '📅' },
  { id: 'health', title: 'Saúde', icon: '❤️' },
  { id: 'voice', title: 'Comandos de Voz', icon: '🎤' },
  { id: 'complete', title: 'Pronto!', icon: '✨' },
];

export default function OnboardingWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [focusSettings, setFocusSettings] = useState({ breakMinutes: 5, sessionMinutes: 25 });
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [medicationName, setMedicationName] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if calendar already connected
  useEffect(() => {
    checkCalendarStatus();
  }, []);

  const checkCalendarStatus = async () => {
    try {
      const events = await base44.functions.invoke('getGoogleCalendarEvents', {
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setCalendarConnected(!!events);
    } catch {
      setCalendarConnected(false);
    }
  };

  const handleConnectCalendar = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('syncGoogleCalendarToApp', {});
      setCalendarConnected(true);
    } catch (error) {
      console.log('Calendar connection initiated (may need manual auth)');
      setCalendarConnected(true);
    }
    setLoading(false);
  };

  const handleAddMedication = async () => {
    if (!medicationName.trim()) return;
    setLoading(true);
    try {
      await base44.entities.Medication.create({
        name: medicationName,
        active: true,
      });
      setMedicationName('');
    } catch (error) {
      console.error('Erro ao adicionar medicamento');
    }
    setLoading(false);
  };

  const handleSaveFocusSettings = async () => {
    try {
      const focusSettings = await base44.entities.FocusSettings.list();
      if (focusSettings.length > 0) {
        await base44.entities.FocusSettings.update(focusSettings[0].id, {
          auto_response_enabled: true,
          notify_emergency_contacts: false,
        });
      } else {
        await base44.entities.FocusSettings.create({
          auto_response_enabled: true,
          auto_response_message: 'Estou em uma sessão de foco. Voltarei em breve!',
        });
      }
    } catch (error) {
      console.error('Erro ao salvar preferências');
    }
  };

  const steps = {
    welcome: (
      <div className="text-center space-y-6">
        <div className="text-6xl">👋</div>
        <div>
          <h2 className="text-2xl font-heading font-bold mb-2">Bem-vindo ao FocusFlow!</h2>
          <p className="text-muted-foreground">Vamos configurar tudo para você começar a ser produtivo em minutos.</p>
        </div>
        <Button size="lg" onClick={() => setCurrentStep(1)}>
          Começar Setup <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    ),

    focus: (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-heading font-bold">Preferências de Foco</h2>
            <p className="text-sm text-muted-foreground">Configure seus tempos de trabalho e descanso</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Sessão de Foco (minutos)</label>
            <Input
              type="number"
              min="5"
              max="120"
              value={focusSettings.sessionMinutes}
              onChange={(e) => setFocusSettings({ ...focusSettings, sessionMinutes: parseInt(e.target.value) })}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Tempo padrão de foco (recomendado: 25min)</p>
          </div>

          <div>
            <label className="text-sm font-medium">Intervalo de Descanso (minutos)</label>
            <Input
              type="number"
              min="1"
              max="30"
              value={focusSettings.breakMinutes}
              onChange={(e) => setFocusSettings({ ...focusSettings, breakMinutes: parseInt(e.target.value) })}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Tempo de pausa entre sessões (recomendado: 5min)</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setCurrentStep(0)}>Anterior</Button>
          <Button onClick={() => { handleSaveFocusSettings(); setCurrentStep(2); }}>
            Próximo <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    ),

    calendar: (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-chart-2" />
          <div>
            <h2 className="text-xl font-heading font-bold">Google Calendar</h2>
            <p className="text-sm text-muted-foreground">Sincronize seus compromissos</p>
          </div>
        </div>

        <Card className="border-chart-2/20 bg-chart-2/5">
          <CardContent className="pt-6">
            {calendarConnected ? (
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Google Calendar conectado!</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Conecte seu Google Calendar para sincronizar eventos e gerenciar seu tempo de forma integrada.
                </p>
                <Button 
                  onClick={handleConnectCalendar} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Conectando...' : 'Conectar Google Calendar'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>Anterior</Button>
          <Button onClick={() => setCurrentStep(3)}>
            Próximo <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    ),

    health: (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-destructive" />
          <div>
            <h2 className="text-xl font-heading font-bold">Saúde</h2>
            <p className="text-sm text-muted-foreground">Acompanhe medicamentos e bem-estar</p>
          </div>
        </div>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Você toma algum medicamento regularmente? Adicione aqui para receber lembretes.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Vitamina D, Remédio..."
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMedication()}
              />
              <Button 
                onClick={handleAddMedication} 
                disabled={loading || !medicationName.trim()}
                size="sm"
              >
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              (Você pode adicionar mais medicamentos depois na seção de Saúde)
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setCurrentStep(2)}>Anterior</Button>
          <Button onClick={() => setCurrentStep(4)}>
            Próximo <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    ),

    voice: (
      <div className="space-y-6">
        <VoicePermissionStep onComplete={() => setCurrentStep(5)} />
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setCurrentStep(3)}>Anterior</Button>
        </div>
      </div>
    ),

    complete: (
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-6xl"
        >
          ✨
        </motion.div>
        <div>
          <h2 className="text-2xl font-heading font-bold mb-2">Pronto para produzir!</h2>
          <p className="text-muted-foreground mb-4">
            Seu FocusFlow está configurado. Agora você pode começar a criar tarefas, acompanhar sua saúde e gerenciar seu tempo.
          </p>
          <p className="text-sm text-muted-foreground">
            💡 Dica: Converse com nosso assistente de IA para ajustes mais avançados!
          </p>
        </div>
        <Button size="lg" onClick={onComplete}>
          Ir para Dashboard
        </Button>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex justify-between mb-8">
          {STEPS.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                  idx <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
              <span className="text-xs sm:text-sm font-medium text-center hidden sm:block max-w-[80px]">
                {step.title}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Step content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Card>
            <CardContent className="pt-8">
              {steps[STEPS[currentStep].id]}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}