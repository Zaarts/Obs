import { useState, useEffect, useMemo, useCallback } from 'react';
import { VaultEntity, EntityType } from '../types';
import { StorageService } from '../services/storageService';
import { TagService } from '../services/tagService';
import { generateId } from '../utils/idGenerator';
import { DEFAULT_FILE_NAME, DEFAULT_FOLDER_NAME } from '../constants';
import { AIService } from '../services/aiService';

export type ViewMode = 'editor' | 'graph';

export const useVault = () => {
  const [entities, setEntities] = useState<VaultEntity[]>(() => StorageService.load());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showBacklinks, setShowBacklinks] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    StorageService.save(entities);
  }, [entities]);

  const navigateTo = useCallback((id: string | null) => {
    if (!id || id === activeId) return;
    setActiveId(id);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(id);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [activeId, history, historyIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const prevId = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setActiveId(prevId);
    }
  }, [history, historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextId = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setActiveId(nextId);
    }
  }, [history, historyIndex]);

  const activeEntity = useMemo(() => 
    entities.find(e => e.id === activeId),
    [entities, activeId]
  );

  const addEntity = useCallback((type: EntityType, parentId: string | null = null, initialName?: string, initialContent?: string) => {
    const name = initialName || (type === 'file' ? DEFAULT_FILE_NAME : DEFAULT_FOLDER_NAME);
    // Важно: Инициализируем файл структурой Markdown для красивого отображения сразу
    const defaultContent = type === 'file' ? '## Мои мысли:\n\n' : undefined;
    
    const newEntity: VaultEntity = {
      id: generateId(),
      name,
      type,
      parentId,
      updatedAt: Date.now(),
      isStarred: false,
      content: initialContent || defaultContent
    };
    setEntities(prev => [...prev, newEntity]);
    if (type === 'file') {
      setActiveId(newEntity.id);
      setViewMode('editor');
    }
    if (parentId) setExpandedFolders(prev => new Set(prev).add(parentId));
    return newEntity;
  }, []);

  const moveEntity = useCallback((id: string, newParentId: string | null) => {
    // Рекурсивная проверка: нельзя переместить папку внутрь самой себя или своего потомка
    const isDescendant = (currentParentId: string, potentialChildId: string): boolean => {
      const children = entities.filter(e => e.parentId === currentParentId);
      if (children.some(c => c.id === potentialChildId)) return true;
      return children.some(c => isDescendant(c.id, potentialChildId));
    };

    if (id === newParentId || (newParentId && isDescendant(id, newParentId))) {
      console.warn("[Vault] Попытка некорректного перемещения (циклическая зависимость)");
      return;
    }

    setEntities(prev => prev.map(e => 
      e.id === id ? { ...e, parentId: newParentId, updatedAt: Date.now() } : e
    ));
    
    if (newParentId) {
      setExpandedFolders(prev => new Set(prev).add(newParentId));
    }
  }, [entities]);

  const renameEntity = useCallback((id: string, newName: string) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, name: newName, updatedAt: Date.now() } : e));
  }, []);

  const deleteEntity = useCallback((id: string) => {
    const getDescendantIds = (parentId: string): string[] => {
      const children = entities.filter(e => e.parentId === parentId);
      let ids = children.map(c => c.id);
      children.forEach(c => {
        ids = [...ids, ...getDescendantIds(c.id)];
      });
      return ids;
    };

    const idsToDelete = new Set([id, ...getDescendantIds(id)]);
    
    setEntities(prev => prev.filter(e => !idsToDelete.has(e.id)));
    if (activeId && idsToDelete.has(activeId)) {
      setActiveId(null);
    }
  }, [entities, activeId]);

  const executeSmartSave = async (id: string) => {
    const target = entities.find(e => e.id === id);
    if (!target || !target.content) return;

    const otherNoteNames = entities
      .filter(e => e.id !== id && e.type === 'file')
      .map(e => e.name);
    
    const existingTags = Object.keys(TagService.getTagsMap(entities));

    try {
      const analysis = await AIService.analyzeSmartSave(target.content, otherNoteNames, existingTags);
      
      setEntities(prev => {
        let updated = [...prev];
        const currentIdx = updated.findIndex(e => e.id === id);
        if (currentIdx === -1) return updated;

        let newContent = updated[currentIdx].content || '';
        
        const tagsString = analysis.tags.map(t => `#${t.toLowerCase().replace(/\s+/g, '-')}`).join(' ');
        if (tagsString && !newContent.includes(tagsString)) {
          newContent = tagsString + '\n\n' + newContent;
        }

        if (analysis.links.length > 0) {
          const linksHeader = '\n\n---\n### Связанные знания\n';
          const linksContent = analysis.links.map(l => `[[${l}]]`).join(', ');
          
          if (!newContent.includes('### Связанные знания')) {
            newContent += linksHeader + linksContent;
          }
        }

        const newName = analysis.title && analysis.title !== "Без названия" ? analysis.title : updated[currentIdx].name;

        updated[currentIdx] = { 
          ...updated[currentIdx], 
          name: newName,
          content: newContent, 
          updatedAt: Date.now() 
        };

        return updated;
      });
    } catch (err) {
      console.error("[Vault] Ошибка Smart Save:", err);
      alert("Не удалось связаться с ИИ. Сохранено локально.");
    }
  };

  const loadTestWorld = useCallback(() => {
    const rootId = generateId();
    const folderId = generateId();
    const testEntities: VaultEntity[] = [
      {
        id: rootId,
        name: 'Начало пути',
        type: 'file',
        parentId: null,
        content: '# Добро пожаловать\n\nЭто ваша основная база знаний.\n\n## Мои мысли:\nПопробуйте создать смарт-заметку или переместить этот файл в папку "Архив".\n\n#приветствие #инструкция',
        updatedAt: Date.now(),
        isStarred: true
      },
      {
        id: folderId,
        name: 'Архив озарений',
        type: 'folder',
        parentId: null,
        updatedAt: Date.now()
      },
      {
        id: generateId(),
        name: 'Первая идея',
        type: 'file',
        parentId: folderId,
        content: '## Мои мысли:\nВсе великое начинается с малого.\n\n[[Начало пути]]',
        updatedAt: Date.now()
      }
    ];
    setEntities(testEntities);
    setActiveId(rootId);
    setExpandedFolders(new Set([folderId]));
  }, []);

  const gardenTags = useCallback(() => {
    setEntities(prev => prev.map(entity => {
      if (entity.type !== 'file' || !entity.content) return entity;
      const newContent = entity.content.replace(/#([\wа-яА-Я-]+)/g, (match, tag) => {
        return `#${tag.toLowerCase().replace(/_/g, '-')}`;
      });
      return { ...entity, content: newContent };
    }));
  }, []);

  const toggleStar = useCallback((id: string) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, isStarred: !e.isStarred } : e));
  }, []);

  const updateActiveContent = useCallback((content: string) => {
    setEntities(prev => prev.map(e => e.id === activeId ? { ...e, content, updatedAt: Date.now() } : e));
  }, [activeId]);

  const updateActiveName = useCallback((name: string) => {
    setEntities(prev => prev.map(e => e.id === activeId ? { ...e, name, updatedAt: Date.now() } : e));
  }, [activeId]);

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const tagsMap = useMemo(() => TagService.getTagsMap(entities), [entities]);

  const openNoteByName = useCallback((name: string) => {
    const target = entities.find(e => e.name.toLowerCase() === name.toLowerCase() && e.type === 'file');
    if (target) navigateTo(target.id);
  }, [entities, navigateTo]);

  const createDailyNote = useCallback(() => {
    const name = new Date().toLocaleDateString('ru-RU');
    const existing = entities.find(e => e.name === name && e.type === 'file');
    if (existing) navigateTo(existing.id);
    else addEntity('file', null, name);
  }, [entities, addEntity, navigateTo]);

  const filteredEntities = useMemo(() => {
    let result = entities;
    if (selectedTag) {
      const taggedIds = new Set(tagsMap[selectedTag]);
      return result.filter(e => taggedIds.has(e.id));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return result.filter(e => e.name.toLowerCase().includes(q) || (e.content && e.content.toLowerCase().includes(q)));
    }
    return result.filter(e => !e.parentId).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [entities, searchQuery, selectedTag, tagsMap]);

  return {
    entities, setEntities, activeId, setActiveId: navigateTo, activeEntity, searchQuery, setSearchQuery,
    expandedFolders, addEntity, deleteEntity, moveEntity, renameEntity, updateActiveContent, updateActiveName,
    filteredEntities, openNoteByName, showBacklinks, setShowBacklinks,
    viewMode, setViewMode, createDailyNote, tagsMap, selectedTag, setSelectedTag,
    canGoBack: historyIndex > 0, canGoForward: historyIndex < history.length - 1,
    goBack, goForward, toggleStar, executeSmartSave, gardenTags, toggleFolder, loadTestWorld
  };
};