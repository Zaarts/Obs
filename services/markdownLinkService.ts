import { VaultEntity } from '../types';

export const MarkdownLinkService = {
  /**
   * Извлекает все названия заметок, на которые ссылается текст через [[Link]]
   */
  extractWikiLinks: (content: string): string[] => {
    const wikiLinkRegex = /\[\[(.*?)\]\]/g;
    const links: string[] = [];
    let match;
    while ((match = wikiLinkRegex.exec(content)) !== null) {
      // Поддержка алиасов [[Note Name|Alias]]
      const linkText = match[1].split('|')[0];
      links.push(linkText.trim());
    }
    return Array.from(new Set(links));
  },

  /**
   * Находит все сущности, которые ссылаются на данную заметку
   */
  findBacklinks: (targetEntity: VaultEntity, allEntities: VaultEntity[]): VaultEntity[] => {
    if (targetEntity.type !== 'file') return [];
    
    return allEntities.filter(entity => {
      if (entity.type !== 'file' || entity.id === targetEntity.id || !entity.content) return false;
      const links = MarkdownLinkService.extractWikiLinks(entity.content);
      return links.includes(targetEntity.name);
    });
  },

  /**
   * Преобразует Wiki-ссылки в кликабельные HTML-ссылки для парсера
   */
  renderWikiLinks: (content: string): string => {
    return content.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
      const parts = p1.split('|');
      const name = parts[0].trim();
      const alias = parts[1] ? parts[1].trim() : name;
      return `<a href="#" class="wiki-link text-purple-400 hover:underline decoration-purple-500/50" data-note="${name}">${alias}</a>`;
    });
  }
};