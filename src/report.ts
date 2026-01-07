/**
 * Обробка транзакцій та формування звіту
 */

import { MonobankTransaction } from './mono';
import { formatAmountWithSeparators, formatDate, getTodayRange } from './utils';
import mccMap from '../mcc_map.json';

interface CategoryInfo {
  name: string;
  emoji: string;
}

interface CategoryStats {
  category: CategoryInfo;
  total: number; // в копійках
  count: number;
  transactions: MonobankTransaction[];
}

const UNKNOWN_CATEGORY: CategoryInfo = {
  name: 'Інше',
  emoji: '❓',
};

function getCategoryByMcc(mcc: number): CategoryInfo {
  const mccStr = String(mcc);
  const category = (mccMap as Record<string, CategoryInfo>)[mccStr];
  return category || UNKNOWN_CATEGORY;
}

function filterExpenses(transactions: MonobankTransaction[]): MonobankTransaction[] {
  return transactions.filter((tx) => {
    if (tx.amount >= 0) {
      return false;
    }
    
    if (tx.currencyCode !== 980) {
      return false;
    }
    
    return true;
  });
}

function categorizeTransactions(
  transactions: MonobankTransaction[]
): Map<string, CategoryStats> {
  const categories = new Map<string, CategoryStats>();
  
  for (const tx of transactions) {
    const mcc = tx.originalMcc || tx.mcc;
    const category = getCategoryByMcc(mcc);
    const categoryKey = `${category.emoji} ${category.name}`;
    
    if (!categories.has(categoryKey)) {
      categories.set(categoryKey, {
        category,
        total: 0,
        count: 0,
        transactions: [],
      });
    }
    
    const stats = categories.get(categoryKey)!;
    stats.total += Math.abs(tx.amount);
    stats.count += 1;
    stats.transactions.push(tx);
  }
  
  return categories;
}

export function generateReport(transactions: MonobankTransaction[]): string {
  const expenses = filterExpenses(transactions);
  
  const [from] = getTodayRange();
  const dateStr = formatDate(from);
  
  if (expenses.length === 0) {
    return `📅 Витрати за ${dateStr}\n\nСьогодні витрат не було.`;
  }
  
  const categories = categorizeTransactions(expenses);
  
  const sortedCategories = Array.from(categories.values()).sort(
    (a, b) => b.total - a.total
  );
  
  const totalAmount = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const totalCount = expenses.length;
  
  let report = `📅 Витрати за ${dateStr}\n\n`;
  report += `Разом: ${formatAmountWithSeparators(totalAmount)} грн (${totalCount} транзакцій)\n\n`;
  
  for (const stats of sortedCategories) {
    report += `${stats.category.emoji} ${stats.category.name}: ${formatAmountWithSeparators(stats.total)} грн (${stats.count})\n`;
  }
  
  return report;
}

export function getTransactionStats(transactions: MonobankTransaction[]): {
  total: number;
  expenses: number;
  expensesCount: number;
} {
  const expenses = filterExpenses(transactions);
  const totalAmount = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  return {
    total: transactions.length,
    expenses: expenses.length,
    expensesCount: expenses.length,
  };
}

