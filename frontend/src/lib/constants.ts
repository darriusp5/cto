/** Константы приложения (этапы 1–6). */

export const APP_NAME = 'ekl.by';

export const APP_DESCRIPTION = 'Проектирование монтажных электрических схем';

/** Сессия JWT — 7 дней (см. спецификацию, раздел 4.1.1). */
export const SESSION_TTL_DAYS = 7;

/** Таймаут повторной отправки SMS-кода, мс (60 с). */
export const SMS_RESEND_TIMEOUT_MS = 60_000;

/** Максимум попыток ввода SMS-кода до блокировки (5). */
export const SMS_MAX_ATTEMPTS = 5;

/** Длительность блокировки после исчерпания попыток, мс (5 мин). */
export const SMS_BLOCK_MS = 5 * 60_000;

/** Ограничения названия проекта (раздел 4.2.1). */
export const PROJECT_NAME_MIN_LENGTH = 3;
export const PROJECT_NAME_MAX_LENGTH = 20;

/** Масштабы зума редактора (раздел 4.4.3). */
export const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2] as const;

/** Количество последних проектов на стартовом экране (раздел 4.2.2). */
export const RECENT_PROJECTS_LIMIT = 5;

/** Белорусский телефонный код. */
export const PHONE_COUNTRY_CODE = '+375';

/** Формат листа по умолчанию — A4, портрет, сетка 5 мм (раздел 4.2.1). */
export const DEFAULT_PAGE = {
  format: 'A4',
  width: 210,
  height: 297,
  orientation: 'portrait' as const,
  background: '#ffffff',
  grid: 5,
};

/** Стандартные размеры форматов (мм). */
export const PAGE_FORMATS: Record<string, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
  A2: { w: 420, h: 594 },
  A1: { w: 594, h: 841 },
  A0: { w: 841, h: 1189 },
};

/** Цвета проводов по фазам (раздел 4.7.3). */
export const WIRE_COLORS = [
  { key: 'L1', label: 'Ж (L1)', color: '#ffc107' },
  { key: 'L2', label: 'З (L2)', color: '#4caf50' },
  { key: 'L3', label: 'К (L3)', color: '#f44336' },
  { key: 'N', label: 'N', color: '#2196f3' },
  { key: 'PE', label: 'PE', color: '#ffeb3b' },
] as const;

export const WIRE_LINE_TYPES = [
  { value: 'solid', label: 'Сплошная' },
  { value: 'dashed', label: 'Пунктирная' },
  { value: 'dashdot', label: 'Штрих-пунктирная' },
  { value: 'dotdot', label: 'Точка-пунктир' },
] as const;

export const WIRE_END_TYPES = [
  { value: 'none', label: 'Без' },
  { value: 'arrow', label: 'Стрелка' },
  { value: 'circle', label: 'Точка' },
  { value: 'diamond', label: 'Ромб' },
  { value: 'square', label: 'Квадрат' },
] as const;

/** Слои по умолчанию (раздел 4.11). */
export const DEFAULT_LAYERS = [
  { id: 'layer-main', name: 'Основной', visible: true, locked: false, order: 0 },
  { id: 'layer-wires', name: 'Провода', visible: true, locked: false, order: 1 },
];

/** Режимы трассировки (раздел 4.9.1). */
export type TraceMode = 'none' | 'single' | 'multipoint' | 'bus';

/** Лимит истории undo/redo. */
export const HISTORY_LIMIT = 60;

/** Единицы измерения (раздел 4.4.5). */
export const UNIT_LABELS: Record<string, string> = { mm: 'мм', cm: 'см', in: 'дюймы' };
