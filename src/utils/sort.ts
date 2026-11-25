// Urut dari terbaru ke terlama: tanggal dulu, lalu urutan pencatatan (id berisi cap waktu).
export const newestFirst = (a: { date: string; id: string }, b: { date: string; id: string }) =>
  a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
