import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userLanguage = user.language || 'pt-BR';
    const languageName = userLanguage === 'pt-BR' ? 'português brasileiro' : 'inglês';

    // Tópicos essenciais sobre TDAH
    const topics = [
      'O que é TDAH e características principais',
      'Técnicas de organização para pessoas com TDAH',
      'Hiperfoco como um superpoder do TDAH',
      'Como lidar com procrastinação no TDAH',
      'Importância do sono no TDAH',
      'Rejeição sensível à crítica em TDAH',
      'Como pedir ajuda efetivamente com TDAH',
      'Exercício físico como tratamento natural para TDAH',
    ];

    // Usar LLM para gerar artigos traduzidos
    const articles = [];
    
    for (const topic of topics) {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Escreva um artigo curto e descontraído sobre "${topic}" em ${languageName}. 
        
        Instruções:
        - Use linguagem simples e acessível
        - Seja prático e ofereça dicas concretas
        - Tenha empatia e positividade
        - Máximo 3 parágrafos
        - Adicione ao final um emoji relevante
        
        Retorne apenas o conteúdo do artigo, sem título ou marcações.`,
        model: 'gemini_3_flash'
      });

      // Extrair categoria baseado no tópico
      let category = 'Básico';
      if (topic.includes('técnica') || topic.includes('organiz')) category = 'Prático';
      if (topic.includes('Hiperfoco')) category = 'Positivo';
      if (topic.includes('procrastina')) category = 'Desafio';
      if (topic.includes('sono') || topic.includes('Exercício')) category = 'Saúde';
      if (topic.includes('Rejeição') || topic.includes('emocional')) category = 'Emocional';
      if (topic.includes('ajuda')) category = 'Relacionamento';

      articles.push({
        title: topic,
        description: response,
        category,
        language: userLanguage,
        source: 'IA - Gerado e traduzido automaticamente',
        last_updated: new Date().toISOString(),
      });
    }

    // Limpar artigos antigos do mesmo idioma e atualizar
    const existingArticles = await base44.asServiceRole.entities.TdahArticle.filter({ language: userLanguage });
    
    // Deletar antigos
    for (const article of existingArticles) {
      await base44.asServiceRole.entities.TdahArticle.delete(article.id);
    }

    // Criar novos
    await base44.asServiceRole.entities.TdahArticle.bulkCreate(articles);

    return Response.json({
      success: true,
      articlesCreated: articles.length,
      language: userLanguage
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});