import React from 'react';
import { Palette, Globe } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ThemeLanguageSelector() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const themeLabels = {
    dark: t('darkMode'),
    purple: t('purple'),
    cyan: t('cyan'),
    forest: t('forest'),
  };

  return (
    <div className="space-y-3 py-3">
      <div className="px-3">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2 mb-2">
          <Palette className="w-3 h-3" />
          {t('theme')}
        </label>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(themeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="px-3">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2 mb-2">
          <Globe className="w-3 h-3" />
          {t('language')}
        </label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt">Português</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}