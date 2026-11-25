import { Account, CATEGORIES_IN, CATEGORIES_OUT, Debt, Transfer, Tx } from '../types';
import { uid } from './format';

export const APP_ID = 'mymeowney';
export const BACKUP_VERSION = 1;

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-cash', name: 'Uang Tunai', emoji: '💵', balance: 0 },
  { id: 'acc-bca', name: 'Bank BCA', emoji: '🏦', balance: 0 },
  { id: 'acc-ewallet', name: 'E-Wallet', emoji: '📱', balance: 0 },
];

export type Snapshot = {
  accounts: Account[]; txs: Tx[]; debts: Debt[]; transfers: Transfer[];
  budgets: Record<string, number>;
  monthBudgets: Record<string, Record<string, number>>;
  categories: { in: string[]; out: string[] };
};

const isStr = (s: any) => typeof s === 'string';
const isNum = (n: any) => typeof n === 'number' && Number.isFinite(n);
const isDate = (s: any) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

const cleanBudget = (b: any): Record<string, number> => {
  const out: Record<string, number> = {};
  if (b && typeof b === 'object' && !Array.isArray(b)) {
    Object.entries(b).forEach(([k, v]) => { if (isNum(v) && (v as number) > 0) out[k] = v as number; });
  }
  return out;
};

// Merapikan data tersimpan / hasil cadangan menjadi bentuk yang dipakai aplikasi
// (termasuk migrasi hutang versi lama: status lunas -> daftar cicilan).
export function normalizeStored(d: any): Snapshot {
  const txs: Tx[] = Array.isArray(d.txs) ? d.txs : [];
  const debts: Debt[] = (Array.isArray(d.debts) ? d.debts : []).map((x: any) => {
    if (Array.isArray(x.payments)) return x;
    const { paid, paidTxId, ...rest } = x;
    const tx = paidTxId ? txs.find((t) => t.id === paidTxId) : undefined;
    const payments = paid
      ? [{ id: uid(), amount: x.amount, date: tx?.date ?? x.date, accountId: tx?.accountId ?? '', txId: tx?.id }]
      : [];
    return { ...rest, payments };
  });

  const monthBudgets: Record<string, Record<string, number>> = {};
  if (d.monthBudgets && typeof d.monthBudgets === 'object' && !Array.isArray(d.monthBudgets)) {
    Object.entries(d.monthBudgets).forEach(([m, b]) => { monthBudgets[m] = cleanBudget(b); });
  }

  const c = d.categories;
  const categories = c && Array.isArray(c.in) && Array.isArray(c.out)
    ? { in: c.in.filter(isStr), out: c.out.filter(isStr) }
    : { in: CATEGORIES_IN, out: CATEGORIES_OUT };

  return {
    accounts: Array.isArray(d.accounts) ? d.accounts : DEFAULT_ACCOUNTS,
    txs: txs.map((t) => {
      const owner = debts.find((x) => x.payments.some((p) => p.txId === t.id));
      return owner && !t.debtId ? { ...t, debtId: owner.id } : t;
    }),
    debts,
    transfers: Array.isArray(d.transfers) ? d.transfers : [],
    budgets: cleanBudget(d.budgets),
    monthBudgets,
    categories,
  };
}

export const makeBackup = (data: Snapshot) => ({
  app: APP_ID, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data,
});

// Isi file diperlakukan sebagai data yang belum tentu benar: diperiksa dulu sebelum dipakai.
// Mengembalikan pesan kesalahan, atau null jika file aman dipulihkan.
export function validateBackup(p: any): string | null {
  if (!p || typeof p !== 'object' || p.app !== APP_ID || !p.data || typeof p.data !== 'object') {
    return 'Isi file ini bukan cadangan Mymeowney.';
  }
  if (isNum(p.version) && p.version > BACKUP_VERSION) {
    return 'Cadangan ini dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasinya dulu.';
  }
  const d = p.data;
  if (!Array.isArray(d.accounts) || !Array.isArray(d.txs)) return 'Data akun atau transaksi tidak ditemukan.';
  for (const k of ['transfers', 'debts']) {
    if (d[k] !== undefined && !Array.isArray(d[k])) return 'Format data tidak sesuai.';
  }

  const ids = new Set<string>();
  for (const a of d.accounts) {
    if (!a || !isStr(a.id) || !isStr(a.name) || !isNum(a.balance)) return 'Ada data akun yang rusak.';
    ids.add(a.id);
  }
  for (const t of d.txs) {
    if (!t || !isStr(t.id) || (t.type !== 'in' && t.type !== 'out') || !isNum(t.amount) || !isStr(t.category) || !isDate(t.date) || !ids.has(t.accountId)) {
      return 'Ada data transaksi yang rusak.';
    }
  }
  for (const t of d.transfers ?? []) {
    if (!t || !isStr(t.id) || !isNum(t.amount) || !isDate(t.date) || !ids.has(t.fromId) || !ids.has(t.toId)) {
      return 'Ada data transfer yang rusak.';
    }
  }
  for (const x of d.debts ?? []) {
    if (!x || !isStr(x.id) || (x.kind !== 'hutang' && x.kind !== 'piutang') || !isStr(x.party) || !isNum(x.amount) || !isDate(x.date)) {
      return 'Ada data hutang/piutang yang rusak.';
    }
    if (x.dueDate !== undefined && !isDate(x.dueDate)) return 'Ada data hutang/piutang yang rusak.';
    if (x.payments !== undefined) {
      if (!Array.isArray(x.payments)) return 'Ada data cicilan yang rusak.';
      for (const q of x.payments) {
        if (!q || !isStr(q.id) || !isNum(q.amount) || !isDate(q.date)) return 'Ada data cicilan yang rusak.';
      }
    }
  }
  return null;
}
