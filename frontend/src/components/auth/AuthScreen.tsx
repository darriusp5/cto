import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, sendSmsCode, verifySmsCode } from '@/lib/auth';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/constants';
import { phoneSchema, smsCodeSchema } from '@/lib/validation';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const RESEND_SECONDS = 60;
const OTP_LENGTH = 6;

/** Маска +375 (XX) XXX-XX-XX (раздел 4.1.1 спецификации). */
function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('375')) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  let out = '+375';
  if (digits.length > 0) out += ` (${digits.slice(0, 2)}`;
  if (digits.length >= 2) out += ')';
  if (digits.length > 2) out += ` ${digits.slice(2, 5)}`;
  if (digits.length > 5) out += `-${digits.slice(5, 7)}`;
  if (digits.length > 7) out += `-${digits.slice(7, 9)}`;
  return out;
}

/**
 * Экран входа: телефон + SMS-код (раздел 4.1).
 * Шаг 1 — телефон и «Получить код» (таймер повторной отправки 60 с).
 * Шаг 2 — 6 полей OTP с автопереходом и «Войти».
 */
export function AuthScreen(): React.JSX.Element {
  const setSession = useAuthStore((state) => state.setSession);

  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [code, setCode] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const handleSendCode = useCallback(async () => {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Некорректный телефон');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await sendSmsCode(parsed.data);
      setResendIn(RESEND_SECONDS);
      setStep('code');
      window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) setResendIn(RESEND_SECONDS);
      setError(e instanceof Error ? e.message : 'Не удалось отправить код');
    } finally {
      setSending(false);
    }
  }, [phone]);

  const handleOtpChange = (index: number, value: string): void => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !code[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digits) return;
    e.preventDefault();
    const next = digits.split('');
    while (next.length < OTP_LENGTH) next.push('');
    setCode(next);
    otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = useCallback(async () => {
    const value = code.join('');
    const parsed = smsCodeSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Введите код из SMS');
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const { token, user } = await verifySmsCode(phone, parsed.data);
      setSession(token, user);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 423 || e.status === 400)) {
        // Неверный код / блокировка на 5 минут / истёк — очищаем поля для повтора
        setCode(Array(OTP_LENGTH).fill(''));
        otpRefs.current[0]?.focus();
      }
      setError(e instanceof Error ? e.message : 'Не удалось выполнить вход');
    } finally {
      setVerifying(false);
    }
  }, [code, phone, setSession]);

  const codeComplete = code.join('').length === OTP_LENGTH;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Декоративный фон */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-3xl shadow-lg shadow-cyan-500/25">
            📱
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-slate-400">{APP_DESCRIPTION}</p>
        </div>

        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">🔐 Вход в систему</h2>
          <p className="mt-1 text-sm text-slate-400">Вход по номеру телефона и SMS-коду</p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="auth-phone" className="text-slate-300">
                  Введите номер телефона
                </Label>
                <Input
                  id="auth-phone"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="+375 (29) 123-45-67"
                  inputMode="tel"
                  autoComplete="tel"
                  autoFocus
                  className="h-11 border-white/10 bg-slate-900/60 text-base text-white placeholder:text-slate-500 focus-visible:ring-cyan-400/60"
                />
              </div>
              <Button
                onClick={() => void handleSendCode()}
                disabled={sending}
                className="h-11 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500"
              >
                {sending ? 'Отправка…' : '📨 Получить код'}
              </Button>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Введите код из SMS</Label>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-cyan-400 transition hover:underline"
                >
                  изменить номер
                </button>
              </div>

              <div className="flex justify-between gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    aria-label={`Цифра ${index + 1} кода`}
                    className={cn(
                      'h-12 w-full rounded-lg border border-white/10 bg-slate-900/60 text-center text-lg font-semibold text-white outline-none transition',
                      'focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/40',
                    )}
                  />
                ))}
              </div>

              <div className="text-sm text-slate-400">
                {resendIn > 0 ? (
                  <span>
                    Повторная отправка через <b className="text-slate-200">{resendIn}</b> с
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSendCode()}
                    disabled={sending}
                    className="text-cyan-400 transition hover:underline disabled:opacity-50"
                  >
                    Отправить код повторно
                  </button>
                )}
              </div>

              <Button
                onClick={() => void handleVerify()}
                disabled={verifying || !codeComplete}
                className="h-11 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
              >
                {verifying ? 'Вход…' : '✅ Войти'}
              </Button>
            </div>
          )}

          {import.meta.env.DEV && (
            <div className="mt-5 rounded-lg border border-dashed border-amber-400/40 bg-amber-400/5 px-3 py-2 text-xs text-amber-300">
              🧪 Dev-режим: SMS не отправляется. Код <b>123456</b> выводится в консоль сервера.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
