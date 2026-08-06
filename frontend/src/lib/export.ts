import { toJpeg, toPng, toSvg } from 'html-to-image';
import { kulFilename, serializeDoc } from '@/lib/kul';
import type { KulDocument } from '@/types';

/**
 * Экспорт схемы (разделы 4.4.1, 4.5): PNG / SVG / JPEG / PDF (печать) / KUL.
 * PNG/SVG/JPEG — html-to-image по DOM-элементу холста; PDF — через печать браузера.
 */

export type ExportFormat = 'png' | 'svg' | 'jpeg' | 'pdf' | 'kul';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  doc?: KulDocument;
  /** Элемент холста (JointJS paper viewport). */
  element?: HTMLElement | null;
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function exportCanvas(options: ExportOptions): Promise<void> {
  const { format, filename, doc, element } = options;

  if (format === 'kul') {
    if (!doc) throw new Error('Нет документа для экспорта KUL');
    const blob = new Blob([serializeDoc(doc)], { type: 'application/json' });
    download(blob, kulFilename(filename));
    return;
  }

  if (!element) throw new Error('Холст недоступен');

  if (format === 'pdf') {
    // PDF — рендерим PNG и отправляем на печать (браузерный диалог).
    const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2, cacheBust: true });
    const win = window.open('', '_blank');
    if (!win) throw new Error('Блокировка всплывающего окна — разрешите всплывающие окна');
    win.document.write(
      `<html><head><title>${filename}</title><style>body{margin:0}img{width:100%}</style></head><body><img src="${dataUrl}" onload="setTimeout(()=>window.print(),300)"/></body></html>`,
    );
    win.document.close();
    return;
  }

  const opts = { backgroundColor: '#ffffff', pixelRatio: format === 'png' ? 2 : 1, cacheBust: true };
  if (format === 'png') {
    const dataUrl = await toPng(element, opts);
    download(await (await fetch(dataUrl)).blob(), `${filename}.png`);
  } else if (format === 'jpeg') {
    const dataUrl = await toJpeg(element, { ...opts, quality: 0.92 });
    download(await (await fetch(dataUrl)).blob(), `${filename}.jpg`);
  } else {
    const dataUrl = await toSvg(element, opts);
    download(await (await fetch(dataUrl)).blob(), `${filename}.svg`);
  }
}
