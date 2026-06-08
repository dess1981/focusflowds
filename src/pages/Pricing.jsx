import React, { useState } from 'react';
import { Check, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';

const plans = [
  {
    name: 'Gratuito',
    price: 'R$ 0',
    period: '',
    stripe_price: null,
    description: 'Perfeito para começar',
    features: [
      '5 tarefas ativas por dia',
      'Blocos de tempo básicos',
      'Sem integrações',
      'Sem análise de saúde',
    ],
    cta: 'Comece Grátis',
    badge: null,
    featured: false,
  },
  {
    name: 'Pro Mensal',
    price: 'R$ 19,90',
    period: '/mês',
    stripe_price: 'price_1TfxFQ7yK1oaJE6CtPhoSFr3',
    description: 'Completo com renovação mensal',
    features: [
      '✓ Tarefas ilimitadas',
      '✓ Blocos de tempo completos',
      '✓ Google Calendar + Gmail + Drive',
      '✓ Módulo de Saúde',
      '✓ Análise de produtividade',
      '✓ Diário com IA',
      '✓ Suporte por email',
    ],
    cta: 'Escolher Pro Mensal',
    badge: null,
    featured: true,
  },
  {
    name: 'Pro Anual',
    price: 'R$ 149,90',
    period: '/ano',
    stripe_price: 'price_1TfxFQ7yK1oaJE6CCEVfVJ1u',
    description: 'Melhor valor - 2 meses grátis',
    features: [
      '✓ Tudo do Pro Mensal',
      '✓ 2 meses grátis (R$ 49,80 economia)',
      '✓ Acesso prioritário a novos recursos',
      '✓ Agentes de IA exclusivos',
    ],
    cta: 'Escolher Pro Anual',
    badge: 'ECONOMIZE 25%',
    featured: false,
  },
];

export default function Pricing() {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async (stripePrice) => {
    if (!stripePrice) return; // Free plan

    if (window.self !== window.top) {
      alert('O checkout funciona apenas no app publicado. Abra em nova aba!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        price_id: stripePrice,
        promo_code: promoCode,
      });

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        setError(response.data.error || 'Erro ao criar sessão de checkout');
      }
    } catch (err) {
      setError('Erro ao processar checkout. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold tracking-tight mb-3">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground text-lg">
            Desbloqueie todo o potencial do FocusFlow com a assinatura Pro
          </p>
        </div>

        {/* Promo Code */}
        <div className="max-w-md mx-auto mb-12 p-4 rounded-lg bg-primary/10 border border-primary/30">
          <Label className="text-sm font-semibold mb-2 block">Código Promocional</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: FOCUSFLOW7"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              disabled={loading}
              className="text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Use <strong>FOCUSFLOW7</strong> para 7 dias grátis (100% off)
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative transition-all ${
                plan.featured
                  ? 'ring-2 ring-primary shadow-2xl scale-105 md:scale-110'
                  : 'hover:shadow-lg'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold">
                  {plan.badge}
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.featured && <Crown className="w-5 h-5 text-primary" />}
                </div>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-sm text-muted-foreground font-normal">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  onClick={() => handleCheckout(plan.stripe_price)}
                  disabled={loading}
                  className={`w-full ${
                    plan.featured
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {loading ? 'Processando...' : plan.cta}
                </Button>

                {/* Features */}
                <div className="space-y-3 pt-4 border-t border-border">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-heading font-bold mb-6">Perguntas Frequentes</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Como funciona o teste de 7 dias?</h4>
              <p className="text-muted-foreground text-sm">
                Use o código FOCUSFLOW7 na assinatura Pro. Você tem 7 dias grátis, sem cobrança. Após 7 dias, o cartão é cobrado automaticamente.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Posso cancelar quando quiser?</h4>
              <p className="text-muted-foreground text-sm">
                Sim! Cancele sua assinatura a qualquer momento nas configurações. Nenhuma taxa de cancelamento.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Qual plano é melhor para mim?</h4>
              <p className="text-muted-foreground text-sm">
                O Pro Mensal é ideal para testar. O Pro Anual economiza R$ 49,80 (2 meses grátis) se você planeja usar por mais tempo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}