export type Account = { id: string; name: string; emoji: string; balance: number };
export type TxType = 'in' | 'out';
export type Tx = {
  id: string; type: TxType; amount: number; category: string;
  accountId: string; date: string; note: string; // date: YYYY-MM-DD
  debtId?: string; // terisi jika transaksi dibuat dari Hutang/Piutang
  transferId?: string; // terisi jika ini biaya admin dari sebuah transfer
};
export type DebtKind = 'hutang' | 'piutang';
export type DebtPayment = { id: string; amount: number; date: string; accountId: string; txId?: string };
export type Debt = {
  id: string; kind: DebtKind; party: string; amount: number;
  date: string; dueDate?: string; payments: DebtPayment[];
};
export type Transfer = {
  id: string; fromId: string; toId: string; amount: number; fee?: number; // fee = biaya admin, dipotong dari akun asal
  date: string; note: string; // date: YYYY-MM-DD
};

// Kategori bawaan sistem untuk biaya admin transfer (tidak ada di daftar yang bisa diedit)
export const FEE_CATEGORY = '🏦 Biaya Admin';

export const CATEGORIES_OUT = ['🍜 Makanan', '🚌 Transportasi', '🛍️ Belanja', '🏠 Tagihan', '🎮 Hiburan', '💊 Kesehatan', '📚 Pendidikan', '🐾 Lainnya'];
export const CATEGORIES_IN = ['💼 Gaji', '💰 Bonus', '🎁 Hadiah', '🐾 Lainnya'];
