import React, { useState } from 'react';
import { useTheme } from '../../src/context/ThemeContext';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/constants/theme';
import { useData } from '../../src/context/DataContext';
import { Card, Empty, MonthSwitcher, Title } from '../../src/components/ui';
import { monthKey, monthLabel, rupiah } from '../../src/utils/format';
import { budgetColor } from '../../src/utils/budget';

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={{ height: 10, backgroundColor: colors.border, borderRadius: 999, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: 10, backgroundColor: color, borderRadius: 999 }} />
    </View>
  );
}

export default function Laporan() {
  useTheme();
  const { accounts, txs, transfers, monthBudgets, budgetsFor } = useData();
  const [month, setMonth] = useState(monthKey());
  const budgets = budgetsFor(month);
  const custom = !!monthBudgets[month];

  const mt = txs.filter((t) => t.date.startsWith(month));
  const core = mt.filter((t) => !t.debtId); // tanpa pinjaman & cicilan
  const sum = (list: typeof txs, type: 'in' | 'out') => list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
  const inc = sum(core, 'in');
  const out = sum(core, 'out');
  const max = Math.max(inc, out, 1);

  const byCat: Record<string, number> = {};
  core.filter((t) => t.type === 'out').forEach((t) => { byCat[t.category] = (byCat[t.category] ?? 0) + t.amount; });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const budgeted = Object.entries(budgets).filter(([, v]) => v > 0);
  const bTotal = budgeted.reduce((s, [, v]) => s + v, 0);
  const bSpent = budgeted.reduce((s, [c]) => s + (byCat[c] ?? 0), 0);

  const perAccount = accounts.map((a) => {
    const own = mt.filter((t) => t.accountId === a.id);
    const ownCore = own.filter((t) => !t.debtId);
    const ownDebt = own.filter((t) => !!t.debtId);
    const ain = sum(ownCore, 'in');
    const aout = sum(ownCore, 'out');
    const din = sum(ownDebt, 'in');
    const dout = sum(ownDebt, 'out');
    const tin = transfers.filter((t) => t.date.startsWith(month) && t.toId === a.id).reduce((s, t) => s + t.amount, 0);
    const tout = transfers.filter((t) => t.date.startsWith(month) && t.fromId === a.id).reduce((s, t) => s + t.amount, 0);
    const afterTf = transfers
      .filter((t) => t.date.slice(0, 7) > month)
      .reduce((s, t) => s + (t.toId === a.id ? t.amount : 0) - (t.fromId === a.id ? t.amount : 0), 0);
    const after = txs
      .filter((t) => t.accountId === a.id && t.date.slice(0, 7) > month)
      .reduce((s, t) => s + (t.type === 'in' ? t.amount : -t.amount), 0);
    const end = a.balance - after - afterTf;
    return { a, ain, aout, din, dout, tin, tout, start: end - (ain - aout + din - dout + tin - tout), end };
  });

  const net = inc - out;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Title text="Laporan Bulanan 📊" />
        <MonthSwitcher month={month} onChange={setMonth} />

        <Card>
          <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 10 }}>Pemasukan vs Pengeluaran</Text>
          <Text style={{ color: colors.income, fontWeight: '700' }}>Masuk  {rupiah(inc)}</Text>
          <Bar pct={(inc / max) * 100} color={colors.income} />
          <Text style={{ color: colors.expense, fontWeight: '700', marginTop: 12 }}>Keluar  {rupiah(out)}</Text>
          <Bar pct={(out / max) * 100} color={colors.expense} />
          <Text style={{ marginTop: 12, fontWeight: '800', color: net >= 0 ? colors.income : colors.expense }}>
            Selisih: {net >= 0 ? '+' : ''}{rupiah(net)} {net >= 0 ? '😸' : '😿'}
          </Text>
        </Card>

        <Card>
          <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 10 }}>Pengeluaran per Kategori</Text>
          {cats.length === 0 ? <Empty text="Belum ada pengeluaran bulan ini." /> : cats.map(([c, v]) => (
            <View key={c} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: colors.text }}>{c}</Text>
                <Text style={{ color: colors.sub }}>{rupiah(v)} ({Math.round((v / out) * 100)}%)</Text>
              </View>
              <Bar pct={(v / out) * 100} color={colors.primary} />
            </View>
          ))}
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontWeight: '800', color: colors.text }}>Anggaran {monthLabel(month)}{custom ? ' • khusus' : ''} 🎯</Text>
            <Pressable onPress={() => router.push({ pathname: '/anggaran', params: { month } })} hitSlop={10}>
              <Text style={{ color: colors.primaryDark, fontWeight: '700' }}>Atur</Text>
            </Pressable>
          </View>
          {budgeted.length === 0 ? (
            <Empty text="Belum ada anggaran untuk bulan ini. Ketuk Atur untuk membuat batas pengeluaran tiap kategori." />
          ) : (
            <>
              <Text style={{ color: colors.sub, marginBottom: 6 }}>Terpakai {rupiah(bSpent)} dari {rupiah(bTotal)}</Text>
              <Bar pct={(bSpent / bTotal) * 100} color={budgetColor((bSpent / bTotal) * 100)} />
              {budgeted.map(([c, limit]) => {
                const sp = byCat[c] ?? 0;
                const pct = (sp / limit) * 100;
                const over = sp > limit;
                return (
                  <View key={c} style={{ marginTop: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: colors.text }}>{c}</Text>
                      <Text style={{ color: colors.sub }}>{rupiah(sp)} / {rupiah(limit)}</Text>
                    </View>
                    <Bar pct={pct} color={budgetColor(pct)} />
                    <Text style={{ marginTop: 4, color: over ? colors.expense : colors.sub, fontWeight: over ? '700' : '400' }}>
                      {over ? `Lebih ${rupiah(sp - limit)} ⚠️` : `Sisa ${rupiah(limit - sp)}`}
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </Card>

        <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 8, fontSize: 16 }}>Pergerakan Saldo per Akun</Text>
        {perAccount.map(({ a, ain, aout, din, dout, tin, tout, start, end }) => (
          <Card key={a.id}>
            <Text style={{ fontWeight: '800', color: colors.text, fontSize: 16 }}>{a.emoji} {a.name}</Text>
            <Row l="Saldo awal" v={rupiah(start)} />
            <Row l="Masuk" v={`+${rupiah(ain)}`} c={colors.income} />
            <Row l="Keluar (total pengeluaran)" v={`-${rupiah(aout)}`} c={colors.expense} />
            {din > 0 && <Row l="Hutang/piutang masuk" v={`+${rupiah(din)}`} c={colors.income} />}
            {dout > 0 && <Row l="Hutang/piutang keluar" v={`-${rupiah(dout)}`} c={colors.expense} />}
            {tin > 0 && <Row l="Transfer masuk" v={`+${rupiah(tin)}`} c={colors.income} />}
            {tout > 0 && <Row l="Transfer keluar" v={`-${rupiah(tout)}`} c={colors.expense} />}
            <Row l="Saldo akhir" v={rupiah(end)} bold />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ l, v, c, bold }: { l: string; v: string; c?: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
      <Text style={{ color: colors.sub }}>{l}</Text>
      <Text style={{ color: c ?? colors.text, fontWeight: bold ? '800' : '600' }}>{v}</Text>
    </View>
  );
}
