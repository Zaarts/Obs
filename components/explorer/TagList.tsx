import React from 'react';
import { Tag as TagIcon, Hash, Eraser } from 'lucide-react';

interface TagListProps {
  tagsMap: Record<string, string[]>;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  onGarden: () => void;
}

export const TagList: React.FC<TagListProps> = ({ tagsMap, selectedTag, onTagSelect, onGarden }) => {
  const tags = Object.keys(tagsMap).sort();

  return (
    <div className="mt-6 border-t border-[#2c2c2c] pt-4 px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TagIcon size={12} className="text-gray-600" />
          <h3 className="text-[10px] uppercase tracking-widest font-semibold text-gray-600">Теги</h3>
        </div>
        {tags.length > 0 && (
          <button 
            onClick={onGarden}
            className="text-gray-600 hover:text-green-500 transition-colors"
            title="Прибраться в тегах (Садовник)"
          >
            <Eraser size={12} />
          </button>
        )}
      </div>
      
      {tags.length === 0 ? (
        <p className="text-[10px] text-gray-700 italic">Тегов пока нет</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onTagSelect(null)}
            className={`text-[10px] px-2 py-0.5 rounded transition-all ${
              selectedTag === null ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' : 'bg-[#252525] text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            Все
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagSelect(tag === selectedTag ? null : tag)}
              className={`flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded transition-all border ${
                tag === selectedTag 
                  ? 'bg-purple-600/20 text-purple-400 border-purple-600/30 shadow-lg shadow-purple-900/10' 
                  : 'bg-[#252525] text-gray-500 hover:text-gray-300 border-transparent hover:border-gray-700'
              }`}
            >
              <Hash size={8} />
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};