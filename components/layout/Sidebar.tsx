import React from 'react';
import { Plus, FolderPlus, Search, CalendarDays } from 'lucide-react';

interface SidebarProps {
  onAddFile: () => void;
  onAddFolder: () => void;
  onDailyNote: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onAddFile, 
  onAddFolder, 
  onDailyNote,
  searchQuery, 
  onSearchChange, 
  children 
}) => {
  return (
    <aside className="w-64 flex flex-col border-r border-[#2c2c2c] bg-[#202020]">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-[10px] tracking-widest uppercase text-gray-500">Проводник</h1>
          <div className="flex gap-1">
            <button 
              onClick={onDailyNote} 
              className="p-1 hover:bg-[#363636] rounded text-gray-400 hover:text-white transition-colors" 
              title="Ежедневная заметка"
            >
              <CalendarDays size={16} />
            </button>
            <button 
              onClick={onAddFile} 
              className="p-1 hover:bg-[#363636] rounded text-gray-400 hover:text-white transition-colors" 
              title="Новый файл"
            >
              <Plus size={16} />
            </button>
            <button 
              onClick={onAddFolder} 
              className="p-1 hover:bg-[#363636] rounded text-gray-400 hover:text-white transition-colors" 
              title="Новая папка"
            >
              <FolderPlus size={16} />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
          <input 
            type="text" 
            placeholder="Поиск по названию и тексту..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded px-8 py-1.5 text-xs focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto pb-4">
        {children}
      </nav>
    </aside>
  );
};