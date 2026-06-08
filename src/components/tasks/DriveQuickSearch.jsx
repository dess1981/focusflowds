import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { HardDrive, Search, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const FILE_ICONS = {
  'application/pdf': '📄',
  'application/vnd.google-apps.document': '📝',
  'application/vnd.google-apps.spreadsheet': '📊',
  'application/vnd.google-apps.presentation': '🎨',
  'application/vnd.google-apps.folder': '📁',
  'image/': '🖼️',
  'video/': '🎬',
  'audio/': '🔊',
};

function getFileIcon(mimeType) {
  for (const [key, icon] of Object.entries(FILE_ICONS)) {
    if (mimeType?.startsWith(key)) return icon;
  }
  return '📎';
}

export default function DriveQuickSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('searchDriveFiles', { query });
      setSearchResults(response.data.files || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative">
        <HardDrive className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.35)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar arquivos no Google Drive..."
          className="w-full h-10 pl-9 pr-9 rounded-xl text-sm outline-none text-white placeholder:text-white/30 transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: (open || searchQuery) ? '1px solid rgba(100,200,255,0.45)' : '1px solid rgba(255,255,255,0.1)',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setSearchResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
          >
            <Search className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && (searchQuery.trim() || searchResults.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {loading && (
            <div className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando...
            </div>
          )}

          {!loading && searchResults.length === 0 && searchQuery.trim() && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Nenhum arquivo encontrado
            </div>
          )}

          {!loading && searchResults.length > 0 && (
            <div className="max-h-72 overflow-y-auto">
              {searchResults.map(file => (
                <a
                  key={file.id}
                  href={file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg flex-shrink-0">{getFileIcon(file.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white group-hover:text-primary transition-colors">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.mimeType?.split('/')[1] || 'arquivo'}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}