import { create } from 'zustand';

import type { LibraryNode } from '@/types';

/**
 * Стор библиотеки компонентов (каркас, этап 1).
 * Поиск, дерево категорий, избранное — на этапе 2.
 */
interface LibraryState {
  query: string;
  nodes: LibraryNode[];
  favoriteIds: string[];
  setQuery: (query: string) => void;
  setNodes: (nodes: LibraryNode[]) => void;
  toggleFavorite: (nodeId: string) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  query: '',
  nodes: [],
  favoriteIds: [],
  setQuery: (query) => set({ query }),
  setNodes: (nodes) => set({ nodes }),
  toggleFavorite: (nodeId) =>
    set((state) => ({
      favoriteIds: state.favoriteIds.includes(nodeId)
        ? state.favoriteIds.filter((id) => id !== nodeId)
        : [...state.favoriteIds, nodeId],
    })),
}));
