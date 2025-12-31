import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Star, Link as LinkIcon, BookOpen, Edit3, Share2, Sparkles, Loader2, Save } from 'lucide-react';
import { VaultEntity } from '../../types';

interface EditorHeaderProps {
  activeEntity: VaultEntity;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onUpdateName: (name: string) => void;
  onToggleStar: () => void;
  onToggleBacklinks: () => void;
  showBacklinks: boolean;
  isPreview: boolean;
  onTogglePreview: () => void;
  viewMode: 'editor' | 'graph';
  onSetViewMode: (mode: 'editor' | 'graph') => void;
  onToggleSocrates: () => void;
  isSocratesOpen: boolean;
  onSmartSave: () => void;
  isProcessing: boolean;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  activeEntity,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onUpdateName,
  onToggleStar,
  onToggleBacklinks,
  showBacklinks,
  isPreview,
  onTogglePreview,
  viewMode,
  onSetViewMode,
  onToggleSocrates,
  isSocratesOpen,
  onSmartSave,
  isProcessing
}) => {
  return (
    <header className="h-14 border-b border-[#2c2c2c] flex items-center gap-4 px-4 bg-[#1a1a1a]/80 backdrop-blur-md z-10 shrink-0">
      <div className="flex items-center bg-[#2c2c2c]/50 p-1 rounded-md border border-white/5 shrink-0">
        <button onClick={onGoBack} disabled={!canGoBack} className={`p-1 rounded ${canGoBack ? 'text-gray-300 hover:bg-[#363636]' : 'text-gray-700'}`} title="Назад"><ChevronLeft size={16} /></button>
        <button onClick={onGoForward} disabled={!canGoForward} className={`p-1 rounded ${canGoForward ? 'text-gray-300 hover:bg-[#363636]' : 'text-gray-700'}`} title="Вперед"><ChevronRight size={16} /></button>
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <input 
            value={activeEntity.name} 
            onChange={(e) => onUpdateName(e.target.value)} 
            className="bg-transparent font-semibold focus:outline-none text-gray-100 text-base w-full truncate" 
            placeholder="Без названия"
          />
          <button onClick={onToggleStar} className={`shrink-0 ${activeEntity.isStarred ? 'text-yellow-500' : 'text-gray-600 hover:text-gray-400'}`} title="В избранное">
            <Star size={16} fill={activeEntity.isStarred ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest leading-none">
          <Clock size={10} /> <span>{new Date(activeEntity.updatedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={onSmartSave}
          disabled={isProcessing}
          className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white flex items-center gap-2 text-xs font-bold transition-all shadow-lg shadow-purple-900/20"
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isProcessing ? "ИИ анализирует..." : "Smart Save"}
        </button>

        <button 
          onClick={onToggleSocrates}
          className={`h-9 px-4 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${
            isSocratesOpen ? 'bg-purple-900/40 text-purple-200 border border-purple-500/50' : 'text-purple-400 bg-purple-400/10 hover:bg-purple-400/20'
          }`}
        >
          <Sparkles size={16} /> Сократ
        </button>

        <div className="w-px h-6 bg-[#2c2c2c] mx-1" />

        <button onClick={onToggleBacklinks} className={`p-1.5 rounded-md ${showBacklinks ? 'text-purple-400 bg-purple-400/10' : 'text-gray-500 hover:text-gray-300'}`} title="Обратные ссылки"><LinkIcon size={18} /></button>
        
        <div className="flex bg-[#2c2c2c]/50 p-0.5 rounded-lg border border-white/5">
          <button onClick={() => isPreview && onTogglePreview()} className={`p-1 rounded-md ${!isPreview ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`} title="Правка"><Edit3 size={14} /></button>
          <button onClick={() => !isPreview && onTogglePreview()} className={`p-1 rounded-md ${isPreview ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`} title="Просмотр"><BookOpen size={14} /></button>
        </div>

        <button 
          onClick={() => onSetViewMode(viewMode === 'graph' ? 'editor' : 'graph')} 
          className={`p-1.5 rounded-md ml-1 transition-all ${viewMode === 'graph' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:bg-[#2c2c2c]'}`}
          title={viewMode === 'graph' ? 'Вернуться к редактору' : 'Показать граф знаний'}
        >
          <Share2 size={18} />
        </button>
      </div>
    </header>
  );
};