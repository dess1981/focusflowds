# 📋 FocusFlow - Documentação Versão Beta

**FocusFlow** é uma plataforma inteligente de produtividade e gerenciamento de tempo, com suporte especial para pessoas com TDAH. Combine planejamento, rastreamento de saúde, foco profundo e inteligência artificial para otimizar seu tempo.

---

## 🚀 Início Rápido

### Primeiro Acesso - Onboarding
1. **Crie sua conta** com email e senha
2. **Siga o guia interativo** (5 passos):
   - Configurar preferências de foco (sessão + intervalo)
   - Conectar Google Calendar
   - Adicionar medicamentos (opcional)
   - Revisar configurações de notificação

### Acesso à Página de Onboarding
- Direto do primeiro acesso: `/onboarding`
- Ou fale com o assistente de IA no dashboard

---

## 📱 Páginas Principais

### 1. **Dashboard** (`/`)
Sua visão geral centralizada com:
- 📊 **KPIs do dia**: Tarefas concluídas, tempo de foco, metas atingidas
- 📈 **Gráficos de tendências**: Produtividade semanal/mensal
- ⚡ **Sessões de foco**: Histórico e estatísticas
- 📌 **Próximas tarefas**: O que vem a seguir
- 🎯 **Progresso de projetos**: Status de cada projeto

### 2. **Planejador Diário** (`/`)
Interface intuitiva para:
- ✅ Visualizar tarefas do dia
- 🔥 Iniciar sessão de foco
- 📝 Log de diário diário
- 🎯 Metas e objetivos do dia
- 😊 Rastreamento de humor

### 3. **Tarefas** (`/tasks`)
Gerenciador completo de tarefas com:
- **Visualizações**: Lista ou Kanban
- **Filtros**: Status, prioridade, ocultar concluídas
- **Busca global**: Encontre qualquer tarefa
- **Propriedades**:
  - Título, descrição, prioridade (urgente/alta/média/baixa)
  - Status: A fazer → Em progresso → Concluída
  - Data de vencimento e horário
  - Categoria e projeto
  - Checklist integrado
  - Tags personalizadas
  - Arquivos do Google Drive
  - Link de Google Meet (reuniões)
  - Localização e tempo de deslocamento (eventos presenciais)

### 4. **Calendário** (`/calendar`)
Calendário visual inteligente com:
- 📅 Eventos do Google Calendar (sincronizados)
- ✅ Tarefas com data
- 🔒 Blocos de tempo agendados
- 🎨 Cores por prioridade/tipo
- 🖱️ Drag & drop de tarefas
- 📱 Versão mobile com indicadores

### 5. **Projetos** (`/projects`)
Organize trabalho em projetos:
- Criar/editar/deletar projetos
- Status: Ativo, em pausa, completo, arquivado
- Data de conclusão
- Ícones e cores personalizadas
- Visualizar todas as tarefas do projeto

### 6. **Categorias** (`/categories`)
Organize tarefas por área:
- Trabalho, Pessoal, Saúde, etc.
- Meta diária de horas (opcional)
- Ícones e cores únicas
- Rastreamento de tempo gasto

### 7. **Blocos de Tempo** (`/time-blocks`)
Time blocking inteligente:
- Criar blocos reutilizáveis (templates)
- Agendar blocos em dias específicos
- Recorrência: Diária, semanal, mensal
- Tipos: Trabalho, pausa, foco, reunião, pessoal
- Análise visual de distribuição de tempo
- Timeline interativa do dia

### 8. **Templates** (`/templates`)
Reutilize estruturas de tarefas:
- Salve templates com título, descrição, checklists
- Meta de tempo estimado
- Prioridade padrão
- Categoria e projeto padrão
- Estatísticas de uso

### 9. **Saúde** (`/health`)
Acompanhamento de bem-estar:

#### 📋 Medicamentos
- Adicionar medicamentos com dosagem
- Frequência: Diária, 2x, 3x, conforme necessário
- Horários específicos
- Logs com notas (efeitos colaterais)
- Lembretes automáticos

#### 🏥 Consultas Médicas
- Agende consultas com especialista
- Histórico de consultas
- Dados do médico e clínica
- Sincronize para Google Calendar

#### 🧪 Exames Médicos
- Registre exames solicitados
- Acompanhe datas (solicitado → realizado → resultado)
- Upload de PDFs com resultados
- Notas e observações

#### 🧘 Meditação
- Sessões guiadas (iniciante/intermediário/avançado)
- Categorias: Foco, relaxamento, sono, ansiedade, gratidão
- Áudio integrado
- Histórico de práticas

#### 📚 Recursos TDAH
- Artigos educativos traduzidos
- Categorias: Básico, Prático, Positivo, Desafio, Saúde, Emocional
- Leitura e inspiração diária

### 10. **Relatórios** (`/reports`)
Análises detalhadas:
- 📊 Gráficos de produtividade
- 🏆 Estatísticas semanais/mensais
- ⏱️ Tempo por categoria
- 🎯 Taxa de conclusão
- 📥 Download em áudio ou PDF
- 📧 Receba por email

### 11. **Assistente IA** (`/assistant`)
Chatbot inteligente para:
- Criar tarefas em linguagem natural
- Analizar produtividade
- Sugestões inteligentes
- Resumos automáticos
- Insights personalizados

### 12. **Gmail** (`/gmail` + `/email-manager`)
Integração de email:
- Sincronize emails como tarefas
- Responda com ações automáticas
- Vinculação de emails a tarefas
- Conversão de emails em compromissos

---

## ⚡ Modo Foco

### O que é?
Modo imersivo para concentração profunda com:
- ✨ Interface clara focada apenas na tarefa atual
- 📵 Resposta automática para mensagens
- ⏱️ Timer integrado (Pomodoro ou personalizado)
- 🚫 Contatos de emergência (notificam apenas caso urgente)

### Como Ativar
1. Clique no ícone ⚡ em qualquer tarefa
2. Configure tempo da sessão
3. Inicie o foco
4. Sistema bloqueará distrações

### Configurações de Foco
- Tempo de sessão (padrão 25min)
- Intervalo de pausa
- Contatos de emergência (WhatsApp/SMS)
- Mensagem de resposta automática
- Notificações ao término

---

## 🔗 Integrações

### Google Calendar
- ✅ Sincronize eventos automaticamente
- ✅ Crie eventos diretamente do app
- ✅ Webhook em tempo real para mudanças
- ✅ Blocos de tempo vinculados
- ✅ Consultas e exames no calendário

### Gmail
- ✅ Sincronize inbox como tarefas
- ✅ Converta emails em compromissos
- ✅ Responda com ações automáticas
- ✅ Vinculação bidirecional

### Google Drive
- ✅ Anexe documentos a tarefas
- ✅ Visualize arquivos
- ✅ Acesso leitura rápida

---

## 🤖 Agentes IA

### 1. **Assistente de Onboarding**
Guia interativa conversacional:
- Configure categorias e projetos
- Adicione medicamentos
- Crie blocos de tempo
- Defina preferências

**Acesso**: Dashboard → Conversar com assistente

### 2. **Assistente Principal**
Chatbot com acesso total:
- Crie tarefas em linguagem natural
- Analise produtividade
- Receba sugestões
- Gere relatórios

**Acesso**: `/assistant` ou sidebar

### 3. **Advisor de Agendamento**
Especializado em planejamento:
- Otimize seu cronograma
- Recomende horários
- Evite sobrecarga

---

## 🔔 Notificações Inteligentes

### Tipos
- 💊 Lembretes de medicamento (10/30/60 min antes)
- 📋 Tarefas vencidas
- 📅 Próximas reuniões
- ⚠️ Aviso de sobrecarga
- ✅ Recompensas e badges

### Configuração
Menu → Preferências → Notificações

---

## 📊 Análises e Dados

### Dashboard Analytics
- Taxa de conclusão de tarefas
- Tempo de foco acumulado
- Distribuição por categoria
- Tendências de produtividade
- Dias mais produtivos

### Relatórios Personalizados
- Formato: Visual, dados, áudio
- Frequência: Diária, semanal, mensal
- Envio por email automático
- Download em PDF/áudio

---

## ⌨️ Atalhos e Dicas

### Atalhos de Teclado
- `Cmd/Ctrl + K`: Busca global
- `+`: Criar nova tarefa
- `Esc`: Fechar diálogos

### Dicas de Produtividade
1. **Use Pomodoro**: 25min foco + 5min pausa
2. **Priorize URGENTE**: Comece pelo mais importante
3. **Time blocking**: Reserve blocos para cada atividade
4. **Revise antes de dormir**: Prepare o dia seguinte
5. **Rastreie medicamentos**: Não perca nenhuma dose

---

## 🐛 Resolução de Problemas

### Problema: Google Calendar não sincroniza
**Solução**: 
1. Vá para `/calendar`
2. Clique "Desconectar" 
3. Reconecte sua conta
4. Aguarde 1-2 minutos

### Problema: Lembretes de medicamento não aparecem
**Solução**:
1. Verifique se notificações estão ativadas no navegador
2. Confirme os horários dos medicamentos
3. Reinicie a página

### Problema: Tarefas não aparecem no calendário
**Solução**:
1. Verifique se tem `due_date` configurado
2. Atualize a página
3. Sincronize manualmente

---

## 📝 Guia de Recursos por Tipo de Usuário

### Para Profissionais
- ✅ Use **Projetos** para clientes/iniciativas
- ✅ Sincronize **Google Calendar** para meetings
- ✅ Configure **Blocos de Tempo** para focar
- ✅ Analise **Relatórios** semanais

### Para Estudantes
- ✅ Crie **Templates** para tipos de tarefa
- ✅ Use **Categorias** por disciplina
- ✅ Organize **Projetos** por semestre
- ✅ Rastreie com **Modo Foco**

### Para Pessoas com TDAH
- ✅ Use **Modo Foco** para hiperfoco seguro
- ✅ Leia **Artigos TDAH** para contexto
- ✅ Configure **Lembretes** frequentes
- ✅ Pratique **Meditação** para regulação
- ✅ Fale com **Assistente IA** para motivação

---

## 🚀 Roadmap - Próximas Versões

### v0.2 (Julho 2026)
- [ ] App mobile nativa (iOS/Android)
- [ ] Sincronização offline
- [ ] Dark mode/Light mode toggle
- [ ] Webhooks personalizados

### v0.3 (Agosto 2026)
- [ ] Compartilhamento de tarefas
- [ ] Trabalho colaborativo
- [ ] Integração com Slack/Discord
- [ ] Análise de padrões com ML

### v1.0 (Q4 2026)
- [ ] Gamificação e badges
- [ ] Comunidade e desafios
- [ ] Coaching com IA
- [ ] Integração com smartwatches

---

## 📧 Suporte

### Canais
- 📧 Email: support@focusflow.app
- 💬 Chat: Disponível no app
- 🤖 Assistente IA: Sempre disponível

### Feedback Beta
Encontrou um bug? Tem sugestão?
→ Use o formulário no app ou responda no email

---

## 📄 Termos e Privacidade

- ✅ Dados criptografados em trânsito
- ✅ Sem compartilhamento de dados com terceiros
- ✅ Sincronizações apenas com suas contas Google
- ✅ Política de privacidade: https://focusflow.app/privacy

---

## 🎉 Bem-vindo ao FocusFlow!

**Você está pronto para transformar sua produtividade.** Comece agora, um dia de cada vez.

*Feito com ❤️ para pessoas que querem fazer mais com menos estresse.*

---

**Versão**: 0.1 Beta | **Última atualização**: Junho 2026