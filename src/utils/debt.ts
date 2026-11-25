import { Debt } from '../types';

export const paidOf = (d: Debt) => d.payments.reduce((s, p) => s + p.amount, 0);
export const remainingOf = (d: Debt) => Math.max(0, d.amount - paidOf(d));
export const isPaid = (d: Debt) => remainingOf(d) <= 0;
