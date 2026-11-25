import type { Account, Transfer, Tx } from '../types';
import { monthLabel } from './format';
import { XS } from './xlsxFiles';
import type { Cell, Sheet } from './xlsxFiles';

export type Row = {
  date: string; id: string; kind: 'in' | 'out' | 'transfer';
  category: string; account: string;
  inAmt: number; outAmt: number; trAmt: number; note: string;
};
export type Report = {
  periodLabel: string; accountLabel: string; generatedAt: string;
  rows: Row[]; txCount: number; trCount: number;
  totalIn: number; totalOut: number; totalTr: number;      // semua baris
  coreIn: number; coreOut: number; debtIn: number; debtOut: number; // ringkasan
  byCategory: [string, number][];
  accounts: { name: string; emoji: string; balance: number }[];
};

const oldestFirst = (a: { date: string; id: string }, b: { date: string; id: string }) =>
  a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const sum = (xs: number[]) => xs.reduce((s, n) => s + n, 0);

export function buildReport(args: {
  txs: Tx[]; transfers: Transfer[]; accounts: Account[]; month: string | null; accId: string;
}): Report {
  const { txs, transfers, accounts, month, accId } = args;
  const name = (id: string) => accounts.find((a) => a.id === id)?.name ?? '-';
  const inRange = (d: string) => !month || d.startsWith(month);

  const ftx = txs.filter((t) => inRange(t.date) && (accId === 'all' || t.accountId === accId));
  const ftf = transfers.filter((t) => inRange(t.date) && (accId === 'all' || t.fromId === accId || t.toId === accId));

  const rows: Row[] = [
    ...ftx.map((t): Row => ({
      date: t.date, id: t.id, kind: t.type, category: t.category, account: name(t.accountId),
      inAmt: t.type === 'in' ? t.amount : 0, outAmt: t.type === 'out' ? t.amount : 0, trAmt: 0, note: t.note,
    })),
    ...ftf.map((t): Row => ({
      date: t.date, id: t.id, kind: 'transfer', category: '🔁 Transfer',
      account: `${name(t.fromId)} → ${name(t.toId)}`, inAmt: 0, outAmt: 0, trAmt: t.amount, note: t.note,
    })),
  ].sort(oldestFirst);

  const core = ftx.filter((t) => !t.debtId);
  const debt = ftx.filter((t) => !!t.debtId);
  const cat: Record<string, number> = {};
  core.filter((t) => t.type === 'out').forEach((t) => { cat[t.category] = (cat[t.category] ?? 0) + t.amount; });

  return {
    periodLabel: month ? monthLabel(month) : 'Semua waktu',
    accountLabel: accId === 'all' ? 'Semua akun' : name(accId),
    generatedAt: new Date().toISOString(),
    rows, txCount: ftx.length, trCount: ftf.length,
    totalIn: sum(rows.map((r) => r.inAmt)), totalOut: sum(rows.map((r) => r.outAmt)), totalTr: sum(rows.map((r) => r.trAmt)),
    coreIn: sum(core.filter((t) => t.type === 'in').map((t) => t.amount)),
    coreOut: sum(core.filter((t) => t.type === 'out').map((t) => t.amount)),
    debtIn: sum(debt.filter((t) => t.type === 'in').map((t) => t.amount)),
    debtOut: sum(debt.filter((t) => t.type === 'out').map((t) => t.amount)),
    byCategory: Object.entries(cat).sort((a, b) => b[1] - a[1]),
    accounts: accounts.map((a) => ({ name: a.name, emoji: a.emoji, balance: a.balance })),
  };
}

// 'YYYY-MM-DD' -> nomor seri tanggal Excel
const serial = (d: string) => {
  const [y, m, dd] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, dd) / 86400000 + 25569;
};

export function reportToSheets(r: Report): Sheet[] {
  const head: Cell[] = ['Tanggal', 'Jenis', 'Kategori', 'Akun', 'Masuk (Rp)', 'Keluar (Rp)', 'Transfer (Rp)', 'Catatan']
    .map((v) => ({ v, s: XS.header }));
  const body: Cell[][] = r.rows.map((x) => [
    { v: serial(x.date), s: XS.date },
    { v: x.kind === 'in' ? 'Masuk' : x.kind === 'out' ? 'Keluar' : 'Transfer' },
    { v: x.category },
    { v: x.account },
    { v: x.inAmt || null, s: XS.num },
    { v: x.outAmt || null, s: XS.num },
    { v: x.trAmt || null, s: XS.num },
    { v: x.note },
  ]);
  const last = body.length + 1;
  const total: Cell[] = [
    { v: 'TOTAL', s: XS.bold }, {}, {}, {},
    { f: `SUM(E2:E${last})`, v: r.totalIn, s: XS.totalNum },
    { f: `SUM(F2:F${last})`, v: r.totalOut, s: XS.totalNum },
    { f: `SUM(G2:G${last})`, v: r.totalTr, s: XS.totalNum },
    {},
  ];
  const trx: Sheet = {
    name: 'Transaksi', freezeTop: true, widths: [12, 10, 22, 26, 16, 16, 16, 34],
    rows: [head, ...body, ...(body.length ? [total] : [])],
  };

  const gen = r.generatedAt.slice(0, 10);
  const sumRows: Cell[][] = [
    [{ v: 'Mymeowney – Ringkasan', s: XS.title }],
    [{ v: 'Periode', s: XS.bold }, { v: r.periodLabel }],
    [{ v: 'Akun', s: XS.bold }, { v: r.accountLabel }],
    [{ v: 'Dibuat', s: XS.bold }, { v: gen }],
    [],
    [{ v: 'Pemasukan (di luar pinjaman)' }, { v: r.coreIn, s: XS.num }],
    [{ v: 'Pengeluaran (di luar pinjaman)' }, { v: r.coreOut, s: XS.num }],
    [{ v: 'Selisih', s: XS.bold }, { f: 'B6-B7', v: r.coreIn - r.coreOut, s: XS.totalNum }],
    [{ v: 'Hutang/piutang masuk' }, { v: r.debtIn, s: XS.num }],
    [{ v: 'Hutang/piutang keluar' }, { v: r.debtOut, s: XS.num }],
    [{ v: 'Transfer antar akun' }, { v: r.totalTr, s: XS.num }],
  ];
  if (r.byCategory.length) {
    sumRows.push([], [{ v: 'Pengeluaran per Kategori', s: XS.header }, { v: 'Jumlah (Rp)', s: XS.header }, { v: 'Persen', s: XS.header }]);
    r.byCategory.forEach(([c, v]) => sumRows.push([{ v: c }, { v, s: XS.num }, { v: r.coreOut > 0 ? v / r.coreOut : 0, s: XS.pct }]));
  }
  sumRows.push([], [{ v: 'Saldo Akun Saat Ini', s: XS.header }, { v: 'Saldo (Rp)', s: XS.header }]);
  r.accounts.forEach((a) => sumRows.push([{ v: `${a.emoji} ${a.name}` }, { v: a.balance, s: XS.num }]));

  return [trx, { name: 'Ringkasan', rows: sumRows, widths: [34, 20, 12] }];
}
