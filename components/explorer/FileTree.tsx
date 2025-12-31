import React from 'react';
import { VaultEntity } from '../../types';
import { FileItem } from './FileItem';

interface FileTreeProps {
  entities: VaultEntity[];
  filteredEntities: VaultEntity[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, newParentId: string | null) => void;
  onRename: (id: string, name: string) => void; // Добавлен пропс
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  entities,
  filteredEntities,
  activeId,
  onSelect,
  onDelete,
  onMove,
  onRename, // Деструктуризация
  expandedFolders,
  toggleFolder,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-white/[0.02]');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-white/[0.02]');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-white/[0.02]');
    const draggedId = e.dataTransfer.getData('application/obsidian-entity-id');
    if (draggedId) {
      onMove(draggedId, null);
    }
  };

  if (filteredEntities.length === 0) {
    return (
      <div 
        className="px-6 py-8 text-xs text-gray-700 italic border-2 border-dashed border-white/5 m-4 rounded-2xl flex flex-col items-center gap-2"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span>Пусто</span>
        <span className="text-[10px] opacity-50">Перетащите сюда файл</span>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col gap-px min-h-[100px] transition-colors duration-300"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {filteredEntities.map(e => (
        <FileItem 
          key={e.id}
          entity={e}
          level={0}
          activeId={activeId}
          onSelect={onSelect}
          onDelete={onDelete}
          onMove={onMove}
          onRename={onRename} // Теперь пропс передается в FileItem
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
          entities={entities}
        />
      ))}
    </div>
  );
};