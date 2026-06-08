import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import HealthHub from '@/components/health/HealthHub';

export default function Health() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Saúde & Bem-estar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), 'EEEE, d MMMM', { locale: ptBR })}
        </p>
      </div>

      <HealthHub />
    </div>
  );
}