import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Lista de todas as entidades a deletar
    const entities = [
      'Task',
      'TimeBlock',
      'Category',
      'Project',
      'Medication',
      'MedicationLog',
      'MedicalAppointment',
      'MedicalTest',
      'MeditationSession',
      'DailyEntry',
      'TdahArticle',
      'NotificationPreference',
      'FocusSettings',
      'ReportPreference',
      'TaskTemplate',
    ];

    let totalDeleted = 0;

    // Deletar registros de cada entidade
    for (const entityName of entities) {
      try {
        // Buscar todos os registros da entidade
        const records = await base44.asServiceRole.entities[entityName].list(null, 1000);

        // Deletar cada registro
        for (const record of records) {
          await base44.asServiceRole.entities[entityName].delete(record.id);
        }

        const count = records.length;
        totalDeleted += count;
        console.log(`Deletados ${count} registros de ${entityName}`);
      } catch (error) {
        console.log(`Pulado ${entityName}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      message: `Todos os dados foram resetados. Total deletado: ${totalDeleted} registros.`,
      totalDeleted,
    });
  } catch (error) {
    console.error('Reset error:', error.message);
    return Response.json(
      { error: 'Erro ao resetar dados', message: error.message },
      { status: 500 }
    );
  }
});