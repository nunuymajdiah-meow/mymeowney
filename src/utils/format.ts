const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const pad = (n: number) => String(n).padStart(2, '0');

export const formatDigits = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const rupiah = (n: number) => (n < 0 ? '-' : '') + 'Rp ' + formatDigits(Math.abs(n));
export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromDateStr = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const monthKey = (d: Date = new Date()) => toDateStr(d).slice(0, 7);
export const monthLabel = (k: string) => { const [y, m] = k.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };
export const shiftMonth = (k: string, delta: number) => { const [y, m] = k.split('-').map(Number); return monthKey(new Date(y, m - 1 + delta, 1)); };
export const prettyDate = (s: string) => { const d = fromDateStr(s); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; };
let lastTs = 0;
export const uid = () => {
  const now = Math.max(Date.now(), lastTs + 1); // cap waktu selalu naik, jadi urutan pencatatan terjaga
  lastTs = now;
  return now.toString(36) + Math.random().toString(36).slice(2, 7);
};
