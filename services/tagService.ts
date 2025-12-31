import { VaultEntity } from '../types';

export const TagService = {
  /**
   * Извлекает все уникальные теги из текста (формат #tagname)
   */
  extractTags: (content: string): string[] => {
    const tagRegex = /#([\wа-яА-Я-]+)/g;
    const tags: string[] = [];
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    return Array.from(new Set(tags));
  },

  /**
   * Группирует заметки по тегам
   */
  getTagsMap: (entities: VaultEntity[]): Record<string, string[]> => {
    const map: Record<string, string[]> = {};
    entities.forEach(entity => {
      if (entity.type === 'file' && entity.content) {
        const tags = TagService.extractTags(entity.content);
        tags.forEach(tag => {
          if (!map[tag]) map[tag] = [];
          map[tag].push(entity.id);
        });
      }
    });
    return map;
  }
};