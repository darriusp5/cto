import { create } from 'zustand';

import { ZOOM_LEVELS } from '@/lib/constants';

/**
 * Стор редактора (каркас, этап 1).
 * Логика холста (выделение, слои, история) — на этапах 2–4.
 */
interface EditorState {
  zoom: number;
  selectedElementIds: string[];
  showGrid: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  showHints: boolean;
  theme: 'light' | 'dark' | 'system';
  setZoom: (zoom: number) => void;
  setSelectedElementIds: (ids: string[]) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  toggleRulers: () => void;
  toggleGuides: () => void;
  toggleHints: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const clampZoom = (zoom: number): number => {
  const min = ZOOM_LEVELS[0];
  const max = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  return Math.min(max, Math.max(min, zoom));
};

export const useEditorStore = create<EditorState>((set) => ({
  zoom: 1,
  selectedElementIds: [],
  showGrid: true,
  snapToGrid: true,
  showRulers: true,
  showGuides: true,
  showHints: true,
  theme: 'system',
  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
  setSelectedElementIds: (selectedElementIds) => set({ selectedElementIds }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),
  toggleGuides: () => set((state) => ({ showGuides: !state.showGuides })),
  toggleHints: () => set((state) => ({ showHints: !state.showHints })),
  setTheme: (theme) => set({ theme }),
}));
