import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, CATEGORIES_IN, CATEGORIES_OUT, Debt, FEE_CATEGORY, DebtKind, Transfer, Tx, TxType } from '../types';
import { uid } from '../utils/format';
import { DEFAULT_ACCOUNTS, normalizeStored, Snapshot } from '../utils/backup';
import { CatSplash } from '../components/Splash';

const KEY = 'mymeowney:v1';
const mapBudgetKey = (b: Record<string, number>, from: string, to: string | null) => {
  if (!(from in b)) return b;
  const { [from]: v, ...rest } = b;
  return to ? { ...rest, [to]: v } : rest;
};

type NewDebt = { kind: DebtKind; party: string; amount: number; date: string; dueDate?: string; accountId?: string };
type NewPayment = { amount: number; date: string; accountId?: string };

type Ctx = {
  accounts: Account[]; txs: Tx[]; debts: Debt[]; transfers: Transfer[];
  budgets: Record<string, number>;
  setBudgets: (b: Record<string, number>) => void;
  monthBudgets: Record<string, Record<string, number>>;
  setMonthBudgets: (month: string, b: Record<string, number> | null) => void;
  budgetsFor: (month: string) => Record<string, number>;
  categories: { in: string[]; out: string[] };
  addCategory: (kind: TxType, name: string) => boolean;
  renameCategory: (kind: TxType, oldName: string, newName: string) => boolean;
  deleteCategory: (kind: TxType, name: string) => void;
  addTx: (t: Omit<Tx, 'id'>) => void;
  deleteTx: (id: string) => void;
  updateTx: (id: string, t: Omit<Tx, 'id'>) => void;
  addTransfer: (t: Omit<Transfer, 'id'>) => void;
  updateTransfer: (id: string, t: Omit<Transfer, 'id'>) => void;
  deleteTransfer: (id: string) => void;
  addAccount: (a: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, patch: Partial<Omit<Account, 'id'>>) => void;
  deleteAccount: (id: string) => boolean;
  addDebt: (d: NewDebt) => void;
  addPayment: (debtId: string, p: NewPayment) => void;
  deletePayment: (debtId: string, paymentId: string) => void;
  deleteDebt: (id: string) => void;
  exportData: () => Snapshot;
  restoreData: (s: Snapshot) => void;
};

const DataCtx = createContext<Ctx | null>(null);
export const useData = () => {
  const c = useContext(DataCtx);
  if (!c) throw new Error('useData harus di dalam DataProvider');
  return c;
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [monthBudgets, setMonthBudgetsState] = useState<Record<string, Record<string, number>>>({});
  const [categories, setCategories] = useState<{ in: string[]; out: string[] }>({ in: CATEGORIES_IN, out: CATEGORIES_OUT });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const n = normalizeStored(JSON.parse(raw));
          setAccounts(n.accounts);
          setTxs(n.txs);
          setDebts(n.debts);
          setTransfers(n.transfers);
          setBudgets(n.budgets);
          setMonthBudgetsState(n.monthBudgets);
          setCategories(n.categories);
        }
      } catch (e) { console.warn('Gagal memuat data', e); }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify({ accounts, txs, debts, transfers, budgets, monthBudgets, categories })).catch(() => {});
  }, [accounts, txs, debts, transfers, budgets, monthBudgets, categories, loaded]);

  const move = (accountId: string, delta: number) =>
    setAccounts((p) => p.map((a) => (a.id === accountId ? { ...a, balance: a.balance + delta } : a)));

  const moveTransfer = (t: Transfer, dir: 1 | -1) =>
    setAccounts((p) => p.map((a) => {
      if (a.id === t.fromId) return { ...a, balance: a.balance - dir * t.amount };
      if (a.id === t.toId) return { ...a, balance: a.balance + dir * t.amount };
      return a;
    }));

  const value: Ctx = {
    accounts, txs, debts, transfers, budgets, setBudgets, categories, monthBudgets,
    exportData: () => ({ accounts, txs, debts, transfers, budgets, monthBudgets, categories }),
    restoreData: (s) => {
      setAccounts(s.accounts);
      setTxs(s.txs);
      setDebts(s.debts);
      setTransfers(s.transfers);
      setBudgets(s.budgets);
      setMonthBudgetsState(s.monthBudgets);
      setCategories(s.categories);
    },
    budgetsFor: (m) => monthBudgets[m] ?? budgets,
    setMonthBudgets: (m, b) => setMonthBudgetsState((p) => {
      if (!b) { const { [m]: _removed, ...rest } = p; return rest; }
      return { ...p, [m]: b };
    }),
    addCategory: (kind, name) => {
      const n = name.trim();
      if (!n || categories[kind].includes(n)) return false;
      setCategories((p) => ({ ...p, [kind]: [...p[kind], n] }));
      return true;
    },
    renameCategory: (kind, oldName, newName) => {
      const n = newName.trim();
      if (!n) return false;
      if (n !== oldName && categories[kind].includes(n)) return false;
      setCategories((p) => ({ ...p, [kind]: p[kind].map((c) => (c === oldName ? n : c)) }));
      setTxs((p) => p.map((t) => (t.type === kind && !t.debtId && t.category === oldName ? { ...t, category: n } : t)));
      if (kind === 'out') {
        setBudgets((p) => {
          if (!(oldName in p)) return p;
          const { [oldName]: v, ...rest } = p;
          return { ...rest, [n]: v };
        });
        setMonthBudgetsState((p) => Object.fromEntries(Object.entries(p).map(([m, b]) => [m, mapBudgetKey(b, oldName, n)])));
      }
      return true;
    },
    deleteCategory: (kind, name) => {
      setCategories((p) => ({ ...p, [kind]: p[kind].filter((c) => c !== name) }));
      if (kind === 'out') {
        setBudgets((p) => {
          const { [name]: _removed, ...rest } = p;
          return rest;
        });
        setMonthBudgetsState((p) => Object.fromEntries(Object.entries(p).map(([m, b]) => [m, mapBudgetKey(b, name, null)])));
      }
    },
    addTx: (t) => {
      setTxs((p) => [{ ...t, id: uid() }, ...p]);
      move(t.accountId, t.type === 'in' ? t.amount : -t.amount);
    },
    deleteTx: (id) => {
      const t = txs.find((x) => x.id === id);
      if (!t) return;
      setTxs((p) => p.filter((x) => x.id !== id));
      move(t.accountId, t.type === 'in' ? -t.amount : t.amount);
    },
    updateTx: (id, t) => {
      const old = txs.find((x) => x.id === id);
      if (!old) return;
      setTxs((p) => p.map((x) => (x.id === id ? { ...t, id, debtId: old.debtId, transferId: old.transferId } : x)));
      setAccounts((p) => p.map((a) => {
        let b = a.balance;
        if (a.id === old.accountId) b -= old.type === 'in' ? old.amount : -old.amount;
        if (a.id === t.accountId) b += t.type === 'in' ? t.amount : -t.amount;
        return b === a.balance ? a : { ...a, balance: b };
      }));
    },
    addTransfer: (t) => {
      const full: Transfer = { ...t, id: uid() };
      setTransfers((p) => [full, ...p]);
      moveTransfer(full, 1);
      if (full.fee && full.fee > 0) {
        const to = accounts.find((a) => a.id === full.toId);
        const feeTx: Tx = {
          id: uid(), type: 'out', amount: full.fee, category: FEE_CATEGORY,
          accountId: full.fromId, date: full.date, note: `Admin transfer${to ? ` ke ${to.name}` : ''}`, transferId: full.id,
        };
        setTxs((p) => [feeTx, ...p]);
        move(full.fromId, -full.fee);
      }
    },
    deleteTransfer: (id) => {
      const t = transfers.find((x) => x.id === id);
      if (!t) return;
      setTransfers((p) => p.filter((x) => x.id !== id));
      moveTransfer(t, -1);
      const linked = txs.filter((x) => x.transferId === id);
      if (linked.length) {
        setTxs((p) => p.filter((x) => x.transferId !== id));
        linked.forEach((x) => move(x.accountId, x.type === 'in' ? -x.amount : x.amount));
      }
    },
    updateTransfer: (id, t) => {
      const old = transfers.find((x) => x.id === id);
      if (!old) return;
      const linked = txs.filter((x) => x.transferId === id);
      // 1) batalkan efek lama
      moveTransfer(old, -1);
      linked.forEach((x) => move(x.accountId, x.type === 'in' ? -x.amount : x.amount));
      // 2) terapkan data baru
      const next: Transfer = { ...t, id };
      moveTransfer(next, 1);
      let feeTx: Tx | undefined;
      if (next.fee && next.fee > 0) {
        const to = accounts.find((a) => a.id === next.toId);
        feeTx = {
          id: linked[0]?.id ?? uid(), type: 'out', amount: next.fee, category: FEE_CATEGORY,
          accountId: next.fromId, date: next.date, note: `Admin transfer${to ? ` ke ${to.name}` : ''}`, transferId: id,
        };
        move(next.fromId, -next.fee);
      }
      setTransfers((p) => p.map((x) => (x.id === id ? next : x)));
      setTxs((p) => {
        const rest = p.filter((x) => x.transferId !== id);
        return feeTx ? [feeTx, ...rest] : rest;
      });
    },
    addAccount: (a) => setAccounts((p) => [...p, { ...a, id: uid() }]),
    updateAccount: (id, patch) => setAccounts((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    deleteAccount: (id) => {
      if (txs.some((t) => t.accountId === id) || transfers.some((t) => t.fromId === id || t.toId === id)) return false;
      setAccounts((p) => p.filter((a) => a.id !== id));
      return true;
    },

    // Hutang: uang pinjaman MASUK ke akun. Piutang: uang dipinjamkan KELUAR dari akun.
    addDebt: (d) => {
      const id = uid();
      const isHutang = d.kind === 'hutang';
      setDebts((p) => [{ id, kind: d.kind, party: d.party, amount: d.amount, date: d.date, dueDate: d.dueDate, payments: [] }, ...p]);
      if (d.accountId) {
        const tx: Tx = {
          id: uid(), type: isHutang ? 'in' : 'out', amount: d.amount,
          category: isHutang ? '🤝 Pinjaman Diterima' : '🤝 Pinjaman Diberikan',
          accountId: d.accountId, date: d.date, note: d.party, debtId: id,
        };
        setTxs((p) => [tx, ...p]);
        move(d.accountId, isHutang ? d.amount : -d.amount);
      }
    },

    // Bayar hutang: uang KELUAR dari akun. Terima piutang: uang MASUK ke akun.
    addPayment: (debtId, pay) => {
      const d = debts.find((x) => x.id === debtId);
      if (!d) return;
      const isHutang = d.kind === 'hutang';
      let txId: string | undefined;
      if (pay.accountId) {
        txId = uid();
        const tx: Tx = {
          id: txId, type: isHutang ? 'out' : 'in', amount: pay.amount,
          category: isHutang ? '🤝 Bayar Hutang' : '🤝 Terima Piutang',
          accountId: pay.accountId, date: pay.date, note: d.party, debtId,
        };
        setTxs((p) => [tx, ...p]);
        move(pay.accountId, isHutang ? -pay.amount : pay.amount);
      }
      setDebts((p) => p.map((x) => (x.id === debtId
        ? { ...x, payments: [...x.payments, { id: uid(), amount: pay.amount, date: pay.date, accountId: pay.accountId ?? '', txId }] }
        : x)));
    },
    deletePayment: (debtId, paymentId) => {
      const d = debts.find((x) => x.id === debtId);
      const pay = d?.payments.find((p) => p.id === paymentId);
      if (!d || !pay) return;
      const tx = pay.txId ? txs.find((t) => t.id === pay.txId) : undefined;
      if (tx) {
        setTxs((p) => p.filter((t) => t.id !== tx.id));
        move(tx.accountId, tx.type === 'in' ? -tx.amount : tx.amount);
      }
      setDebts((p) => p.map((x) => (x.id === debtId ? { ...x, payments: x.payments.filter((q) => q.id !== paymentId) } : x)));
    },
    deleteDebt: (id) => {
      const linked = txs.filter((t) => t.debtId === id);
      setTxs((p) => p.filter((t) => t.debtId !== id));
      setAccounts((p) => p.map((a) => {
        const delta = linked.filter((t) => t.accountId === a.id).reduce((s, t) => s + (t.type === 'in' ? -t.amount : t.amount), 0);
        return delta ? { ...a, balance: a.balance + delta } : a;
      }));
      setDebts((p) => p.filter((x) => x.id !== id));
    },
  };

  if (!loaded) return <CatSplash />;
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}
