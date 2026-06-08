import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HardDrive, Search, Plus, X, FileText, Loader2 } from 'lucide-react';
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

export default function DriveFileSelector({ onSelect, selectedFiles = [] }) {
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

  const handleSelectFile = (file) => {
    const newFile = {
      id: file.id,
      name: file.name,
      url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      mimeType: file.mimeType,
    };

    const alreadySelected = selectedFiles.some(f => f.id === file.id);
    if (!alreadySelected) {
      onSelect([...selectedFiles, newFile]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveFile = (fileId) => {
    onSelect(selectedFiles.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-3">
      {/* Selected files display */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
            >
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 min-w-0 text-sm text-primary hover:underline"
              >
                <span className="text-lg flex-shrink-0">{getFileIcon(file.mimeType)}</span>
                <span className="truncate">{file.name}</span>
              </a>
              <button
                type="button"
                onClick={() => handleRemoveFile(file.id)}
                className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                title="Remover arquivo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search and add button */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="Buscar no Google Drive..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            onFocus={() => setOpen(true)}
            className="pl-8"
          />
          <HardDrive className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Search results dropdown */}
      {open && (searchQuery.trim() || searchResults.length > 0) && (
        <div className="absolute z-50 w-full max-w-md bg-card border border-border rounded-lg shadow-xl overflow-hidden">
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
            <div className="max-h-64 overflow-y-auto">
              {searchResults.map(file => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => handleSelectFile(file)}
                  disabled={selectedFiles.some(f => f.id === file.id)}
                  className={cn(
                    "w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
                    selectedFiles.some(f => f.id === file.id) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="text-lg">{getFileIcon(file.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.mimeType?.split('/')[1] || 'arquivo'}
                    </p>
                  </div>
                  {selectedFiles.some(f => f.id === file.id) && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded flex-shrink-0">
                      Adicionado
                    </span>
                  )}
                </button>
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