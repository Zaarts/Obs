export type EntityType = 'file' | 'folder';

export interface VaultEntity {
  id: string;
  name: string;
  parentId: string | null;
  type: EntityType;
  content?: string;
  updatedAt: number;
  isStarred?: boolean;
}

export interface ReflectionLog {
  date: string;
  content: string;
  briefing: string;
}

export interface AIState {
  isSocratesOpen: boolean;
  isDumpOpen: boolean;
  morningFlowStep: 'reflection' | 'briefing' | 'complete';
  lastReflectionDate: string | null;
}

export interface SmartSaveResult {
  title: string;
  tags: string[];
  links: string[];
}