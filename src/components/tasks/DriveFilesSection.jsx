import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, ExternalLink, X, Loader2, Plus, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function fileEmoji(mimeType = '') {
  if (mimeType.includes('folder')) return '📁';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📑';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📄';
  if (mimeType.includes('pdf')) return '📕';
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualName, setManualName] = useState('');
  const [showManual, setShowManual] = useState(false);

  // Load recent files when picker opens
  useEffect(() => {
    if (pickerOpen) fetchFiles('');
  }, [pickerOpen]);

  const fetchFiles = useCallback(async (query) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('searchDriveFiles', { query });
      setResults(res.data.files || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    fetchFiles(search.trim());
  }, [search, fetchFiles]);

  const isLinked = (fileId) => links.some(l => l.id === fileId);

  const addFile = (file) => {
    if (isLinked(file.id)) return;
    onChange([...links, { id: file.id, name: file.name, url: file.webViewLink, mimeType: file.mimeType }]);
  };

  const removeFile = (fileId) => onChange(links.filter(l => l.id !== fileId));

  const addManual = () => {
    const url = manualUrl.trim();
    if (!url) return;
    const name = manualName.trim() || url;
    onChange([...links, { id: `manual_${Date.now()}`, name, url, mimeType: '' }]);
    setManualUrl('');
    setManualName('');
    setShowManual(false);
  };

  return (
    <div className="space-y-3">

      {/* Linked files list */}
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

      {/* Toggle picker button */}
      <button
        type="button"
        onClick={() => setPickerOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors"
        style={{ background: 'rgba(66,133,244,0.1)', border: '1px dashed rgba(66,133,244,0.35)', color: '#4285F4' }}
      >
        <span className="flex items-center gap-2">
          <span>🗂️</span>
          <span className="font-medium">Selecionar arquivo ou pasta do Drive</span>
        </span>
        {pickerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Picker panel */}
      {pickerOpen && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(66,133,244,0.25)' }}>
          {/* Search bar */}
          <div className="flex gap-2 p-2" style={{ background: 'rgba(66,133,244,0.06)' }}>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar arquivos e pastas..."
                className="pl-8 h-8 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="px-3 h-8 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex-shrink-0"
              style={{ background: 'rgba(66,133,244,0.2)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.3)' }}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
            </button>
          </div>

          {/* Results */}
          <div className="max-h-52 overflow-y-auto">
            {loading && results.length === 0 && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && results.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum arquivo encontrado.</p>
            )}
            {results.map(file => {
              const linked = isLinked(file.id);
              return (
                <div
                  key={file.id}
                  onClick={() => !linked && addFile(file)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 text-sm border-b border-white/5 last:border-0 transition-colors",
                    linked
                      ? "opacity-40 cursor-default"
                      : "cursor-pointer hover:bg-white/5"
                  )}
                >
                  <span className="text-base flex-shrink-0">{fileEmoji(file.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatModified(file.modifiedTime)}</p>
                  </div>
                  {linked ? (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 bg-primary/10 px-2 py-0.5 rounded-full">Vinculado</span>
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Manual link at bottom */}
          <div style={{ background: 'rgba(66,133,244,0.04)', borderTop: '1px solid rgba(66,133,244,0.15)' }}>
            <button
              type="button"
              onClick={() => setShowManual(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Link2 className="w-3 h-3" />
              {showManual ? 'Fechar link manual' : 'Colar link manualmente'}
            </button>
            {showManual && (
              <div className="px-3 pb-3 space-y-2">
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
                    placeholder="https://drive.google.com/..."
                    className="h-8 text-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={addManual}
                    disabled={!manualUrl.trim()}
                    className="px-3 h-8 rounded-md text-xs font-medium disabled:opacity-50 flex-shrink-0"
                    style={{ background: 'rgba(66,133,244,0.2)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.3)' }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}