import React from 'react';
import { Palette, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import ResetDataButton from '@/components/dev/ResetDataButton';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const themeLabels = {
    dark: t('darkMode'),
    purple: t('purple'),
    cyan: t('cyan'),
    forest: t('forest'),
  };

  const themePreview = {
    dark: 'bg-slate-900',
    purple: 'bg-purple-900',
    cyan: 'bg-cyan-900',
    forest: 'bg-emerald-900',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Personalize sua experiência no FocusFlow
        </p>
      </div>

      {/* Tema */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>{t('theme')}</CardTitle>
              <CardDescription>Escolha o visual que mais gosta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(themeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`p-4 rounded-lg border-2 transition-all text-left group ${
                  theme === key
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${themePreview[key]} shadow-lg`} />
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {key === 'dark' && 'Escuro profundo'}
                      {key === 'purple' && 'Tons roxos'}
                      {key === 'cyan' && 'Tons ciano'}
                      {key === 'forest' && 'Tons verdes'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Idioma */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-accent" />
            <div>
              <CardTitle>{t('language')}</CardTitle>
              <CardDescription>Selecione seu idioma preferido</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-w-xs">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">🇧🇷 Português (Brasil)</SelectItem>
              <SelectItem value="en">🇺🇸 English (US)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-3">
            A interface será atualizada imediatamente após a mudança.
          </p>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-muted/50 border-muted-foreground/20">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              ✨ <strong>Toque especial:</strong> Suas preferências são salvas automaticamente no navegador.
            </p>
            <p className="text-muted-foreground">
              🚀 <strong>Sem espera:</strong> As mudanças são aplicadas instantaneamente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reset Data - Dev */}
      <Card className="bg-destructive/5 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetDataButton />
        </CardContent>
      </Card>
    </div>
  );
}