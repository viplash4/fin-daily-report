/**
 * Клієнт для роботи з Monobank API
 */

import { getYesterdayRange, getTodayRange } from './utils';

export interface MonobankTransaction {
  id: string;
  time: number;
  description: string;
  mcc: number;
  originalMcc?: number;
  amount: number;
  operationAmount: number;
  currencyCode: number;
  commissionRate: number;
  cashbackAmount?: number;
  balance: number;
  hold?: boolean;
}

const MONO_API_BASE = 'https://api.monobank.ua';

const RETRY_DELAYS = [5000, 15000, 30000];

/**
 * Отримує транзакції з Monobank API з ретраями
 */
export async function getStatement(
  token: string,
  accountId: string,
  from: number,
  to: number
): Promise<MonobankTransaction[]> {
  const url = `${MONO_API_BASE}/personal/statement/${accountId}/${from}/${to}`;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'X-Token': token,
        },
      });
      
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Monobank API: Unauthorized (${response.status}). Перевірте правильність MONO_TOKEN.`
        );
      }
      
      if (response.status === 429) {
        if (attempt < RETRY_DELAYS.length) {
          const delay = RETRY_DELAYS[attempt];
          console.warn(`Rate limit (429). Повторна спроба через ${delay / 1000}с...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        } else {
          throw new Error('Monobank API: Rate limit exceeded. Спробуйте пізніше.');
        }
      }
      
      if (response.status >= 500) {
        if (attempt < 2) {
          const delay = RETRY_DELAYS[attempt] || 5000;
          console.warn(`Server error (${response.status}). Повторна спроба через ${delay / 1000}с...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        } else {
          throw new Error(`Monobank API: Server error (${response.status})`);
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Monobank API: ${response.status} - ${errorText}`);
      }
      
      const transactions = (await response.json()) as MonobankTransaction[];
      return transactions;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (lastError.message.includes('Unauthorized') || lastError.message.includes('403')) {
        throw lastError;
      }
      
      if (attempt === 2) {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error('Monobank API: Невідома помилка');
}

export async function getYesterdayStatement(
  token: string,
  accountId: string
): Promise<MonobankTransaction[]> {
  const [from, to] = getYesterdayRange();
  return getStatement(token, accountId, from, to);
}

export async function getTodayStatement(
  token: string,
  accountId: string
): Promise<MonobankTransaction[]> {
  const [from, to] = getTodayRange();
  return getStatement(token, accountId, from, to);
}

