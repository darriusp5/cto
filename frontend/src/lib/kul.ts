import { DEFAULT_LAYERS, DEFAULT_PAGE } from '@/lib/constants';
import type { KulDocument } from '@/types';

/**
 * Формат .kul (JSON) — раздел 4.17 спецификации.
 * Сериализация/десериализация документа проекта.
 */

export function newId(prefix = 'obj'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultDoc(title: string): KulDocument {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    metadata: {
      id: newId('project'),
      title,
      customer: '',
      executor: '',
      date: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
      units: 'mm',
      grid: DEFAULT_PAGE.grid,
    },
    page: {
      format: DEFAULT_PAGE.format,
      width: DEFAULT_PAGE.width,
      height: DEFAULT_PAGE.height,
      orientation: DEFAULT_PAGE.orientation,
      background: DEFAULT_PAGE.background,
    },
    layers: DEFAULT_LAYERS.map((l) => ({ ...l })),
    pages: [{ id: 'page-1', name: 'Страница 1', elements: [] }],
    settings: { autosave: true, snapToGrid: true, showRuler: true, showGrid: true, showGuides: true },
  };
}

export function parseKul(text: string): KulDocument {
  const raw = JSON.parse(text) as Record<string, unknown>;
  if (!raw || typeof raw !== 'object' || !raw.metadata || !raw.pages) {
    throw new Error('Некорректный .kul файл');
  }
  const doc = raw as unknown as KulDocument;
  if (!Array.isArray(doc.layers) || doc.layers.length === 0) {
    doc.layers = DEFAULT_LAYERS.map((l) => ({ ...l }));
  }
  if (!doc.page || typeof doc.page.width !== 'number') {
    doc.page = { ...DEFAULT_PAGE };
  }
  if (!doc.settings) {
    doc.settings = { autosave: true, snapToGrid: true, showRuler: true, showGrid: true, showGuides: true };
  }
  if (!doc.pages || doc.pages.length === 0) {
    doc.pages = [{ id: 'page-1', name: 'Страница 1', elements: [] }];
  }
  doc.version = '1.0';
  return doc;
}

export function serializeDoc(doc: KulDocument): string {
  return JSON.stringify(doc, null, 2);
}

/** Форматированный .kul для скачивания/импорта. */
export function kulFilename(title: string): string {
  const safe = title.replace(/[^\wа-яА-ЯёЁ\- ]+/g, '').trim().replace(/\s+/g, '-') || 'project';
  return `${safe}.kul`;
}
