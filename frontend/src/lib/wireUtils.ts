import type { DiagramData, DiagramElement, DiagramLink } from '@/types';

/** Точка на холсте (в координатах листа). */
export interface Point { x: number; y: number; }

/**
 * Абсолютная точка клеммы на листе с учётом позиции, размера и поворота
 * элемента (поворот вокруг центра). Используется для отрисовки проводов (4.9).
 */
export function terminalPoint(el: DiagramElement, terminalId: string): Point | null {
  const terminals = Array.isArray(el.terminals) ? el.terminals : [];
  const t = terminals.find((x) => x.id === terminalId);
  if (!t) return null;
  const w = el.width || 0;
  const h = el.height || 0;
  let px = 0;
  let py = 0;
  switch (t.side) {
    case 'left':
      px = 0;
      py = (t.pos / 100) * h;
      break;
    case 'right':
      px = w;
      py = (t.pos / 100) * h;
      break;
    case 'top':
      px = (t.pos / 100) * w;
      py = 0;
      break;
    case 'bottom':
      px = (t.pos / 100) * w;
      py = h;
      break;
    default:
      px = 0;
      py = 0;
  }
  const ax = el.x + px;
  const ay = el.y + py;
  const rot = ((el.rotation ?? 0) % 360) * (Math.PI / 180);
  if (rot === 0) return { x: ax, y: ay };
  const cx = el.x + w / 2;
  const cy = el.y + h / 2;
  const dx = ax - cx;
  const dy = ay - cy;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
}

/** Точки ломаной провода: клемма источника → промежуточные точки → клемма приёмника. */
export function linkPoints(data: DiagramData, link: DiagramLink): Point[] {
  const src = data.elements.find((e) => e.id === link.source);
  const dst = data.elements.find((e) => e.id === link.target);
  const start = src ? terminalPoint(src, link.sourcePort) : null;
  const end = dst ? terminalPoint(dst, link.targetPort) : null;
  const pts: Point[] = [];
  if (start) pts.push(start);
  if (Array.isArray(link.vertices)) pts.push(...link.vertices);
  if (end) pts.push(end);
  return pts;
}

/** SVG path для ломаной провода. */
export function linkPathD(points: Point[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

/** Цвет провода по умолчанию (4.7.3 — N/синий). */
export const DEFAULT_WIRE_COLOR = '#2196f3';

export function wireColor(link: DiagramLink): string {
  return link.style?.stroke ?? DEFAULT_WIRE_COLOR;
}

export function wireDash(lineType?: string): string | undefined {
  switch (lineType) {
    case 'dashed':
      return '6 4';
    case 'dashdot':
      return '10 4 2 4';
    case 'dotdot':
      return '2 4';
    default:
      return undefined;
  }
}

/**
 * Правила соединения (4.9.2): Выход→Вход и Вход→Выход разрешены,
 * Выход→Выход и Вход→Вход — ошибка. Клемма «both» совместима с любой.
 */
export function connectionAllowed(a: { id: string; name: string }, b: { id: string; name: string }): boolean {
  if (a.id === 'both' || b.id === 'both') return true;
  return a.id !== b.id;
}

/** Текст ошибки для toast (4.9.3): «Нельзя соединить Выход с Выходом». */
export function connectionErrorLabel(a: { name: string }, b: { name: string }): string {
  return `Нельзя соединить ${a.name} с ${b.name}`;
}

/** Дефолтная клемма элемента, если она не найдена (подстраховка старых данных). */
export function defaultTerminalId(el: DiagramElement): string {
  const t = Array.isArray(el.terminals) ? el.terminals[0] : undefined;
  return t?.id ?? 'out';
}
