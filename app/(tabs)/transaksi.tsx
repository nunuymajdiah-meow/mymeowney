import React, { useState } from 'react';
import { useTheme } from '../../src/context/ThemeContext';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/constants/theme';
import { useData } from '../../src/context/DataContext';
import { Btn, Card, Chip, Empty, MonthSwitcher, Title, TransferRow, TxRow } from '../../src/components/ui';
import { Transfer, Tx } from '../../src/types';
import { monthKey } from '../../src/utils/format';
import { newestFirst } from '../../src/utils/sort';
import { linkedTxInfo, openTx } from '../../src/utils/openTx';

type Item = { kind: 'tx'; date: string; id: string; tx: Tx } | { kind: 'tf'; date: string; id: string; tf: Transfer };

export default function Transaksi() {
  useTheme();
  const { accounts, txs, transfers, deleteTx, deleteTransfer } = useData();
  const [month, setMonth] = useState(monthKey());
  const [acc, setAcc] = useState<string>('all');

  const items: Item[] = [
    ...txs
      .filter((t) => t.date.startsWith(month) && (acc === 'all' || t.accountId === acc))
      .map((tx): Item => ({ kind: 'tx', date: tx.date, id: tx.id, tx })),
    ...transfers
      .filter((t) => t.date.startsWith(month) && (acc === 'all' || t.fromId === acc || t.toId === acc))
      .map((tf): Item => ({ kind: 'tf', date: tf.date, id: tf.id, tf })),
  ].sort(newestFirst);

  const nameOf = (id: string) => accounts.find((a) => a.id === id)?.name ?? '-';

  const confirmDelete = (title: string, onOk: () => void) =>
    Alert.alert(title, 'Saldo akun akan dikembalikan seperti semula.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: onOk },
    ]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Title text="Transaksi 🧾" sub="Ketuk untuk mengubah, tekan lama untuk menghapus" />
        <MonthSwitcher month={month} onChange={setMonth} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Chip label="Semua akun" active={acc === 'all'} onPress={() => setAcc('all')} />
          {accounts.map((a) => (
            <Chip key={a.id} label={`${a.emoji} ${a.name}`} active={acc === a.id} onPress={() => setAcc(a.id)} />
          ))}
        </View>
        <Btn title="+ Tambah Transaksi" onPress={() => router.push('/tambah-transaksi')} style={{ marginBottom: 10 }} />
        <Btn title="🔁 Transfer Antar Akun" bg={colors.primary} onPress={() => router.push('/transfer')} style={{ marginBottom: 10 }} />
        <Btn title="📤 Ekspor PDF / Excel" bg={colors.primary} onPress={() => router.push({ pathname: '/ekspor', params: { month, acc } })} style={{ marginBottom: 14 }} />
        <Card>
          {items.length === 0 ? <Empty text="Tidak ada transaksi di filter ini." /> : items.map((it) =>
            it.kind === 'tx' ? (
              <TxRow key={it.tx.id} tx={it.tx} accountName={nameOf(it.tx.accountId)}
                onPress={() => openTx(it.tx)}
                onLongPress={() => (it.tx.debtId || it.tx.transferId ? linkedTxInfo(it.tx) : confirmDelete('Hapus transaksi?', () => deleteTx(it.tx.id)))} />
            ) : (
              <TransferRow key={it.tf.id} tf={it.tf} fromName={nameOf(it.tf.fromId)} toName={nameOf(it.tf.toId)}
                sign={acc === 'all' ? '' : it.tf.fromId === acc ? '-' : '+'}
                onPress={() => router.push({ pathname: '/transfer', params: { id: it.tf.id } })}
                onLongPress={() => confirmDelete('Hapus transfer?', () => deleteTransfer(it.tf.id))} />
            )
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
