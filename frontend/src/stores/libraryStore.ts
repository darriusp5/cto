import { create } from 'zustand';

import {
  addFavorite,
  fetchComponents,
  fetchFavorites,
  removeFavorite,
  searchComponents,
  type ComponentQuery,
} from '@/lib/auth';
import type { ComponentItem } from '@/types';

/**
 * Стор библиотеки компонентов (раздел 4.6): поиск, фильтры, дерево, избранное.
 * Данные загружаются с сервера (этап 6).
 */
interface LibraryState {
  components: ComponentItem[];
  favorites: ComponentItem[];
  query: string;
  brandFilter: string;
  typeFilter: string;
  loading: boolean;
  error: string | null;
  load: (query?: ComponentQuery) => Promise<void>;
  loadFavorites: () => Promise<void>;
  setQuery: (q: string) => void;
  setBrandFilter: (b: string) => void;
  setTypeFilter: (t: string) => void;
  toggleFavorite: (componentId: string) => Promise<void>;
  applySearch: (q: string) => Promise<void>;
  searchSuggestions: ComponentItem[];
  searching: boolean;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  components: [],
  favorites: [],
  query: '',
  brandFilter: '',
  typeFilter: '',
  loading: false,
  error: null,
  searchSuggestions: [],
  searching: false,

  load: async (query = {}) => {
    set({ loading: true, error: null });
    try {
      const { query: q, brandFilter, typeFilter } = get();
      const components = await fetchComponents({
        q: q || undefined,
        brandId: brandFilter || undefined,
        type: typeFilter || query.type || undefined,
      });
      set({ components, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Ошибка загрузки библиотеки', loading: false });
    }
  },

  loadFavorites: async () => {
    try {
      set({ favorites: await fetchFavorites() });
    } catch {
      /* не критично */
    }
  },

  setQuery: (query) => set({ query }),
  setBrandFilter: (brandFilter) => set({ brandFilter }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),

  toggleFavorite: async (componentId) => {
    const isFav = get().favorites.some((f) => f.id === componentId);
    try {
      if (isFav) {
        await removeFavorite(componentId);
        set((s) => ({ favorites: s.favorites.filter((f) => f.id !== componentId) }));
      } else {
        await addFavorite(componentId);
        await get().loadFavorites();
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Ошибка избранного' });
    }
  },

  applySearch: async (q) => {
    set({ query: q, searching: true });
    try {
      const result = q.trim().length >= 2 ? await searchComponents(q.trim()) : await fetchComponents();
      set({ components: result, searchSuggestions: q.trim().length >= 2 ? result.slice(0, 5) : [], searching: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Ошибка поиска', searching: false });
    }
  },
}));
