import React from 'react';
import { useTheme } from '../../src/context/ThemeContext';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/constants/theme';
import { useData } from '../../src/context/DataContext';
import { Bar, Btn, Card, Empty, GradCard, Title, TxRow } from '../../src/components/ui';
import { Cat } from '../../src/components/Cat';
import { monthKey, monthLabel, rupiah } from '../../src/utils/format';
import { remainingOf } from '../../src/utils/debt';
import { newestFirst } from '../../src/utils/sort';
import { openTx } from '../../src/utils/openTx';
import { budgetColor, spentByCategory } from '../../src/utils/budget';

export default function Beranda() {
  useTheme();
  const { accounts, txs, debts, budgetsFor } = useData();
  const mk = monthKey();
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const month = txs.filter((t) => t.date.startsWith(mk));
  const inc = month.filter((t) => t.type === 'in' && !t.debtId).reduce((s, t) => s + t.amount, 0);
  const out = month.filter((t) => t.type === 'out' && !t.debtId).reduce((s, t) => s + t.amount, 0);
  const sumDebt = (k: 'hutang' | 'piutang') => debts.filter((d) => d.kind === k).reduce((s, d) => s + remainingOf(d), 0);
  const recent = [...txs].sort(newestFirst).slice(0, 5);
  const nameOf = (id: string) => accounts.find((a) => a.id === id)?.name ?? '-';
  const spent = spentByCategory(txs, mk);
  const budgets = budgetsFor(mk);
  const budgeted = Object.entries(budgets).filter(([, v]) => v > 0);
  const bTotal = budgeted.reduce((s, [, v]) => s + v, 0);
  const bSpent = budgeted.reduce((s, [c]) => s + (spent[c] ?? 0), 0);
  const warns = budgeted.filter(([c, v]) => (spent[c] ?? 0) >= v * 0.8).slice(0, 3);
  const overBudget = budgeted.some(([c, v]) => (spent[c] ?? 0) > v);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}><Title text="Meow!" sub={overBudget ? 'Ada anggaran yang lewat, hati-hati ya' : 'Yuk catat keuanganmu hari ini'} /></View>
          <Cat size={76} mood={overBudget ? 'sad' : 'happy'} />
        </View>

        <GradCard>
          <Text style={{ color: colors.sub, fontWeight: '700' }}>Total Saldo</Text>
          <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text, marginVertical: 4 }}>{rupiah(total)}</Text>
          <Text style={{ color: colors.sub }}>{accounts.length} akun • {monthLabel(mk)}</Text>
        </GradCard>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={{ flex: 1, backgroundColor: colors.incomeBg, borderColor: colors.incomeBg }}>
            <Text style={{ color: colors.income, fontWeight: '700' }}>⬇ Masuk</Text>
            <Text style={{ fontWeight: '800', color: colors.text, marginTop: 4 }}>{rupiah(inc)}</Text>
          </Card>
          <Card style={{ flex: 1, backgroundColor: colors.expenseBg, borderColor: colors.expenseBg }}>
            <Text style={{ color: colors.expense, fontWeight: '700' }}>⬆ Keluar</Text>
            <Text style={{ fontWeight: '800', color: colors.text, marginTop: 4 }}>{rupiah(out)}</Text>
          </Card>
        </View>

        <Btn title="+ Catat Transaksi" onPress={() => router.push('/tambah-transaksi')} style={{ marginBottom: 14 }} />

        <Card>
          <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 6 }}>Hutang & Piutang (belum lunas)</Text>
          <Text style={{ color: colors.expense }}>Hutang saya: {rupiah(sumDebt('hutang'))}</Text>
          <Text style={{ color: colors.income, marginTop: 2 }}>Piutang saya: {rupiah(sumDebt('piutang'))}</Text>
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: '800', color: colors.text }}>Anggaran Bulan Ini 🎯</Text>
            <Pressable onPress={() => router.push({ pathname: '/anggaran', params: { month: mk } })} hitSlop={10}>
              <Text style={{ color: colors.primaryDark, fontWeight: '700' }}>{budgeted.length ? 'Atur' : 'Buat'}</Text>
            </Pressable>
          </View>
          {budgeted.length === 0 ? (
            <Text style={{ color: colors.sub }}>Belum ada anggaran. Buat batas pengeluaran tiap kategori supaya uangmu aman 😺</Text>
          ) : (
            <>
              <Text style={{ color: colors.sub, marginBottom: 6 }}>Terpakai {rupiah(bSpent)} dari {rupiah(bTotal)}</Text>
              <Bar pct={(bSpent / bTotal) * 100} color={budgetColor((bSpent / bTotal) * 100)} />
              {warns.map(([c, v]) => {
                const sp = spent[c] ?? 0;
                return (
                  <Text key={c} style={{ marginTop: 8, color: sp > v ? colors.expense : colors.primaryDark }}>
                    {sp > v ? '⚠️ Lewat' : '🔔 Hampir habis'}: {c} ({rupiah(sp)} / {rupiah(v)})
                  </Text>
                );
              })}
            </>
          )}
        </Card>

        <Card>
          <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 4 }}>Transaksi Terbaru</Text>
          {recent.length === 0 ? <Empty text="Belum ada transaksi. Meong menunggu catatan pertamamu!" /> :
            recent.map((t) => <TxRow key={t.id} tx={t} accountName={nameOf(t.accountId)} onPress={() => openTx(t)} />)}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
