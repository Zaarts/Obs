import { VaultEntity } from '../types';
import { STORAGE_KEY } from '../constants';

export const StorageService = {
  save: (entities: VaultEntity[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entities));
  },
  load: (): VaultEntity[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
};