import type { Project } from '@/types';

/**
 * Парсер файлов проекта (.kul) (каркас, этап 1).
 * Реализация формата — на этапе 2.
 */

export interface ParsedKulFile {
  project: Project;
}

export function parseKulFile(_file: File): Promise<ParsedKulFile> {
  // TODO(этап 2): разбор .kul (JSON-структура проекта)
  return Promise.reject(new Error('Формат .kul будет реализован на этапе 2'));
}

export function serializeKulFile(_project: Project): string {
  // TODO(этап 2): сериализация проекта в .kul
  return JSON.stringify({ version: 1, project: null });
}
