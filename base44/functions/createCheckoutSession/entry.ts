import Stripe from 'npm:stripe@14.18.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const { price_id, promo_code } = await req.json();

    if (!price_id) {
      return Response.json(
        { error: 'Price ID é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`Creating checkout session for price: ${price_id}, promo: ${promo_code}`);

    // Validar e preparar parâmetros do Stripe
    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      success_url: `${new URL(req.url).origin}/pricing?success=true`,
      cancel_url: `${new URL(req.url).origin}/pricing?cancel=true`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
    };

    // Adicionar cupom promocional se fornecido
    if (promo_code) {
      sessionParams.discounts = [
        {
          coupon: promo_code,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`Checkout session created: ${session.id}`);

    return Response.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error('Checkout error:', error.message);

    // Tratar erros específicos do Stripe
    if (error.type === 'StripeInvalidRequestError') {
      return Response.json(
        { error: 'Código promocional inválido ou expirado' },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Erro ao criar sessão de checkout' },
      { status: 500 }
    );
  }
});