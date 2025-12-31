import { VaultEntity } from '../types';
import { MarkdownLinkService } from './markdownLinkService';

export interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export const GraphService = {
  buildGraph: (entities: VaultEntity[]): { nodes: GraphNode[], links: GraphLink[] } => {
    const files = entities.filter(e => e.type === 'file');
    const nodes: GraphNode[] = files.map(f => ({
      id: f.id,
      name: f.name,
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: 0,
      vy: 0,
      radius: 5
    }));

    const links: GraphLink[] = [];
    files.forEach(file => {
      const outgoingLinks = MarkdownLinkService.extractWikiLinks(file.content || '');
      outgoingLinks.forEach(targetName => {
        const target = files.find(f => f.name.toLowerCase() === targetName.toLowerCase());
        if (target) {
          links.push({ source: file.id, target: target.id });
        }
      });
    });

    return { nodes, links };
  }
};