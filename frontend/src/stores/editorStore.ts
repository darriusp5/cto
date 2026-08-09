import { create } from 'zustand';
import type { DiagramData, DiagramElement } from '@/types';

interface EditorState {
  data: DiagramData;
  selectedId: string | null;
  zoom: number;
  dirty: boolean;
  grid: boolean;
  setData: (data: DiagramData) => void;
  select: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  add: (el: DiagramElement) => void;
  remove: () => void;
  duplicate: () => void;
  rotate: () => void;
  markClean: () => void;
}

const initial: DiagramData = {
  format: 'A4',
  grid: 5,
  elements: [],
  links: [],
  settings: { showGrid: true, snapToGrid: true },
};

/** Парсит терминалы/параметры, которые могут прийти строкой JSON или отсутствовать. */
function parseTerminals(v: unknown): Array<{ id: string; name: string; side: string; pos: number }> {
  if (Array.isArray(v)) return v as Array<{ id: string; name: string; side: string; pos: number }>;
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as Array<{ id: string; name: string; side: string; pos: number }>) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseParams(v: unknown): Record<string, string | number> {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, string | number>;
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

/** Приводит документ к полной форме (защита от старых/пустых данных проекта). */
function normalizeDoc(data: Partial<DiagramData> | null | undefined): DiagramData {
  return {
    format: data?.format ?? initial.format,
    grid: data?.grid ?? initial.grid,
    elements: (Array.isArray(data?.elements) ? data.elements : []).map((el) => ({
      ...el,
      terminals: parseTerminals(el.terminals),
      params: parseParams(el.params),
    })),
    links: Array.isArray(data?.links) ? data.links : [],
    settings: { ...initial.settings, ...(data?.settings ?? {}) },
  };
}

export const useEditorStore = create<EditorState>((set) => ({
  data: initial,
  selectedId: null,
  zoom: 1,
  dirty: false,
  grid: true,
  setData: (data) => {
    const doc = normalizeDoc(data);
    set({ data: doc, grid: doc.settings?.showGrid !== false });
  },
  select: (selectedId) => set({ selectedId }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  toggleGrid: () => set((s) => ({ grid: !s.grid, dirty: true })),
  add: (el) => set((s) => ({ data: { ...s.data, elements: [...s.data.elements, el] }, selectedId: el.id, dirty: true })),
  remove: () =>
    set((s) => ({
      data: { ...s.data, elements: s.data.elements.filter((e) => e.id !== s.selectedId) },
      selectedId: null,
      dirty: true,
    })),
  duplicate: () =>
    set((s) => {
      const el = s.data.elements.find((e) => e.id === s.selectedId);
      if (!el) return s;
      const copy = { ...el, id: `el-${Date.now()}`, x: el.x + 20, y: el.y + 20 };
      return { data: { ...s.data, elements: [...s.data.elements, copy] }, selectedId: copy.id, dirty: true };
    }),
  rotate: () =>
    set((s) => ({
      data: { ...s.data, elements: s.data.elements.map((e) => (e.id === s.selectedId ? { ...e, rotation: (e.rotation + 90) % 360 } : e)) },
      dirty: true,
    })),
  markClean: () => set({ dirty: false }),
}));
