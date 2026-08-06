/**
 * Экспорт схемы в PNG/SVG/JPEG/PDF (каркас, этап 1).
 * Реализация — на этапе 5 (см. раздел 4.5 спецификации).
 */

export type ExportFormat = 'png' | 'svg' | 'jpeg' | 'pdf' | 'kul';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
}

export async function exportCanvas(_options: ExportOptions): Promise<void> {
  // TODO(этап 5): html-to-image / jsPDF / .kul
  throw new Error('Экспорт будет реализован на этапе 5');
}
