/**
 * SMS-шлюз (каркас, этап 1).
 * Реализация — этап 2 (раздел 4.1 спецификации).
 * В dev-режиме код выводится в консоль терминала:
 *   📱 [DEV MODE] SMS-код для +375 29 111-11-11: 123456
 */

export interface SendSmsParams {
  phone: string;
  code: string;
}

export async function sendSms(_params: SendSmsParams): Promise<void> {
  // TODO(этап 2): интеграция со SMS-провайдером (SMS_API_KEY)
  throw new Error('SMS-интеграция будет реализована на этапе 2');
}
