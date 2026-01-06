const TIMEZONE = 'Europe/Kyiv';

export function getYesterdayRange(): [number, number] {
  const now = new Date();
  const kyivDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  
  const yesterday = new Date(kyivDate);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const today = new Date(kyivDate);
  today.setHours(0, 0, 0, 0);
  
  const from = Math.floor(yesterday.getTime() / 1000);
  const to = Math.floor(today.getTime() / 1000);
  
  return [from, to];
}

export function getTodayRange(): [number, number] {
  const now = new Date();
  const kyivDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  
  const today = new Date(kyivDate);
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(kyivDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const from = Math.floor(today.getTime() / 1000);
  const to = Math.floor(tomorrow.getTime() / 1000);
  
  return [from, to];
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const kyivDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }));
  
  const day = String(kyivDate.getDate()).padStart(2, '0');
  const month = String(kyivDate.getMonth() + 1).padStart(2, '0');
  const year = kyivDate.getFullYear();
  
  return `${day}.${month}.${year}`;
}

export function formatAmount(amount: number): string {
  const uah = Math.abs(amount) / 100;
  return uah.toFixed(2);
}

export function formatAmountWithSeparators(amount: number): string {
  const formatted = formatAmount(amount);
  const [integer, decimal] = formatted.split('.');
  const integerWithSeparators = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${integerWithSeparators}.${decimal}`;
}

