import { useEffect, useState } from 'react';

const TRANSLATIONS = {
  pt: {
    tasks: 'Tarefas',
    dashboard: 'Dashboard',
    calendar: 'Calendário',
    projects: 'Projetos',
    categories: 'Categorias',
    health: 'Saúde',
    theme: 'Tema',
    language: 'Idioma',
    darkMode: 'Escuro',
    purple: 'Roxo',
    cyan: 'Ciano',
    forest: 'Floresta',
    settings: 'Configurações',
    today: 'Hoje',
    planning: 'Planejamento',
    communication: 'Comunicação',
    analytics: 'Análise',
    configuration: 'Configuração',
    newTask: 'Nova Tarefa',
    dailyPlanner: 'Planner Diário',
    todayList: 'Lista de Hoje',
    timeBlocks: 'Blocos de Tempo',
    gmailManager: 'Gerenciador de Gmail',
    healthWellness: 'Saúde & Bem-estar',
    monthlyAnalysis: 'Análise Mensal',
    reports: 'Relatórios',
    aiAssistant: 'Assistente IA',
    templates: 'Templates',
  },
  en: {
    tasks: 'Tasks',
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    projects: 'Projects',
    categories: 'Categories',
    health: 'Health',
    theme: 'Theme',
    language: 'Language',
    darkMode: 'Dark',
    purple: 'Purple',
    cyan: 'Cyan',
    forest: 'Forest',
    settings: 'Settings',
    today: 'Today',
    planning: 'Planning',
    communication: 'Communication',
    analytics: 'Analytics',
    configuration: 'Settings',
    newTask: 'New Task',
    dailyPlanner: 'Daily Planner',
    todayList: 'Today\'s List',
    timeBlocks: 'Time Blocks',
    gmailManager: 'Gmail Manager',
    healthWellness: 'Health & Wellness',
    monthlyAnalysis: 'Monthly Analysis',
    reports: 'Reports',
    aiAssistant: 'AI Assistant',
    templates: 'Templates',
  },
};

export function useLanguage() {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('app-language');
    return saved || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => TRANSLATIONS[language]?.[key] || key;

  return { language, setLanguage, t, TRANSLATIONS };
}