import React, { useState, useMemo, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { Hash, Calendar, Link as LinkIcon, Compass } from 'lucide-react';
import { VaultEntity } from '../../types';
import { MarkdownLinkService } from '../../services/markdownLinkService';
import { BacklinksPanel } from './BacklinksPanel';
import { EditorHeader } from './EditorHeader';
import { TagService } from '../../services/tagService';

interface EditorProps {
  activeEntity: VaultEntity;
  entities: VaultEntity[];
  onUpdateName: (name: string) => void;
  onUpdateContent: (content: string) => void;
  onNavigateByName: (name: string) => void;
  onNavigateById: (id: string) => void;
  showBacklinks: boolean;
  onToggleBacklinks: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onToggleStar: (id: string) => void;
  viewMode: 'editor' | 'graph';
  onSetViewMode: (mode: 'editor' | 'graph') => void;
  onToggleSocrates: () => void;
  isSocratesOpen: boolean;
  onSmartSave: (id: string) => Promise<void>;
}

export const Editor: React.FC<EditorProps> = ({ 
  activeEntity, 
  entities, 
  onUpdateName, 
  onUpdateContent, 
  onNavigateByName,
  onNavigateById,
  showBacklinks,
  onToggleBacklinks,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onToggleStar,
  viewMode,
  onSetViewMode,
  onToggleSocrates,
  isSocratesOpen,
  onSmartSave
}) => {
  const [isPreview, setIsPreview] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const tags = useMemo(() => TagService.extractTags(activeEntity.content || ''), [activeEntity.content]);

  const renderedHtml = useMemo(() => {
    let content = activeEntity.content || '';
    
    // Глубокая очистка HTML-артефактов (фикс сломанного текста)
    const cleanContent = (str: string) => {
      return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—')
        // Очистка специфических для Gemini артефактов экранирования
        .replace(/& #39 ;/g, "'")
        .replace(/& 39 ;/g, "'")
        .replace(/& 39;/g, "'")
        .replace(/&#39 ;/g, "'");
    };

    content = cleanContent(content);

    // UX FIX: Автоматическое заполнение структуры, если ее нет
    if (content.trim() && !content.includes('## ')) {
      content = `## Мои мысли:\n${content}`;
    }

    const separator = `<div class="section-separator"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 3L21 12L12 21L3 12L12 3Z"/></svg></div>`;

    // Рендеринг специфических блоков
    
    // Блок Мыслей (Курсив, Serif)
    content = content.replace(/## Мои мысли:([\s\S]*?)(?=##|$)/g, (match, body) => {
      const bodyTrimmed = body.trim();
      if (!bodyTrimmed) return '';
      const parsedBody = marked.parse(bodyTrimmed);
      return `<div class="thoughts-block">${parsedBody}</div>${separator}`;
    });

    // Блок Анализа ИИ (Фиолетовая карточка)
    content = content.replace(/## Анализ ИИ:([\s\S]*?)(?=##|$)/g, (match, body) => {
      const parsedBody = marked.parse(body.trim());
      return `<div class="ai-callout">
        <div class="ai-badge">Архитектор Влияния</div>
        <div class="prose-content">${parsedBody}</div>
      </div>`;
    });

    // Блок Стратегии (Зеленая полоса)
    content = content.replace(/## План на день:([\s\S]*?)(?=##|$)/g, (match, body) => {
      const parsedBody = marked.parse(body.trim());
      return `<div class="plan-callout">
        <div class="flex items-center gap-3 mb-6 text-emerald-500/40 font-black uppercase tracking-[0.4em] text-[10px]">
          <span class="p-1.5 bg-emerald-500/5 rounded-lg"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20"/><path d="m17 7-5-5-5 5"/><path d="m17 17-5 5-5-5"/></svg></span>
          Стратегия
        </div>
        <div class="prose-content">${parsedBody}</div>
      </div>`;
    });

    let html = marked.parse(content) as string;
    html = MarkdownLinkService.renderWikiLinks(html);
    // Дополнительная очистка итогового HTML
    html = cleanContent(html);
    html = html.replace(/#([\wа-яА-Я-]+)/g, '<span class="tag-pill">$1</span>');
    
    return html;
  }, [activeEntity.content]);

  useEffect(() => {
    if (!isPreview || !previewRef.current) return;
    const handleWikiClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.wiki-link')) {
        e.preventDefault();
        const link = target.closest('.wiki-link') as HTMLElement;
        const noteName = link.getAttribute('data-note');
        if (noteName) onNavigateByName(noteName);
      }
    };
    const container = previewRef.current;
    container.addEventListener('click', handleWikiClick);
    return () => container.removeEventListener('click', handleWikiClick);
  }, [isPreview, onNavigateByName]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0f0f0f]">
      <EditorHeader 
        activeEntity={activeEntity}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={onGoBack}
        onGoForward={onGoForward}
        onUpdateName={onUpdateName}
        onToggleStar={() => onToggleStar(activeEntity.id)}
        onToggleBacklinks={onToggleBacklinks}
        showBacklinks={showBacklinks}
        isPreview={isPreview}
        onTogglePreview={() => setIsPreview(!isPreview)}
        viewMode={viewMode}
        onSetViewMode={onSetViewMode}
        onToggleSocrates={onToggleSocrates}
        isSocratesOpen={isSocratesOpen}
        onSmartSave={() => {
            setIsProcessing(true);
            onSmartSave(activeEntity.id).finally(() => setIsProcessing(false));
        }}
        isProcessing={isProcessing}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1000px] mx-auto px-6 sm:px-12 py-16">
            
            <div className="mb-20 opacity-30 hover:opacity-100 transition-opacity duration-500">
              <div className="flex items-center gap-8 py-2 border-b border-white/5">
                 <div className="flex items-center gap-2 text-[9px] text-slate-600 uppercase tracking-[0.3em] font-black min-w-[100px]">
                   <Calendar size={10}/> Дата
                 </div>
                 <div className="text-[11px] text-slate-400 font-mono">{new Date(activeEntity.updatedAt).toLocaleDateString('ru-RU')}</div>
              </div>
              <div className="flex items-center gap-8 py-2 border-b border-white/5">
                 <div className="flex items-center gap-2 text-[9px] text-slate-600 uppercase tracking-[0.3em] font-black min-w-[100px]">
                   <Hash size={10}/> Теги
                 </div>
                 <div className="flex flex-wrap gap-1">
                   {tags.length > 0 ? tags.map(t => (
                     <span key={t} className="text-[10px] text-purple-400/60 font-bold lowercase">#{t}</span>
                   )) : <span className="text-slate-800 italic text-[10px]">нет тегов</span>}
                 </div>
              </div>
            </div>

            <div className="relative">
              {isPreview ? (
                <div 
                  className="markdown-body"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  ref={previewRef}
                />
              ) : (
                <textarea
                  autoFocus
                  value={activeEntity.content}
                  onChange={(e) => onUpdateContent(e.target.value)}
                  placeholder="Запишите ваши мысли здесь..."
                  className="editor-textarea"
                  spellCheck={false}
                />
              )}
            </div>

            <div className="fading-line" />

            <div className="pb-32">
                <div className="flex items-center gap-3 mb-12 text-slate-800 uppercase tracking-[0.4em] text-[10px] font-black">
                    <Compass size={14} className="text-purple-500/10" />
                    Соединения
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     {MarkdownLinkService.findBacklinks(activeEntity, entities).length > 0 ? (
                         MarkdownLinkService.findBacklinks(activeEntity, entities).map(note => (
                             <button
                                key={note.id}
                                onClick={() => onNavigateById(note.id)}
                                className="group p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:bg-purple-500/5 hover:border-purple-500/10 transition-all flex items-center justify-between"
                             >
                                <span className="text-[15px] text-slate-500 group-hover:text-purple-300 transition-colors font-medium truncate px-3">{note.name}</span>
                                <div className="p-2 mr-1 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                                  <LinkIcon size={12} className="text-purple-400" />
                                </div>
                             </button>
                         ))
                     ) : (
                         <div className="text-[11px] text-slate-800 italic tracking-wider pl-4">Связей не обнаружено</div>
                     )}
                </div>
            </div>
          </div>
        </div>
        
        {showBacklinks && (
          <BacklinksPanel 
            backlinks={MarkdownLinkService.findBacklinks(activeEntity, entities)}
            onSelect={onNavigateById}
          />
        )}
      </div>
    </div>
  );
};