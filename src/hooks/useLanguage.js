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