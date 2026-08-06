import type { TraceMode } from '@/lib/constants';
import type { KulDocument, Layer } from '@/types';

/**
 * Мост редактора: холст (JointJS) регистрирует императивные действия,
 * меню/тулбар/диалоги вызывают их. Позволяет избежать проп-дриллинга.
 */

export interface LayerInfo extends Layer {
  count: number;
}

export interface EditorActions {
  save(): Promise<void> | void;
  undo(): void;
  redo(): void;
  zoomIn(): void;
  zoomOut(): void;
  zoomTo(level: number): void;
  fit(): void;
  cut(): void;
  copy(): void;
  paste(): void;
  duplicate(): void;
  deleteSelection(): void;
  selectAll(): void;
  deselect(): void;
  group(): void;
  ungroup(): void;
  toFront(): void;
  toBack(): void;
  rotate(cw: boolean): void;
  toggleOrtho(): void;
  setTraceMode(mode: TraceMode): void;
  openFind(): void;
  toggleGrid(): void;
  toggleSnap(): void;
  openLayers(): void;
  openPageSetup(): void;
  getLayers(): LayerInfo[];
  addLayer(name: string): void;
  renameLayer(id: string, name: string): void;
  deleteLayer(id: string): void;
  setLayerVisibility(id: string, visible: boolean): void;
  setLayerLocked(id: string, locked: boolean): void;
  moveLayer(id: string, dir: -1 | 1): void;
  setLayerForSelection(layerId: string): void;
  showOnCanvas(id: string): void;
  exportImage(format: 'png' | 'svg' | 'jpeg' | 'pdf'): Promise<void>;
  exportKul(): Promise<void>;
  print(): void;
  /** Заменить содержимое документа (открытие проекта/шаблона/импорт). */
  loadDocument(doc: KulDocument): void;
  getDocument(): KulDocument;
}

const actions: Partial<EditorActions> = {};

export const editorBridge = {
  register(a: Partial<EditorActions>): void {
    Object.assign(actions, a);
  },
  unregister(): void {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    Object.keys(actions).forEach((k) => delete (actions as Record<string, unknown>)[k]);
  },
  get<K extends keyof EditorActions>(key: K): EditorActions[K] | undefined {
    return actions[key];
  },
};

/** Выполнить действие холста, если он зарегистрирован. */
export function run<K extends keyof EditorActions>(key: K, ...args: Parameters<EditorActions[K]>): ReturnType<EditorActions[K]> | undefined {
  const fn = editorBridge.get(key);
  if (!fn) return undefined;
  return (fn as (...a: unknown[]) => ReturnType<EditorActions[K]>)(...args);
}
