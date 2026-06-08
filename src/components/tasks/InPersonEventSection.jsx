import React, { useState } from 'react';
import { MapPin, Navigation, Clock, Bell, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const TRAVEL_PRESETS = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '20 min', value: 20 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
];

const REMINDER_OPTIONS = [
  { label: 'Na hora de sair (= locomoção)', value: 0 },
  { label: '5 min antes de sair', value: 5 },
  { label: '10 min antes de sair', value: 10 },
  { label: '15 min antes de sair', value: 15 },
  { label: '30 min antes de sair', value: 30 },
];

export default function InPersonEventSection({ form, set }) {
  const [showTravelTip, setShowTravelTip] = useState(false);

  const departureTime = () => {
    if (!form.time_block_start || !form.travel_minutes) return null;
    const [h, m] = form.time_block_start.split(':').map(Number);
    const total = h * 60 + m - Number(form.travel_minutes);
    if (total < 0) return null;
    const dh = Math.floor(total / 60);
    const dm = total % 60;
    return `${String(dh).padStart(2, '0')}:${String(dm).padStart(2, '0')}`;
  };

  const reminderTime = () => {
    if (!form.time_block_start || !form.travel_minutes) return null;
    const [h, m] = form.time_block_start.split(':').map(Number);
    const reminderMins = Number(form.departure_reminder_minutes) || 0;
    const total = h * 60 + m - Number(form.travel_minutes) - reminderMins;
    if (total < 0) return null;
    const dh = Math.floor(total / 60);
    const dm = total % 60;
    return `${String(dh).padStart(2, '0')}:${String(dm).padStart(2, '0')}`;
  };

  const dept = departureTime();
  const rmdTime = reminderTime();

  return (
    <div
      className="rounded-xl p-4 space-y-4"
      style={{ background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.25)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4" style={{ color: '#fb923c' }} />
        <span className="text-sm font-semibold" style={{ color: '#fb923c' }}>Evento Presencial</span>
      </div>

      {/* Location name */}
      <div>
        <Label className="text-xs text-muted-foreground">Nome do local</Label>
        <Input
          value={form.location_name || ''}
          onChange={e => set('location_name', e.target.value)}
          placeholder="Ex: Escritório Central, Hospital..."
          className="mt-1 h-8 text-sm"
        />
      </div>

      {/* Address */}
      <div>
        <Label className="text-xs text-muted-foreground">Endereço completo</Label>
        <Input
          value={form.location_address || ''}
          onChange={e => set('location_address', e.target.value)}
          placeholder="Rua, número, bairro, cidade..."
          className="mt-1 h-8 text-sm"
        />
        {form.location_address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location_address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs hover:underline"
            style={{ color: '#fb923c' }}
          >
            <Navigation className="w-3 h-3" />
            Ver no Google Maps
          </a>
        )}
      </div>

      {/* Travel time */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <Label className="text-xs text-muted-foreground">Tempo de locomoção</Label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TRAVEL_PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => set('travel_minutes', p.value)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                form.travel_minutes === p.value
                  ? "border-orange-400 text-orange-400"
                  : "border-border text-muted-foreground hover:border-orange-400/50"
              )}
              style={form.travel_minutes === p.value ? { background: 'rgba(251,146,60,0.15)' } : {}}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={form.travel_minutes || ''}
            onChange={e => set('travel_minutes', e.target.value ? Number(e.target.value) : '')}
            placeholder="Ou digite os minutos..."
            className="h-8 text-sm"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">min</span>
        </div>
      </div>

      {/* Origin */}
      <div>
        <Label className="text-xs text-muted-foreground">Ponto de saída</Label>
        <Select
          value={form.travel_origin || 'ultimo_evento'}
          onValueChange={v => set('travel_origin', v)}
        >
          <SelectTrigger className="mt-1 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ultimo_evento">📍 Local do último evento do dia</SelectItem>
            <SelectItem value="casa">🏠 Casa</SelectItem>
            <SelectItem value="trabalho">🏢 Trabalho</SelectItem>
            <SelectItem value="outro">✏️ Outro endereço</SelectItem>
          </SelectContent>
        </Select>
        {form.travel_origin === 'outro' && (
          <Input
            value={form.travel_origin_address || ''}
            onChange={e => set('travel_origin_address', e.target.value)}
            placeholder="Endereço de saída..."
            className="mt-2 h-8 text-sm"
          />
        )}
      </div>

      {/* Departure reminder */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-3.5 h-3.5 text-muted-foreground" />
          <Label className="text-xs text-muted-foreground">Lembrete para sair</Label>
        </div>
        <Select
          value={String(form.departure_reminder_minutes ?? 15)}
          onValueChange={v => set('departure_reminder_minutes', Number(v))}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REMINDER_OPTIONS.map(o => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary card — only when we have enough data */}
      {dept && form.time_block_start && (
        <div
          className="rounded-xl p-3 space-y-2"
          style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.35)' }}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: '#fb923c' }} />
            <span className="text-sm font-semibold" style={{ color: '#fb923c' }}>⏰ Seu roteiro de saída</span>
          </div>

          <div className="space-y-1.5 text-sm">
            {rmdTime && Number(form.departure_reminder_minutes) > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-orange-300">{rmdTime}</span>
                <span className="text-muted-foreground">→ 🔔 Lembrete: prepare-se para sair</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-orange-300">{dept}</span>
              <span className="text-muted-foreground">→ 🚗 Hora de sair ({form.travel_minutes} min de trajeto)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold" style={{ color: '#fb923c' }}>{form.time_block_start}</span>
              <span className="text-muted-foreground">→ 📍 Chegada no evento</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTravelTip(!showTravelTip)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lightbulb className="w-3 h-3" />
            Dica para TDAH
            {showTravelTip ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showTravelTip && (
            <div
              className="text-xs rounded-lg p-2.5 leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
            >
              💡 <strong>Para TDAH:</strong> Adicione um buffer de 10-15 min a mais no tempo de deslocamento — imprevistos acontecem! Coloque um alarme no celular para o horário de saída, não só para o evento. Se possível, prepare tudo o que precisa levar na noite anterior.
            </div>
          )}
        </div>
      )}

      {/* Prompt when address filled but no time/travel */}
      {form.location_address && (!form.time_block_start || !form.travel_minutes) && (
        <div
          className="text-xs rounded-lg p-2.5"
          style={{ background: 'rgba(251,146,60,0.08)', color: 'rgba(251,146,60,0.7)' }}
        >
          💡 Preencha o <strong>horário de início</strong> e o <strong>tempo de locomoção</strong> para calcular a hora de saída automaticamente.
        </div>
      )}
    </div>
  );
}