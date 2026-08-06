import { z } from 'zod';

import {
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_NAME_MIN_LENGTH,
  PHONE_COUNTRY_CODE,
} from './constants';

/**
 * Схемы валидации Zod (каркас, этап 1).
 * Полные схемы для всех форм — на этапе 2.
 */

const phoneRegex = /^\+375\s?\(?\d{2}\)?\s?\d{3}[- ]?\d{2}[- ]?\d{2}$/;

/** Номер телефона в формате +375 (29) 123-45-67 (раздел 4.1.1). */
export const phoneSchema = z
  .string()
  .min(1, 'Введите номер телефона')
  .regex(phoneRegex, 'Формат: +375 (29) 123-45-67');

/** SMS-код — ровно 6 цифр (раздел 4.1.1). */
export const smsCodeSchema = z
  .string()
  .length(6, 'Код состоит из 6 цифр')
  .regex(/^\d{6}$/, 'Код состоит из 6 цифр');

/** Название проекта — 3–20 символов (раздел 4.2.1). */
export const projectNameSchema = z
  .string()
  .trim()
  .min(PROJECT_NAME_MIN_LENGTH, `Минимум ${PROJECT_NAME_MIN_LENGTH} символа`)
  .max(PROJECT_NAME_MAX_LENGTH, `Максимум ${PROJECT_NAME_MAX_LENGTH} символов`);

/** Имя пользователя — 1–100 символов (ограничение backend, PUT /api/users/me). */
export const userNameSchema = z
  .string()
  .trim()
  .min(1, 'Введите имя')
  .max(100, 'Максимум 100 символов');

export type PhoneInput = z.infer<typeof phoneSchema>;
export type SmsCodeInput = z.infer<typeof smsCodeSchema>;
export type ProjectNameInput = z.infer<typeof projectNameSchema>;
export type UserNameInput = z.infer<typeof userNameSchema>;

/** Хелпер для префикса кода страны в поле телефона. */
export function withCountryPrefix(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('375') ? `${PHONE_COUNTRY_CODE} ${digits.slice(3)}` : phone;
}
