import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, X, ChevronRight } from 'lucide-react';
import { VaultEntity } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  entities: VaultEntity[];
  onSelect: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, entities, onSelect }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    if (!query) return entities.filter(e => e.type === 'file').slice(0, 8);
    const q = query.toLowerCase();
    
    return entities
      .filter(e => e.type === 'file' && (
        e.name.toLowerCase().includes(q) || 
        (e.content && e.content.toLowerCase().includes(q))
      ))
      .map(e => {
        let snippet = '';
        if (e.content && e.content.toLowerCase().includes(q)) {
          const idx = e.content.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 20);
          const end = Math.min(e.content.length, idx + q.length + 40);
          snippet = (start > 0 ? '...' : '') + e.content.substring(start, end).replace(/\n/g, ' ') + (end < e.content.length ? '...' : '');
        }
        return { ...e, snippet };
      })
      .slice(0, 8);
  }, [entities, query]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIndex(0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      if (e.key === 'ArrowUp') setSelectedIndex(prev => Math.max(prev - 1, 0));
      if (e.key === 'Enter' && results[selectedIndex]) {
        onSelect(results[selectedIndex].id);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, onSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#252525] rounded-2xl border border-[#3f3f3f] shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#3f3f3f]">
          <Search size={18} className="text-gray-500" />
          <input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск заметок и содержимого..."
            className="flex-1 bg-transparent border-none outline-none text-gray-200 text-sm"
          />
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400">
            <X size={16} />
          </button>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto p-2 bg-[#1a1a1a]/50">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-600">Ничего не найдено</div>
          ) : (
            results.map((file, idx) => (
              <div 
                key={file.id}
                onClick={() => { onSelect(file.id); onClose(); }}
                className={`flex flex-col gap-1 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                  idx === selectedIndex ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-[#2f2f2f] text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} className={idx === selectedIndex ? 'text-white' : 'text-gray-600'} />
                  <span className="flex-1 text-sm font-medium truncate">{file.name}</span>
                  {idx === selectedIndex && <ChevronRight size={14} />}
                </div>
                {(file as any).snippet && (
                  <div className={`text-[11px] truncate ${idx === selectedIndex ? 'text-purple-200' : 'text-gray-600'}`}>
                    {(file as any).snippet}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="px-4 py-2 border-t border-[#3f3f3f] bg-[#1a1a1a] flex items-center justify-between text-[10px] text-gray-500 font-medium">
          <div className="flex gap-4">
            <span className="flex items-center gap-1 uppercase tracking-tighter"><span className="bg-[#333] px-1 rounded text-gray-400">Ctrl+P</span> Везде</span>
          </div>
          <span className="opacity-50 tracking-widest uppercase">Глобальный поиск</span>
        </div>
      </div>
    </div>
  );
};