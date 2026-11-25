import React, { useState } from 'react';
import { useTheme } from '../../src/context/ThemeContext';
import { Alert, Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../src/constants/theme';
import { useData } from '../../src/context/DataContext';
import { AmountInput, Btn, Card, Chip, Empty, Input, Label, Title } from '../../src/components/ui';
import { Debt, DebtKind } from '../../src/types';
import { isPaid, paidOf, remainingOf } from '../../src/utils/debt';
import { prettyDate, rupiah, toDateStr } from '../../src/utils/format';

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{title}</Text>
      <Pressable onPress={onClose} hitSlop={12}><Text style={{ color: colors.sub, fontSize: 16 }}>Tutup</Text></Pressable>
    </View>
  );
}

export default function Hutang() {
  useTheme();
  const { accounts, debts, addDebt, addPayment, deletePayment, deleteDebt } = useData();
  const [kind, setKind] = useState<DebtKind>('hutang');

  // form catatan baru
  const [open, setOpen] = useState(false);
  const [party, setParty] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date());
  const [hasDue, setHasDue] = useState(false);
  const [due, setDue] = useState(new Date());
  const [acc, setAcc] = useState(accounts[0]?.id ?? '');

  // form bayar / terima cicilan
  const [payId, setPayId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payAcc, setPayAcc] = useState('');
  const [payDate, setPayDate] = useState(new Date());
  const payDebt = debts.find((d) => d.id === payId);

  const isHutang = kind === 'hutang';
  const list = debts.filter((d) => d.kind === kind).sort((a, b) => Number(isPaid(a)) - Number(isPaid(b)));
  const total = list.reduce((s, d) => s + remainingOf(d), 0);
  const today = toDateStr(new Date());

  const saveDebt = () => {
    if (!party.trim() || amount <= 0) return Alert.alert('Oops 🙀', 'Isi nama pihak dan nominal dulu ya.');
    const a = accounts.find((x) => x.id === acc);
    const go = () => {
      addDebt({ kind, party: party.trim(), amount, date: toDateStr(date), dueDate: hasDue ? toDateStr(due) : undefined, accountId: acc || undefined });
      setParty(''); setAmount(0); setHasDue(false); setDate(new Date()); setDue(new Date()); setAcc(accounts[0]?.id ?? '');
      setOpen(false);
    };
    if (kind === 'piutang' && a && amount > a.balance) {
      return Alert.alert('Saldo tidak cukup', `Saldo ${a.name} hanya ${rupiah(a.balance)}. Tetap lanjutkan?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Lanjutkan', onPress: go },
      ]);
    }
    go();
  };

  const openPay = (d: Debt) => {
    setPayId(d.id); setPayAmount(remainingOf(d)); setPayAcc(accounts[0]?.id ?? ''); setPayDate(new Date());
  };

  const savePay = () => {
    if (!payDebt) return;
    const rem = remainingOf(payDebt);
    if (payAmount <= 0) return Alert.alert('Oops 🙀', 'Nominal harus lebih dari 0.');
    if (payAmount > rem) return Alert.alert('Oops 🙀', `Nominal melebihi sisa (${rupiah(rem)}).`);
    const a = accounts.find((x) => x.id === payAcc);
    const go = () => {
      addPayment(payDebt.id, { amount: payAmount, date: toDateStr(payDate), accountId: payAcc || undefined });
      setPayId(null);
    };
    if (payDebt.kind === 'hutang' && a && payAmount > a.balance) {
      return Alert.alert('Saldo tidak cukup', `Saldo ${a.name} hanya ${rupiah(a.balance)}. Tetap lanjutkan?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Lanjutkan', onPress: go },
      ]);
    }
    go();
  };

  const confirmDeleteDebt = (d: Debt) =>
    Alert.alert('Hapus catatan?', 'Semua transaksi terkait (pinjaman dan cicilan) ikut dihapus, dan saldo akun dikembalikan.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteDebt(d.id) },
    ]);

  const confirmDeletePay = (d: Debt, paymentId: string) =>
    Alert.alert('Batalkan cicilan ini?', 'Jika saldo ikut berubah saat itu, saldo akan dikembalikan.', [
      { text: 'Tidak', style: 'cancel' },
      { text: 'Batalkan', style: 'destructive', onPress: () => deletePayment(d.id, paymentId) },
    ]);

  const accChips = (value: string, onChange: (v: string) => void) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {accounts.map((a) => <Chip key={a.id} label={`${a.emoji} ${a.name}`} active={value === a.id} onPress={() => onChange(a.id)} />)}
      <Chip label="Tanpa ubah saldo" active={value === ''} onPress={() => onChange('')} />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Title text="Hutang & Piutang 🤝" sub="Tekan lama catatan untuk menghapus, tekan lama cicilan untuk membatalkan" />
        <View style={{ flexDirection: 'row' }}>
          <Chip label="Hutang (saya berhutang)" active={isHutang} onPress={() => setKind('hutang')} />
          <Chip label="Piutang" active={!isHutang} onPress={() => setKind('piutang')} />
        </View>

        <Card style={{ backgroundColor: isHutang ? colors.expenseBg : colors.incomeBg, borderColor: isHutang ? colors.expenseBg : colors.incomeBg }}>
          <Text style={{ color: colors.sub, fontWeight: '700' }}>{isHutang ? 'Sisa hutang belum lunas' : 'Sisa piutang belum lunas'}</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: isHutang ? colors.expense : colors.income }}>{rupiah(total)}</Text>
        </Card>

        <Btn title={isHutang ? '+ Tambah Hutang' : '+ Tambah Piutang'} onPress={() => setOpen(true)} style={{ marginBottom: 14 }} />

        {list.length === 0 ? <Empty text="Belum ada catatan." /> : list.map((d) => {
          const paid = paidOf(d);
          const rem = remainingOf(d);
          const done = rem <= 0;
          const overdue = !done && !!d.dueDate && d.dueDate < today;
          const pct = Math.min(100, (paid / d.amount) * 100);
          return (
            <Pressable key={d.id} onLongPress={() => confirmDeleteDebt(d)}>
              <Card style={{ opacity: done ? 0.7 : 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>{d.party}</Text>
                  <Text style={{ fontWeight: '800', color: isHutang ? colors.expense : colors.income }}>{rupiah(d.amount)}</Text>
                </View>
                <Text style={{ color: colors.sub, marginTop: 4 }}>Dicatat: {prettyDate(d.date)}</Text>
                {d.dueDate ? <Text style={{ color: overdue ? colors.expense : colors.sub }}>Jatuh tempo: {prettyDate(d.dueDate)}{overdue ? ' ⚠️ lewat' : ''}</Text> : null}

                <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 999, overflow: 'hidden', marginTop: 10 }}>
                  <View style={{ width: `${pct}%`, height: 8, backgroundColor: colors.income, borderRadius: 999 }} />
                </View>
                <Text style={{ color: colors.sub, marginTop: 6 }}>Terbayar {rupiah(paid)} • Sisa {rupiah(rem)}</Text>

                {d.payments.map((p) => (
                  <Pressable key={p.id} onLongPress={() => confirmDeletePay(d, p.id)}>
                    <Text style={{ color: colors.text, marginTop: 4 }}>• {prettyDate(p.date)} — {rupiah(p.amount)}</Text>
                  </Pressable>
                ))}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text style={{ fontWeight: '700', color: done ? colors.income : colors.primaryDark }}>{done ? '✅ Lunas' : '⏳ Belum Lunas'}</Text>
                  {!done && <Btn title={isHutang ? 'Bayar' : 'Terima'} bg={colors.income} onPress={() => openPay(d)} style={{ paddingVertical: 8, paddingHorizontal: 18 }} />}
                </View>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <ScrollView contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
            <Header title={isHutang ? 'Hutang Baru' : 'Piutang Baru'} onClose={() => setOpen(false)} />
            <Label text={isHutang ? 'Berhutang ke siapa?' : 'Siapa yang berhutang?'} />
            <Input value={party} onChangeText={setParty} placeholder="Nama" />
            <Label text="Nominal" />
            <AmountInput value={amount} onChange={setAmount} />
            <Label text={isHutang ? 'Uang pinjaman masuk ke akun' : 'Uang dipinjamkan keluar dari akun'} />
            {accChips(acc, setAcc)}
            <Label text="Tanggal" />
            <View style={{ alignItems: 'flex-start' }}>
              <DateTimePicker value={date} mode="date" display="compact" locale="id-ID" onChange={(_, d) => d && setDate(d)} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>Ada jatuh tempo?</Text>
              <Switch value={hasDue} onValueChange={setHasDue} trackColor={{ true: colors.primary }} />
            </View>
            {hasDue && (
              <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
                <DateTimePicker value={due} mode="date" display="compact" locale="id-ID" onChange={(_, d) => d && setDue(d)} />
              </View>
            )}
            <Btn title="Simpan" onPress={saveDebt} style={{ marginTop: 24 }} />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={!!payDebt} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPayId(null)}>
        {payDebt && (
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <ScrollView contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
              <Header title={payDebt.kind === 'hutang' ? 'Bayar Hutang 💸' : 'Terima Piutang 💰'} onClose={() => setPayId(null)} />
              <Text style={{ color: colors.text, fontWeight: '700' }}>{payDebt.party}</Text>
              <Text style={{ color: colors.sub, marginTop: 2 }}>Total {rupiah(payDebt.amount)} • Sisa {rupiah(remainingOf(payDebt))}</Text>

              <Label text="Nominal (boleh sebagian)" />
              <AmountInput value={payAmount} onChange={setPayAmount} />
              <Pressable onPress={() => setPayAmount(remainingOf(payDebt))} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                <Text style={{ color: colors.primaryDark, fontWeight: '700' }}>Isi dengan sisa ({rupiah(remainingOf(payDebt))})</Text>
              </Pressable>

              <Label text={payDebt.kind === 'hutang' ? 'Dibayar dari akun' : 'Diterima di akun'} />
              {accChips(payAcc, setPayAcc)}

              <Label text="Tanggal" />
              <View style={{ alignItems: 'flex-start' }}>
                <DateTimePicker value={payDate} mode="date" display="compact" locale="id-ID" onChange={(_, d) => d && setPayDate(d)} />
              </View>

              <Btn title="Simpan" bg={colors.income} onPress={savePay} style={{ marginTop: 24 }} />
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}
