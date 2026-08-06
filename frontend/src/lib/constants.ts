/** Константы приложения (каркас, этап 1). */

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
