import React from 'react';
import { Link as LinkIcon, ChevronRight } from 'lucide-react';
import { VaultEntity } from '../../types';

interface BacklinksPanelProps {
  backlinks: VaultEntity[];
  onSelect: (id: string) => void;
}

export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({ backlinks, onSelect }) => {
  return (
    <div className="w-64 border-l border-[#2c2c2c] bg-[#1a1a1a] overflow-y-auto">
      <div className="p-4 flex items-center gap-2 border-b border-[#2c2c2c]">
        <LinkIcon size={14} className="text-gray-500" />
        <h3 className="text-[10px] uppercase tracking-widest font-semibold text-gray-500">Backlinks</h3>
      </div>
      <div className="py-2">
        {backlinks.length === 0 ? (
          <div className="px-4 py-3 text-xs text-gray-600 italic">No backlinks found</div>
        ) : (
          backlinks.map(note => (
            <button
              key={note.id}
              onClick={() => onSelect(note.id)}
              className="w-full text-left px-4 py-2 hover:bg-[#2c2c2c] transition-colors group flex items-center justify-between"
            >
              <span className="text-sm text-gray-400 group-hover:text-gray-200 truncate">{note.name}</span>
              <ChevronRight size={12} className="text-gray-700 group-hover:text-purple-500 transition-colors" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};