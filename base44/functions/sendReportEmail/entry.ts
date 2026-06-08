import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, format, reportType, stats } = await req.json();

    if (!email || !format || !reportType) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate email content based on format
    let emailContent = '';
    let subject = '';

    const reportLabel = reportType === 'daily' ? 'Diário' : reportType === 'weekly' ? 'Semanal' : 'Mensal';
    subject = `📊 Seu Relatório de Produtividade - ${reportLabel}`;

    if (format === 'visual') {
      emailContent = `
        <h2>Seu Relatório de Produtividade - ${reportLabel}</h2>
        <p>Olá ${user.full_name},</p>
        <p>Aqui está seu relatório de produtividade:</p>
        <hr>
        <h3>📊 Resumo</h3>
        <ul>
          <li><strong>Taxa de Conclusão:</strong> ${stats.completionRate}%</li>
          <li><strong>Tarefas Concluídas:</strong> ${stats.completed} de ${stats.total}</li>
          <li><strong>Horas de Foco:</strong> ${stats.totalFocusHours}h</li>
          <li><strong>Tempo Médio:</strong> ${stats.avgFocusMinutes}min por tarefa</li>
        </ul>
        <hr>
        <p>Acesse a versão completa em seu painel para ver os gráficos.</p>
      `;
    } else if (format === 'data') {
      emailContent = `
        <h2>Dados de Produtividade - ${reportLabel}</h2>
        <p>Olá ${user.full_name},</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 8px;"><strong>Métrica</strong></td>
            <td style="padding: 8px;"><strong>Valor</strong></td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 8px;">Taxa de Conclusão</td>
            <td style="padding: 8px;">${stats.completionRate}%</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 8px;">Tarefas Concluídas</td>
            <td style="padding: 8px;">${stats.completed} / ${stats.total}</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 8px;">Horas de Foco</td>
            <td style="padding: 8px;">${stats.totalFocusHours}h</td>
          </tr>
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 8px;">Tempo Médio</td>
            <td style="padding: 8px;">${stats.avgFocusMinutes}min</td>
          </tr>
        </table>
      `;
    } else if (format === 'spreadsheet') {
      emailContent = `
        <h2>Planilha de Produtividade - ${reportLabel}</h2>
        <p>Olá ${user.full_name},</p>
        <p>Seu arquivo CSV foi anexado. Abra em Excel, Google Sheets ou similar.</p>
        <p>Resumo rápido:</p>
        <ul>
          <li>Taxa de Conclusão: ${stats.completionRate}%</li>
          <li>Total de Horas: ${stats.totalFocusHours}h</li>
        </ul>
      `;
    } else if (format === 'text') {
      emailContent = `
        <h2>Relatório de Produtividade - ${reportLabel}</h2>
        <p>Olá ${user.full_name},</p>
        <pre>${generateTextReport(stats, reportLabel)}</pre>
      `;
    } else if (format === 'audio') {
      emailContent = `
        <h2>Relatório em Áudio - ${reportLabel}</h2>
        <p>Olá ${user.full_name},</p>
        <p>Seu relatório em áudio foi gerado. Acesse seu painel para ouvi-lo.</p>
        <p>Resumo: ${stats.completionRate}% de conclusão, ${stats.totalFocusHours}h de foco.</p>
      `;
    }

    // Send email using Core integration
    const response = await base44.integrations.Core.SendEmail({
      to: email,
      subject,
      html: emailContent,
    });

    return Response.json({ success: true, messageId: response.messageId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateTextReport(stats, reportLabel) {
  return `
📊 RELATÓRIO DE PRODUTIVIDADE
Período: ${reportLabel}

RESUMO EXECUTIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Taxa de Conclusão: ${stats.completionRate}%
• Tarefas Concluídas: ${stats.completed} de ${stats.total}
• Horas de Foco Total: ${stats.totalFocusHours}h
• Tempo Médio por Tarefa: ${stats.avgFocusMinutes}min

ANÁLISE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${stats.completionRate > 70 ? '✅ Excelente produtividade neste período!' : stats.completionRate > 50 ? '👍 Produtividade moderada.' : '⚠️ Produtividade abaixo do esperado.'}

PRÓXIMOS PASSOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Revisar tarefas em progresso
2. Ajustar estimativas de tempo
3. Garantir tempo de descanso adequado
  `;
}