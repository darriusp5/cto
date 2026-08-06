import { create } from 'zustand';

import type { TraceMode } from '@/lib/constants';
import { ZOOM_LEVELS } from '@/lib/constants';
import type { KulDocument } from '@/types';

/**
 * Стор редактора: зум, ORTHO, режим трассировки, тема, настройки вида,
 * свойства документа, флаги диалогов, история undo/redo.
 */
interface EditorState {
  zoom: number;
  ortho: boolean;
  traceMode: TraceMode;
  selectedCount: number;
  /** Инкрементируется при каждом изменении выделения — триггер перерисовки инспектора. */
  selectedVersion: number;
  dirty: boolean;
  lastSavedAt: string | null;

  /** Контекстное меню холста. */
  contextMenu: { x: number; y: number; kind: 'object' | 'wire' | 'blank' } | null;

  showGrid: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  showHints: boolean;
  theme: 'light' | 'dark' | 'system';
  units: 'mm' | 'cm' | 'in';
  autosave: boolean;
  showToolbar: boolean;
  showLibrary: boolean;
  showInspector: boolean;

  layerManagerOpen: boolean;
  pageSetupOpen: boolean;
  findOpen: boolean;
  statsOpen: boolean;
  hotkeysOpen: boolean;
  aboutOpen: boolean;
  deleteConfirmOpen: boolean;

  /** Свойства документа (правая панель без выделения). */
  document: {
    title: string;
    customer: string;
    executor: string;
    date: string;
    notes: string;
    format: string;
    orientation: 'portrait' | 'landscape';
    width: number;
    height: number;
    grid: number;
    background: string;
  };

  setZoom: (zoom: number) => void;
  setSelectedCount: (n: number) => void;
  setSelectedVersion: (v: number) => void;
  setContextMenu: (menu: { x: number; y: number; kind: 'object' | 'wire' | 'blank' } | null) => void;
  setDirty: (dirty: boolean) => void;
  setSavedAt: (t: string) => void;
  setOrtho: (on: boolean) => void;
  setTraceMode: (mode: TraceMode) => void;
  setDocument: (patch: Partial<EditorState['document']>) => void;
  applyDocumentDoc: (doc: KulDocument) => void;

  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  toggleRulers: () => void;
  toggleGuides: () => void;
  toggleHints: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setUnits: (units: 'mm' | 'cm' | 'in') => void;
  toggleAutosave: () => void;
  toggleToolbar: () => void;
  toggleLibrary: () => void;
  toggleInspector: () => void;

  setLayerManagerOpen: (v: boolean) => void;
  setPageSetupOpen: (v: boolean) => void;
  setFindOpen: (v: boolean) => void;
  setStatsOpen: (v: boolean) => void;
  setHotkeysOpen: (v: boolean) => void;
  setAboutOpen: (v: boolean) => void;
  setDeleteConfirmOpen: (v: boolean) => void;
}

const clampZoom = (zoom: number): number => {
  const min = ZOOM_LEVELS[0];
  const max = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  return Math.min(max, Math.max(min, zoom));
};

export const useEditorStore = create<EditorState>((set) => ({
  zoom: 1,
  ortho: true,
  traceMode: 'none',
  selectedCount: 0,
  selectedVersion: 0,
  dirty: false,
  lastSavedAt: null,
  contextMenu: null,

  showGrid: true,
  snapToGrid: true,
  showRulers: true,
  showGuides: true,
  showHints: true,
  theme: 'dark',
  units: 'mm',
  autosave: true,
  showToolbar: true,
  showLibrary: true,
  showInspector: true,

  layerManagerOpen: false,
  pageSetupOpen: false,
  findOpen: false,
  statsOpen: false,
  hotkeysOpen: false,
  aboutOpen: false,
  deleteConfirmOpen: false,

  document: {
    title: '',
    customer: '',
    executor: '',
    date: '',
    notes: '',
    format: 'A4',
    orientation: 'portrait',
    width: 210,
    height: 297,
    grid: 5,
    background: '#ffffff',
  },

  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
  setSelectedCount: (selectedCount) => set({ selectedCount }),
  setSelectedVersion: (selectedVersion) => set({ selectedVersion }),
  setContextMenu: (contextMenu) => set({ contextMenu }),
  setDirty: (dirty) => set({ dirty }),
  setSavedAt: (lastSavedAt) => set({ lastSavedAt }),
  setOrtho: (ortho) => set({ ortho }),
  setTraceMode: (traceMode) => set({ traceMode }),
  setDocument: (patch) => set((s) => ({ document: { ...s.document, ...patch } })),
  applyDocumentDoc: (doc) =>
    set({
      document: {
        title: doc.metadata.title,
        customer: doc.metadata.customer ?? '',
        executor: doc.metadata.executor ?? '',
        date: doc.metadata.date ?? '',
        notes: doc.metadata.notes ?? '',
        format: doc.page.format,
        orientation: doc.page.orientation,
        width: doc.page.width,
        height: doc.page.height,
        grid: doc.metadata.grid,
        background: doc.page.background,
      },
      units: doc.metadata.units,
      showGrid: doc.settings.showGrid,
      snapToGrid: doc.settings.snapToGrid,
      showRulers: doc.settings.showRuler,
      showGuides: doc.settings.showGuides,
      autosave: doc.settings.autosave,
    }),

  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  toggleHints: () => set((s) => ({ showHints: !s.showHints })),
  setTheme: (theme) => set({ theme }),
  setUnits: (units) => set({ units }),
  toggleAutosave: () => set((s) => ({ autosave: !s.autosave })),
  toggleToolbar: () => set((s) => ({ showToolbar: !s.showToolbar })),
  toggleLibrary: () => set((s) => ({ showLibrary: !s.showLibrary })),
  toggleInspector: () => set((s) => ({ showInspector: !s.showInspector })),

  setLayerManagerOpen: (layerManagerOpen) => set({ layerManagerOpen }),
  setPageSetupOpen: (pageSetupOpen) => set({ pageSetupOpen }),
  setFindOpen: (findOpen) => set({ findOpen }),
  setStatsOpen: (statsOpen) => set({ statsOpen }),
  setHotkeysOpen: (hotkeysOpen) => set({ hotkeysOpen }),
  setAboutOpen: (aboutOpen) => set({ aboutOpen }),
  setDeleteConfirmOpen: (deleteConfirmOpen) => set({ deleteConfirmOpen }),
}));
