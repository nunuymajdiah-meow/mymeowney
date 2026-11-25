import type { Report } from './report';
import { prettyDate, rupiah } from './format';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n: number) => (n ? rupiah(n) : '');

// HTML untuk dijadikan PDF. Teks dari pengguna (catatan, kategori, nama akun) selalu di-escape.
export function reportHtml(r: Report): string {
  const rows = r.rows.map((x) =>
    `<tr><td>${prettyDate(x.date)}</td><td>${esc(x.category)}</td><td>${esc(x.account)}</td>` +
    `<td class="r in">${money(x.inAmt)}</td><td class="r out">${money(x.outAmt)}</td><td class="r">${money(x.trAmt)}</td>` +
    `<td>${esc(x.note)}</td></tr>`).join('');

  const total = r.rows.length
    ? `<tr class="tot"><td colspan="3">TOTAL</td><td class="r">${rupiah(r.totalIn)}</td><td class="r">${rupiah(r.totalOut)}</td><td class="r">${rupiah(r.totalTr)}</td><td></td></tr>`
    : '';

  const cats = r.byCategory.map(([c, v]) =>
    `<tr><td>${esc(c)}</td><td class="r">${rupiah(v)}</td><td class="r">${r.coreOut > 0 ? Math.round((v / r.coreOut) * 100) : 0}%</td></tr>`).join('');

  const accs = r.accounts.map((a) =>
    `<tr><td>${esc(a.emoji)} ${esc(a.name)}</td><td class="r">${rupiah(a.balance)}</td></tr>`).join('');

  const net = r.coreIn - r.coreOut;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#4A3B2F;margin:0;padding:6px;font-size:11px}
h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin:20px 0 4px}
.sub{color:#9A8878;margin-bottom:10px}
.cards{display:flex;gap:8px;margin:12px 0}
.card{flex:1;border-radius:10px;padding:10px}.card b{display:block;font-size:14px;margin-top:3px}
.cin{background:#E3F5EA;color:#2E7D52}.cout{background:#FDE6E4;color:#C0504D}.cnet{background:#FFE9B8;color:#8A5A10}
table{width:100%;border-collapse:collapse;margin-top:6px}
thead{display:table-header-group}tr{page-break-inside:avoid}
th{background:#FFB866;color:#fff;text-align:left;padding:6px;font-size:10px}
td{padding:5px 6px;border-bottom:1px solid #F1E4D3;vertical-align:top}
tr:nth-child(even) td{background:#FFFBF4}
.r{text-align:right;white-space:nowrap}.in{color:#2E7D52}.out{color:#C0504D}
.tot td{font-weight:700;border-top:2px solid #FFB866;background:#FFF3DD}
.foot{margin-top:18px;color:#9A8878;font-size:9px}
</style></head><body>
<h1>🐱 Mymeowney – Laporan Transaksi</h1>
<div class="sub">Periode: ${esc(r.periodLabel)} &nbsp;•&nbsp; Akun: ${esc(r.accountLabel)}</div>
<div class="cards">
<div class="card cin">Pemasukan<b>${rupiah(r.coreIn)}</b></div>
<div class="card cout">Pengeluaran<b>${rupiah(r.coreOut)}</b></div>
<div class="card cnet">Selisih<b>${net >= 0 ? '+' : ''}${rupiah(net)}</b></div>
</div>
<div class="sub">Pemasukan dan pengeluaran di atas tidak termasuk pinjaman, cicilan hutang/piutang, dan transfer antar akun.</div>
<h2>Daftar Transaksi (${r.rows.length})</h2>
<table><thead><tr><th>Tanggal</th><th>Kategori</th><th>Akun</th><th class="r">Masuk</th><th class="r">Keluar</th><th class="r">Transfer</th><th>Catatan</th></tr></thead>
<tbody>${rows || '<tr><td colspan="7">Tidak ada transaksi.</td></tr>'}${total}</tbody></table>
${cats ? `<h2>Pengeluaran per Kategori</h2><table><thead><tr><th>Kategori</th><th class="r">Jumlah</th><th class="r">Persen</th></tr></thead><tbody>${cats}</tbody></table>` : ''}
<h2>Saldo Akun Saat Ini</h2>
<table><thead><tr><th>Akun</th><th class="r">Saldo</th></tr></thead><tbody>${accs}</tbody></table>
<div class="foot">Dibuat dengan Mymeowney pada ${prettyDate(r.generatedAt.slice(0, 10))}</div>
</body></html>`;
}
