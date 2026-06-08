import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, ExternalLink, X, FileText, Loader2, Plus, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

// Map common MIME types to emoji icons
function fileEmoji(mimeType = '') {
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📄';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('folder')) return '📁';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('video')) return '🎬';
  if (mimeType.includes('audio')) return '🎵';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
  return '📄';
}

function formatModified(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DriveFilesSection({ links = [], onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualName, setManualName] = useState('');
  const [showManual, setShowManual] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await base44.functions.invoke('searchDriveFiles', { query: search });
      setResults(res.data.files || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const isLinked = (fileId) => links.some(l => l.id === fileId);

  const addFile = (file) => {
    if (isLinked(file.id)) return;
    onChange([...links, { id: file.id, name: file.name, url: file.webViewLink, mimeType: file.mimeType }]);
  };

  const removeFile = (fileId) => {
    onChange(links.filter(l => l.id !== fileId));
  };

  const addManual = () => {
    const url = manualUrl.trim();
    const name = manualName.trim() || url;
    if (!url) return;
    const id = `manual_${Date.now()}`;
    onChange([...links, { id, name, url, mimeType: '' }]);
    setManualUrl('');
    setManualName('');
    setShowManual(false);
  };

  return (
    <div className="space-y-3">

      {/* Linked files */}
      {links.length > 0 && (
        <div className="space-y-1.5">
          {links.map(link => (
            <div
              key={link.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg group"
              style={{ background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.2)' }}
            >
              <span className="text-base flex-shrink-0">{fileEmoji(link.mimeType)}</span>
              <span className="flex-1 text-sm text-foreground truncate">{link.name}</span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                title="Abrir no Drive"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
              <button
                type="button"
                onClick={() => removeFile(link.id)}
                className="p-1 rounded hover:bg-red-500/20 transition-colors flex-shrink-0"
                title="Remover"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Drive */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar no Drive..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !search.trim()}
          className="px-3 h-8 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
          style={{ background: 'rgba(66,133,244,0.15)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.3)' }}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
        </button>
      </div>

      {/* Search results */}
      {searched && (
        <div className="space-y-1 max-h-44 overflow-y-auto rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {results.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhum arquivo encontrado.</p>
          )}
          {results.map(file => {
            const linked = isLinked(file.id);
            return (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                  linked ? "opacity-50" : "hover:bg-white/05 cursor-pointer"
                )}
                onClick={() => !linked && addFile(file)}
              >
                <span className="text-base flex-shrink-0">{fileEmoji(file.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-foreground text-xs font-medium">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatModified(file.modifiedTime)}</p>
                </div>
                {linked ? (
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">Vinculado</span>
                ) : (
                  <Plus className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual link toggle */}
      <button
        type="button"
        onClick={() => setShowManual(v => !v)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showManual ? '▲ Fechar' : '🔗 Colar link manualmente'}
      </button>

      {showManual && (
        <div className="space-y-2 pt-1">
          <Input
            value={manualName}
            onChange={e => setManualName(e.target.value)}
            placeholder="Nome do documento (opcional)"
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Input
              value={manualUrl}
              onChange={e => setManualUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManual()}
              placeholder="https://docs.google.com/..."
              className="h-8 text-sm flex-1"
            />
            <button
              type="button"
              onClick={addManual}
              disabled={!manualUrl.trim()}
              className="px-3 h-8 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
              style={{ background: 'rgba(66,133,244,0.15)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.3)' }}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}