import { create } from 'zustand';
import type { DiagramData, DiagramElement, DiagramGroup, DiagramLink, Layer } from '@/types';
import { DEFAULT_LAYERS, HISTORY_LIMIT } from '@/lib/constants';
import { DEFAULT_WIRE_COLOR } from '@/lib/wireUtils';
import type { TraceMode } from '@/lib/constants';

export type SelectionKind = 'element' | 'link';

/** Позиция контекстного меню (4.10). */
export interface ContextMenuState {
  x: number;
  y: number;
  kind: 'element' | 'canvas';
  elementId?: string;
}

export interface ClipboardData {
  elements: DiagramElement[];
  links: DiagramLink[];
}

interface EditorState {
  data: DiagramData;
  past: DiagramData[];
  future: DiagramData[];
  selectedId: string | null;
  selectedIds: string[];
  selectedKind: SelectionKind;
  zoom: number;
  grid: boolean;
  ortho: boolean;
  dirty: boolean;
  activeLayerId: string;
  wireMode: TraceMode;
  wireDraft: { source: string; sourcePort: string; points: { x: number; y: number }[] } | null;
  clipboard: ClipboardData | null;
  cursorPos: { x: number; y: number } | null;
  contextMenu: ContextMenuState | null;
  layersOpen: boolean;

  // ── данные / навигация ──────────────────────────────────────────────
  setData: (data: DiagramData) => void;
  markClean: () => void;
  select: (id: string | null, kind?: SelectionKind) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleOrtho: () => void;
  setCursorPos: (pos: { x: number; y: number } | null) => void;
  setTraceMode: (mode: TraceMode) => void;
  openContextMenu: (menu: ContextMenuState | null) => void;
  openLayers: (open: boolean) => void;

  // ── история (8) ─────────────────────────────────────────────────────
  snapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // ── элементы ────────────────────────────────────────────────────────
  add: (el: DiagramElement) => void;
  remove: () => void;
  duplicate: () => void;
  rotate: (cw: boolean) => void;
  moveBy: (id: string, dx: number, dy: number) => void;
  toFront: () => void;
  toBack: () => void;
  setElementLayer: (id: string, layerId: string) => void;
  setElementLabel: (id: string, label: string) => void;

  // ── провода (4.9) ───────────────────────────────────────────────────
  startWire: (source: string, sourcePort: string) => void;
  addWirePoint: (x: number, y: number) => void;
  finishWire: (target: string, targetPort: string) => { ok: boolean; error?: string };
  cancelWire: () => void;
  removeLink: (id: string) => void;
  setLinkStyle: (id: string, style: DiagramLink['style']) => void;
  setLinkLayer: (id: string, layerId: string) => void;

  // ── буфер обмена (4.13) ─────────────────────────────────────────────
  copySelection: () => void;
  cutSelection: () => void;
  pasteAt: (pos?: { x: number; y: number }) => void;

  // ── группы (4.12) ───────────────────────────────────────────────────
  group: () => void;
  ungroup: () => void;

  // ── слои (4.11) ─────────────────────────────────────────────────────
  addLayer: (name: string) => void;
  renameLayer: (id: string, name: string) => void;
  deleteLayer: (id: string) => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
  setLayerLocked: (id: string, locked: boolean) => void;
  moveLayer: (id: string, dir: -1 | 1) => void;
  setActiveLayer: (id: string) => void;
}

const initial: DiagramData = {
  format: 'A4',
  grid: 5,
  elements: [],
  links: [],
  layers: DEFAULT_LAYERS.map((l) => ({ ...l })),
  groups: [],
  settings: { showGrid: true, snapToGrid: true },
};

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
  const layers: Layer[] = Array.isArray(data?.layers) && data!.layers!.length
    ? data!.layers!.map((l, i) => ({ id: l.id, name: l.name, visible: l.visible !== false, locked: !!l.locked, order: l.order ?? i }))
    : DEFAULT_LAYERS.map((l) => ({ ...l }));
  const defaultLayerId = layers[0].id;
  return {
    format: data?.format ?? initial.format,
    grid: data?.grid ?? initial.grid,
    elements: (Array.isArray(data?.elements) ? data.elements : []).map((el) => ({
      ...el,
      layerId: el.layerId && layers.some((l) => l.id === el.layerId) ? el.layerId : defaultLayerId,
      groupId: el.groupId,
      terminals: parseTerminals(el.terminals),
      params: parseParams(el.params),
    })),
    links: (Array.isArray(data?.links) ? data.links : []).map((lk) => ({
      ...lk,
      vertices: Array.isArray(lk.vertices) ? lk.vertices : [],
      layerId: lk.layerId && layers.some((l) => l.id === lk.layerId) ? lk.layerId : layers[layers.length - 1]?.id ?? defaultLayerId,
    })),
    layers,
    groups: Array.isArray(data?.groups) ? data.groups : [],
    settings: { ...initial.settings, ...(data?.settings ?? {}) },
  };
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Множество id элементов для операций: выделение + целые группы выбранных. */
function targetElementIds(s: Pick<EditorState, 'data' | 'selectedId' | 'selectedIds' | 'selectedKind'>): string[] {
  if (s.selectedKind === 'link') return [];
  const ids = s.selectedIds.length ? s.selectedIds : s.selectedId ? [s.selectedId] : [];
  if (ids.length === 0) return [];
  const groupIds = new Set(s.data.elements.filter((e) => ids.includes(e.id) && e.groupId).map((e) => e.groupId as string));
  if (groupIds.size === 0) return ids;
  const members = s.data.elements.filter((e) => e.groupId && groupIds.has(e.groupId)).map((e) => e.id);
  return [...new Set([...ids, ...members])];
}

/** Клонирование выделенных элементов и внутренних проводов с новыми id. */
function cloneSelection(data: DiagramData, ids: string[], idMap?: Map<string, string>): { elements: DiagramElement[]; links: DiagramLink[]; map: Map<string, string> } {
  const map = idMap ?? new Map<string, string>();
  const elements = data.elements
    .filter((e) => ids.includes(e.id))
    .map((e) => {
      const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      map.set(e.id, newId);
      return { ...clone(e), id: newId };
    });
  const idSet = new Set(ids);
  const links = data.links
    .filter((lk) => idSet.has(lk.source) && idSet.has(lk.target))
    .map((lk) => ({
      ...clone(lk),
      id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: map.get(lk.source) ?? lk.source,
      target: map.get(lk.target) ?? lk.target,
    }));
  return { elements, links, map };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  data: initial,
  past: [],
  future: [],
  selectedId: null,
  selectedIds: [],
  selectedKind: 'element',
  zoom: 1,
  grid: true,
  ortho: true,
  dirty: false,
  activeLayerId: DEFAULT_LAYERS[0].id,
  wireMode: 'single',
  wireDraft: null,
  clipboard: null,
  cursorPos: null,
  contextMenu: null,
  layersOpen: false,

  setData: (data) => {
    const doc = normalizeDoc(data);
    set({
      data: doc,
      grid: doc.settings?.showGrid !== false,
      past: [],
      future: [],
      selectedId: null,
      selectedIds: [],
      selectedKind: 'element',
      wireDraft: null,
      activeLayerId: (doc.layers ?? [])[0]?.id ?? DEFAULT_LAYERS[0].id,
    });
  },
  markClean: () => set({ dirty: false }),
  select: (id, kind = 'element') => {
    if (id === null) set({ selectedId: null, selectedIds: [], selectedKind: 'element' });
    else set({ selectedId: id, selectedKind: kind, selectedIds: kind === 'element' ? [id] : [] });
  },
  toggleSelect: (id) =>
    set((s) => {
      const has = s.selectedIds.includes(id);
      const selectedIds = has ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id];
      return { selectedIds, selectedId: id, selectedKind: 'element' };
    }),
  selectAll: () =>
    set((s) => ({
      selectedIds: s.data.elements.map((e) => e.id),
      selectedId: s.data.elements[0]?.id ?? null,
      selectedKind: 'element',
    })),
  clearSelection: () => set({ selectedId: null, selectedIds: [], selectedKind: 'element' }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  toggleGrid: () => set((s) => ({ grid: !s.grid, dirty: true })),
  toggleOrtho: () => set((s) => ({ ortho: !s.ortho })),
  setCursorPos: (cursorPos) => set({ cursorPos }),
  setTraceMode: (wireMode) => set({ wireMode }),
  openContextMenu: (contextMenu) => set({ contextMenu }),
  openLayers: (layersOpen) => set({ layersOpen }),

  snapshot: () =>
    set((s) => ({
      past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
      future: [],
    })),
  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s;
      const prev = s.past[s.past.length - 1];
      const nextFuture = [...s.future.slice(-(HISTORY_LIMIT - 1)), s.data];
      const sel = clampSelection(prev, s.selectedId, s.selectedIds, s.selectedKind);
      return { data: prev, past: s.past.slice(0, -1), future: nextFuture, dirty: true, ...sel, wireDraft: null };
    }),
  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s;
      const next = s.future[s.future.length - 1];
      const nextPast = [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data];
      const sel = clampSelection(next, s.selectedId, s.selectedIds, s.selectedKind);
      return { data: next, past: nextPast, future: s.future.slice(0, -1), dirty: true, ...sel, wireDraft: null };
    }),
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  add: (el) =>
    set((s) => ({
      past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
      future: [],
      data: { ...s.data, elements: [...s.data.elements, { ...el, layerId: el.layerId ?? s.activeLayerId }] },
      selectedId: el.id,
      selectedIds: [el.id],
      selectedKind: 'element',
      dirty: true,
    })),

  remove: () =>
    set((s) => {
      const ids = targetElementIds(s);
      if (s.selectedKind === 'link' && s.selectedId) {
        return {
          past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
          future: [],
          data: { ...s.data, links: s.data.links.filter((lk) => lk.id !== s.selectedId) },
          selectedId: null,
          selectedKind: 'element',
          dirty: true,
        };
      }
      if (ids.length === 0) return s;
      const idSet = new Set(ids);
      const groupIds = new Set(s.data.elements.filter((e) => idSet.has(e.id) && e.groupId).map((e) => e.groupId as string));
      const allIds = new Set(s.data.elements.filter((e) => (idSet.has(e.id) || (e.groupId && groupIds.has(e.groupId)))).map((e) => e.id));
      return {
        past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
        future: [],
        data: {
          ...s.data,
          elements: s.data.elements.filter((e) => !allIds.has(e.id)),
          links: s.data.links.filter((lk) => !allIds.has(lk.source) && !allIds.has(lk.target)),
          groups: s.data.groups?.filter((g) => !groupIds.has(g.id)) ?? [],
        },
        selectedId: null,
        selectedIds: [],
        selectedKind: 'element',
        dirty: true,
      };
    }),

  duplicate: () =>
    set((s) => {
      const ids = targetElementIds(s);
      if (ids.length === 0) return s;
      const { elements, links } = cloneSelection(s.data, ids);
      const newIds = elements.map((e) => e.id);
      // группы дублируются вместе с участниками
      const srcGroups = s.data.groups?.filter((g) => g.elementIds.some((id) => ids.includes(id))) ?? [];
      const groups: DiagramGroup[] = [...(s.data.groups ?? []), ...srcGroups.map((g) => ({ ...clone(g), id: `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, elementIds: g.elementIds.map((id) => newIds[ids.indexOf(id)] ?? id) }))];
      return {
        past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
        future: [],
        data: {
          ...s.data,
          elements: [...s.data.elements, ...elements],
          links: [...s.data.links, ...links],
          groups,
        },
        selectedId: newIds[0] ?? null,
        selectedIds: newIds,
        selectedKind: 'element',
        dirty: true,
      };
    }),

  rotate: (cw) =>
    set((s) => {
      const ids = targetElementIds(s);
      if (ids.length === 0) return s;
      const idSet = new Set(ids);
      return {
        past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
        future: [],
        data: {
          ...s.data,
          elements: s.data.elements.map((e) =>
            idSet.has(e.id) ? { ...e, rotation: ((((e.rotation ?? 0) + (cw ? 90 : -90)) % 360) + 360) % 360 } : e,
          ),
        },
        dirty: true,
      };
    }),

  moveBy: (id, dx, dy) =>
    set((s) => ({
      data: {
        ...s.data,
        elements: s.data.elements.map((e) => (e.id === id ? { ...e, x: e.x + dx, y: e.y + dy } : e)),
      },
    })),

  toFront: () =>
    set((s) => {
      const ids = targetElementIds(s);
      if (ids.length === 0) return s;
      const idSet = new Set(ids);
      const moved = s.data.elements.filter((e) => idSet.has(e.id));
      const rest = s.data.elements.filter((e) => !idSet.has(e.id));
      return {
        past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
        future: [],
        data: { ...s.data, elements: [...rest, ...moved] },
        dirty: true,
      };
    }),
  toBack: () =>
    set((s) => {
      const ids = targetElementIds(s);
      if (ids.length === 0) return s;
      const idSet = new Set(ids);
      const moved = s.data.elements.filter((e) => idSet.has(e.id));
      const rest = s.data.elements.filter((e) => !idSet.has(e.id));
      return {
        past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
        future: [],
        data: { ...s.data, elements: [...moved, ...rest] },
        dirty: true,
      };
    }),

  setElementLayer: (id, layerId) =>
    set((s) => ({
      past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
      future: [],
      data: { ...s.data, elements: s.data.elements.map((e) => (e.id === id ? { ...e, layerId } : e)) },
      dirty: true,
    })),
  setElementLabel: (id, label) =>
    set((s) => ({
      past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
      future: [],
      data: { ...s.data, elements: s.data.elements.map((e) => (e.id === id ? { ...e, label } : e)) },
      dirty: true,
    })),

  // ── провода ─────────────────────────────────────────────────────────
  startWire: (source, sourcePort) =>
    set({ wireDraft: { source, sourcePort, points: [] } }),
  addWirePoint: (x, y) =>
    set((s) => (s.wireDraft ? { wireDraft: { ...s.wireDraft, points: [...s.wireDraft.points, { x, y }] } } : s)),
  finishWire: (target, targetPort) => {
    const s = get();
    if (!s.wireDraft) return { ok: false, error: 'Нет начатой трассировки' };
    const { source, sourcePort, points } = s.wireDraft;
    const srcEl = s.data.elements.find((e) => e.id === source);
    const dstEl = s.data.elements.find((e) => e.id === target);
    const srcTerm = srcEl?.terminals?.find((t) => t.id === sourcePort);
    const dstTerm = dstEl?.terminals?.find((t) => t.id === targetPort);
    if (!srcEl || !dstEl || !srcTerm || !dstTerm) {
      set({ wireDraft: null });
      return { ok: false, error: 'Клемма не найдена' };
    }
    if (source === target) {
      set({ wireDraft: null });
      return { ok: false, error: 'Нельзя соединить элемент с самим собой' };
    }
    const allowed = srcTerm.id === 'both' || dstTerm.id === 'both' || srcTerm.id !== dstTerm.id;
    if (!allowed) {
      set({ wireDraft: null });
      return { ok: false, error: `Нельзя соединить ${srcTerm.name} с ${dstTerm.name}` };
    }
    // не дублируем одинаковые провода
    const exists = s.data.links.some(
      (lk) =>
        (lk.source === source && lk.sourcePort === sourcePort && lk.target === target && lk.targetPort === targetPort) ||
        (lk.source === target && lk.sourcePort === targetPort && lk.target === source && lk.targetPort === sourcePort),
    );
    if (exists) {
      set({ wireDraft: null });
      return { ok: true, error: undefined };
    }
    const wiresLayer = s.data.layers?.find((l) => l.name === 'Провода') ?? s.data.layers?.[s.data.layers.length - 1];
    const link: DiagramLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source,
      sourcePort,
      target,
      targetPort,
      vertices: points.length ? points : undefined,
      layerId: wiresLayer?.id,
      style: { stroke: DEFAULT_WIRE_COLOR, strokeWidth: 2, lineType: 'solid' },
    };
    set({
      past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
      future: [],
      data: { ...s.data, links: [...s.data.links, link] },
      wireDraft: null,
      selectedId: link.id,
      selectedKind: 'link',
      selectedIds: [],
      dirty: true,
    });
    return { ok: true };
  },
  cancelWire: () => set({ wireDraft: null }),
  removeLink: (id) =>
    set((s) => ({
      past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
      future: [],
      data: { ...s.data, links: s.data.links.filter((lk) => lk.id !== id) },
      selectedId: null,
      selectedKind: 'element',
      dirty: true,
    })),
  setLinkStyle: (id, style) =>
    set((s) => ({
      past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
      future: [],
      data: { ...s.data, links: s.data.links.map((lk) => (lk.id === id ? { ...lk, style: { ...lk.style, ...style } } : lk)) },
      dirty: true,
    })),
  setLinkLayer: (id, layerId) =>
    set((s) => ({
      past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
      future: [],
      data: { ...s.data, links: s.data.links.map((lk) => (lk.id === id ? { ...lk, layerId } : lk)) },
      dirty: true,
    })),

  // ── буфер обмена ────────────────────────────────────────────────────
  copySelection: () => {
    const s = get();
    const ids = targetElementIds(s);
    if (ids.length === 0) return;
    const { elements, links } = cloneSelection(s.data, ids);
    set({ clipboard: { elements, links } });
  },
  cutSelection: () => {
    const s = get();
    const ids = targetElementIds(s);
    if (ids.length === 0) return;
    const { elements, links } = cloneSelection(s.data, ids);
    set({ clipboard: { elements, links } });
    get().remove();
  },
  pasteAt: (pos) => {
    const s = get();
    if (!s.clipboard || s.clipboard.elements.length === 0) return;
    const src = s.clipboard;
    let dx = 20;
    let dy = 20;
    if (pos) {
      const minX = Math.min(...src.elements.map((e) => e.x));
      const minY = Math.min(...src.elements.map((e) => e.y));
      dx = Math.max(0, pos.x - minX);
      dy = Math.max(0, pos.y - minY);
    }
    const elements = src.elements.map((e) => ({ ...clone(e), x: e.x + dx, y: e.y + dy }));
    const map = new Map<string, string>();
    src.elements.forEach((e, i) => map.set(e.id, elements[i].id));
    const links = src.links.map((lk) => ({ ...clone(lk), id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, source: map.get(lk.source) ?? lk.source, target: map.get(lk.target) ?? lk.target }));
    set((st) => ({
      past: [...st.past.slice(-(HISTORY_LIMIT - 1)), st.data],
      future: [],
      data: { ...st.data, elements: [...st.data.elements, ...elements], links: [...st.data.links, ...links] },
      selectedId: elements[0]?.id ?? null,
      selectedIds: elements.map((e) => e.id),
      selectedKind: 'element',
      dirty: true,
    }));
  },

  // ── группы ──────────────────────────────────────────────────────────
  group: () =>
    set((s) => {
      const ids = s.selectedIds.length ? s.selectedIds : s.selectedId ? [s.selectedId] : [];
      if (ids.length < 2) return s;
      const groupId = `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const idSet = new Set(ids);
      return {
        past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
        future: [],
        data: {
          ...s.data,
          elements: s.data.elements.map((e) => (idSet.has(e.id) ? { ...e, groupId } : e)),
          groups: [...(s.data.groups ?? []), { id: groupId, name: `Группа ${(s.data.groups?.length ?? 0) + 1}`, elementIds: ids }],
        },
        dirty: true,
      };
    }),
  ungroup: () =>
    set((s) => {
      const ids = s.selectedIds.length ? s.selectedIds : s.selectedId ? [s.selectedId] : [];
      const touched = new Set(s.data.elements.filter((e) => ids.includes(e.id) && e.groupId).map((e) => e.groupId as string));
      if (touched.size === 0) return s;
      return {
        past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
        future: [],
        data: {
          ...s.data,
          elements: s.data.elements.map((e) => (e.groupId && touched.has(e.groupId) ? { ...e, groupId: undefined } : e)),
          groups: s.data.groups?.filter((g) => !touched.has(g.id)) ?? [],
        },
        dirty: true,
      };
    }),

  // ── слои ────────────────────────────────────────────────────────────
  addLayer: (name) =>
    set((s) => {
      const layers = [...s.data.layers!, { id: `layer-${Date.now()}`, name, visible: true, locked: false, order: s.data.layers!.length }];
      return {
        past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
        future: [],
        data: { ...s.data, layers },
        activeLayerId: layers[layers.length - 1].id,
        dirty: true,
      };
    }),
  renameLayer: (id, name) =>
    set((s) => ({
      past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
      future: [],
      data: { ...s.data, layers: s.data.layers!.map((l) => (l.id === id ? { ...l, name } : l)) },
      dirty: true,
    })),
  deleteLayer: (id) =>
    set((s) => {
      const layers = s.data.layers!;
      if (layers.length <= 1) return s;
      const target = layers.find((l) => l.id === id);
      if (!target) return s;
      const fallback = layers.find((l) => l.id !== id)!;
      const rest = layers.filter((l) => l.id !== id).map((l, i) => ({ ...l, order: i }));
      return {
        past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
        future: [],
        data: {
          ...s.data,
          layers: rest,
          elements: s.data.elements.map((e) => (e.layerId === id ? { ...e, layerId: fallback.id } : e)),
          links: s.data.links.map((lk) => (lk.layerId === id ? { ...lk, layerId: fallback.id } : lk)),
        },
        activeLayerId: s.activeLayerId === id ? fallback.id : s.activeLayerId,
        dirty: true,
      };
    }),
  setLayerVisibility: (id, visible) =>
    set((s) => ({
      past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
      future: [],
      data: { ...s.data, layers: s.data.layers!.map((l) => (l.id === id ? { ...l, visible } : l)) },
      dirty: true,
    })),
  setLayerLocked: (id, locked) =>
    set((s) => ({
      past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
      future: [],
      data: { ...s.data, layers: s.data.layers!.map((l) => (l.id === id ? { ...l, locked } : l)) },
      dirty: true,
    })),
  moveLayer: (id, dir) =>
    set((s) => {
      const layers = [...s.data.layers!];
      const idx = layers.findIndex((l) => l.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= layers.length) return s;
      [layers[idx], layers[j]] = [layers[j], layers[idx]];
      return {
        past: [...s.past.slice(-(HISTORY_LIMIT - 1)), s.data],
        future: [],
        data: { ...s.data, layers: layers.map((l, i) => ({ ...l, order: i })) },
        dirty: true,
      };
    }),
  setActiveLayer: (activeLayerId) => set({ activeLayerId }),
}));

/** Корректирует выделение после undo/redo, если объект исчез. */
function clampSelection(
  data: DiagramData,
  selectedId: string | null,
  selectedIds: string[],
  selectedKind: SelectionKind,
): Pick<EditorState, 'selectedId' | 'selectedIds' | 'selectedKind'> {
  if (selectedKind === 'link') {
    const ok = data.links.some((lk) => lk.id === selectedId);
    return ok ? { selectedId, selectedIds: [], selectedKind: 'link' } : { selectedId: null, selectedIds: [], selectedKind: 'element' };
  }
  const ids = selectedIds.filter((id) => data.elements.some((e) => e.id === id));
  const primary = selectedId && data.elements.some((e) => e.id === selectedId) ? selectedId : ids[0] ?? null;
  return { selectedId: primary, selectedIds: ids, selectedKind: 'element' };
}
