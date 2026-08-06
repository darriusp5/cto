import * as joint from 'jointjs';

/**
 * Конфигурация JointJS (каркас, этап 1).
 * Настройки холста, сетки и темы будут уточнены на этапах 2–3.
 */

export const JOINT_PAPER_DEFAULTS: Partial<joint.dia.Paper.Options> = {
  gridSize: 5,
  drawGrid: true,
  background: { color: '#ffffff' },
  interactive: { linkMove: false },
  defaultConnectionPoint: { name: 'boundary' },
};

/** А4, портрет, сетка 5 мм, белый фон (раздел 4.2.1). */
export const DEFAULT_SHEET = {
  format: 'A4',
  orientation: 'portrait' as const,
  gridSize: 5,
  background: '#ffffff',
  width: 210,
  height: 297,
};
