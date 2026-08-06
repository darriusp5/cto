import { parseKul } from '@/lib/kul';
import type { KulDocument } from '@/types';

/**
 * Парсер файлов проекта (.kul) — раздел 4.2.2 («Открыть существующую»).
 */

export function parseKulFile(file: File): Promise<KulDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.onload = () => {
      try {
        resolve(parseKul(String(reader.result)));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Некорректный .kul файл'));
      }
    };
    reader.readAsText(file);
  });
}
