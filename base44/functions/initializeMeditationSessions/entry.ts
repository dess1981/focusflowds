import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const defaultMeditations = [
      {
        title: 'Foco & Concentração',
        description: 'Meditação de 5 minutos para melhorar seu foco e clareza mental',
        category: 'foco',
        difficulty: 'iniciante',
        duration_minutes: 5,
      },
      {
        title: 'Calma TDAH',
        description: 'Técnica rápida e eficaz para lidar com a agitação mental característica do TDAH',
        category: 'ansiedade',
        difficulty: 'iniciante',
        duration_minutes: 3,
      },
      {
        title: 'Relaxamento Profundo',
        description: 'Meditação guiada para relaxamento completo de corpo e mente',
        category: 'relaxamento',
        difficulty: 'intermediário',
        duration_minutes: 10,
      },
      {
        title: 'Sono Tranquilo',
        description: 'Sessão preparatória para uma noite de sono reparador e qualidade',
        category: 'sono',
        difficulty: 'intermediário',
        duration_minutes: 15,
      },
      {
        title: 'Gratidão Matinal',
        description: 'Comece o dia com positividade e foco em coisas boas',
        category: 'gratidão',
        difficulty: 'iniciante',
        duration_minutes: 5,
      },
    ];

    // Verificar se já existem meditações
    const existing = await base44.entities.MeditationSession.list();
    const uniqueTitles = new Set(existing.map(m => m.title));

    // Criar apenas as que não existem
    const toCreate = defaultMeditations.filter(m => !uniqueTitles.has(m.title));

    if (toCreate.length > 0) {
      await base44.entities.MeditationSession.bulkCreate(toCreate);
    }

    return Response.json({
      success: true,
      meditationsCreated: toCreate.length,
      totalMeditations: toCreate.length + uniqueTitles.size
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});