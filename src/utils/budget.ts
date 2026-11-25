import { colors } from '../constants/theme';
import { Tx } from '../types';

// Total pengeluaran per kategori pada satu bulan (tanpa pinjaman/cicilan).
export const spentByCategory = (txs: Tx[], month: string) => {
  const m: Record<string, number> = {};
  txs.forEach((t) => {
    if (t.type === 'out' && !t.debtId && t.date.startsWith(month)) m[t.category] = (m[t.category] ?? 0) + t.amount;
  });
  return m;
};

export const budgetColor = (pct: number) => (pct > 100 ? colors.expense : pct >= 80 ? colors.primaryDark : colors.income);
