import React, { useMemo, useState } from 'react';
import { FileText, ChevronRight, ChevronDown, Trash2, Folder, Edit2, Check, X } from 'lucide-react';
import { VaultEntity } from '../../types';

interface FileItemProps {
  entity: VaultEntity;
  level: number;
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, newParentId: string | null) => void;
  onRename: (id: string, name: string) => void;
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
  entities: VaultEntity[];
}

export const FileItem: React.FC<FileItemProps> = ({ 
  entity, 
  level, 
  activeId, 
  onSelect, 
  onDelete, 
  onMove,
  onRename,
  expandedFolders, 
  toggleFolder, 
  entities 
}) => {
  const isFolder = entity.type === 'folder';
  const isExpanded = expandedFolders.has(entity.id);
  const isActive = activeId === entity.id;
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(entity.name);
  
  const children = useMemo(() => 
    entities.filter(e => e.parentId === entity.id).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    }),
    [entities, entity.id]
  );

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/obsidian-entity-id', entity.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Создаем кастомный drag image
    const dragImg = document.createElement('div');
    dragImg.textContent = entity.name;
    dragImg.className = "fixed top-[-100px] bg-purple-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xl z-[-1]";
    document.body.appendChild(dragImg);
    e.dataTransfer.setDragImage(dragImg, 0, 0);
    setTimeout(() => document.body.removeChild(dragImg), 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isFolder) {
      e.preventDefault();
      e.stopPropagation(); // Важно: предотвращаем всплытие к родителю
      e.currentTarget.classList.add('bg-purple-600/10');
      e.currentTarget.classList.add('scale-[1.02]');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (isFolder) {
      e.stopPropagation();
      e.currentTarget.classList.remove('bg-purple-600/10');
      e.currentTarget.classList.remove('scale-[1.02]');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isFolder) {
      e.preventDefault();
      e.stopPropagation(); // Важно: предотвращаем перемещение в корень при попадании в папку
      e.currentTarget.classList.remove('bg-purple-600/10');
      e.currentTarget.classList.remove('scale-[1.02]');
      
      const draggedId = e.dataTransfer.getData('application/obsidian-entity-id');
      if (draggedId && draggedId !== entity.id) {
        onMove(draggedId, entity.id);
      }
    }
  };

  const handleRenameSubmit = () => {
    const trimmedName = newName.trim();
    if (trimmedName && trimmedName !== entity.name) {
      onRename(entity.id, trimmedName);
    }
    setIsRenaming(false);
  };

  return (
    <div className="select-none">
      <div 
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all text-sm group relative ${
          isActive 
            ? 'bg-purple-600/20 text-purple-300 border-r-2 border-purple-600 shadow-inner' 
            : 'hover:bg-[#2c2c2c] text-gray-400 hover:text-gray-200'
        }`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={() => {
            if (isRenaming) return;
            isFolder ? toggleFolder(entity.id) : onSelect(entity.id);
        }}
      >
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {isFolder ? (
            isExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />
          ) : (
            <FileText size={14} className={isActive ? 'text-purple-400' : 'text-gray-600'} />
          )}
        </div>
        
        {isFolder && !isExpanded && <Folder size={14} className="text-gray-600 mr-[-4px] shrink-0" />}

        {isRenaming ? (
          <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <input 
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') { setIsRenaming(false); setNewName(entity.name); }
              }}
              onBlur={handleRenameSubmit}
              className="flex-1 bg-black/60 border border-purple-500/50 rounded px-2 py-0.5 text-xs outline-none text-white focus:ring-1 focus:ring-purple-500/30"
            />
            <button 
              onMouseDown={(e) => { e.preventDefault(); handleRenameSubmit(); }} 
              className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
            >
              <Check size={12}/>
            </button>
            <button 
              onMouseDown={(e) => { e.preventDefault(); setIsRenaming(false); setNewName(entity.name); }} 
              className="p-1 text-red-500 hover:bg-red-500/10 rounded"
            >
              <X size={12}/>
            </button>
          </div>
        ) : (
          <span className="flex-1 truncate py-0.5">{entity.name}</span>
        )}
        
        {!isRenaming && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}
              className="p-1.5 hover:text-purple-400 hover:bg-white/5 rounded-md transition-all"
              title="Переименовать"
            >
              <Edit2 size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(entity.id); }}
              className="p-1.5 hover:text-red-400 hover:bg-white/5 rounded-md transition-all"
              title="Удалить"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
      
      {isFolder && isExpanded && (
        <div className="mt-px">
          {children.length > 0 ? (
            children.map(child => (
              <FileItem 
                key={child.id}
                entity={child}
                level={level + 1}
                activeId={activeId}
                onSelect={onSelect}
                onDelete={onDelete}
                onMove={onMove}
                onRename={onRename}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                entities={entities}
              />
            ))
          ) : (
            <div 
              className="text-[10px] text-gray-700 italic py-2"
              style={{ paddingLeft: `${(level + 1) * 12 + 28}px` }}
            >
              Пустая папка
            </div>
          )}
        </div>
      )}
    </div>
  );
};