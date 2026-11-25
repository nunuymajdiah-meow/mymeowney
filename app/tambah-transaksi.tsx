import React, { useEffect, useState } from 'react';
import { useTheme } from '../src/context/ThemeContext';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../src/constants/theme';
import { useData } from '../src/context/DataContext';
import { AmountInput, Btn, Chip, Input, Label } from '../src/components/ui';
import { TxType } from '../src/types';
import { fromDateStr, rupiah, toDateStr } from '../src/utils/format';
import { spentByCategory } from '../src/utils/budget';

export default function TambahTransaksi() {
  useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { accounts, txs, budgetsFor, categories, addTx, updateTx, deleteTx } = useData();
  const existing = id ? txs.find((t) => t.id === id) : undefined;
  const editing = !!existing;

  const [type, setType] = useState<TxType>(existing?.type ?? 'out');
  const [amount, setAmount] = useState(existing?.amount ?? 0);
  const [category, setCategory] = useState(existing?.category ?? categories.out[0] ?? '');
  const [accountId, setAccountId] = useState(existing?.accountId ?? accounts[0]?.id ?? '');
  const [date, setDate] = useState(existing ? fromDateStr(existing.date) : new Date());
  const [note, setNote] = useState(existing?.note ?? '');

  const baseCats = categories[type];
  useEffect(() => {
    // jika kategori terpilih sudah diubah/dihapus lewat "Kelola kategori", pilih yang pertama
    if (!category || (!baseCats.includes(category) && category !== existing?.category)) setCategory(baseCats[0] ?? '');
  }, [categories]);
  const cats = existing && existing.type === type && !baseCats.includes(existing.category) ? [existing.category, ...baseCats] : baseCats;
  const switchType = (t: TxType) => {
    setType(t);
    const list = categories[t];
    if (!list.includes(category)) setCategory(list[0] ?? '');
  };

  const save = () => {
    if (amount <= 0) return Alert.alert('Oops 🙀', 'Nominal harus lebih dari 0.');
    if (!accountId) return Alert.alert('Oops 🙀', 'Tambah akun dulu di tab Akun.');
    if (!category) return Alert.alert('Oops 🙀', 'Pilih atau tambah kategori dulu (Kelola kategori).');
    const data = { type, amount, category, accountId, date: toDateStr(date), note: note.trim() };
    if (existing) updateTx(existing.id, data);
    else addTx(data);
    router.back();
    const limit = type === 'out' ? budgetsFor(data.date.slice(0, 7))[category] : 0;
    if (limit) {
      const spent = spentByCategory(txs.filter((t) => t.id !== existing?.id), data.date.slice(0, 7))[category] ?? 0;
      const total = spent + amount;
      if (total > limit) Alert.alert('Anggaran terlampaui 🙀', `${category} bulan ini jadi ${rupiah(total)} dari anggaran ${rupiah(limit)}.`);
      else if (total >= limit * 0.8) Alert.alert('Anggaran hampir habis 🔔', `${category} bulan ini ${rupiah(total)} dari anggaran ${rupiah(limit)}.`);
    }
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert('Hapus transaksi?', 'Saldo akun akan dikembalikan seperti semula.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => { deleteTx(existing.id); router.back(); } },
    ]);
  };

  const isIn = type === 'in';
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{editing ? 'Ubah Transaksi ✏️' : 'Catat Transaksi 😸'}</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={{ color: colors.sub, fontSize: 16 }}>Tutup</Text></Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable onPress={() => switchType('in')} style={{ flex: 1, padding: 14, borderRadius: 16, alignItems: 'center', backgroundColor: isIn ? colors.income : colors.incomeBg }}>
            <Text style={{ fontWeight: '800', color: isIn ? '#fff' : colors.income }}>⬇ Masuk</Text>
          </Pressable>
          <Pressable onPress={() => switchType('out')} style={{ flex: 1, padding: 14, borderRadius: 16, alignItems: 'center', backgroundColor: !isIn ? colors.expense : colors.expenseBg }}>
            <Text style={{ fontWeight: '800', color: !isIn ? '#fff' : colors.expense }}>⬆ Keluar</Text>
          </Pressable>
        </View>

        <Label text="Nominal" />
        <AmountInput value={amount} onChange={setAmount} />

        <Label text="Kategori" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cats.map((c) => <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />)}
        </View>

        <Pressable onPress={() => router.push('/kategori')} style={{ alignSelf: 'flex-start' }}>
          <Text style={{ color: colors.primaryDark, fontWeight: '700' }}>✏️ Kelola kategori</Text>
        </Pressable>

        <Label text="Akun" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {accounts.map((a) => <Chip key={a.id} label={`${a.emoji} ${a.name}`} active={accountId === a.id} onPress={() => setAccountId(a.id)} />)}
        </View>

        <Label text="Tanggal" />
        <View style={{ alignItems: 'flex-start' }}>
          <DateTimePicker value={date} mode="date" display="compact" locale="id-ID" onChange={(_, d) => d && setDate(d)} />
        </View>

        <Label text="Catatan (opsional)" />
        <Input value={note} onChangeText={setNote} placeholder="Contoh: makan siang" />

        <Btn title={editing ? 'Simpan Perubahan' : 'Simpan'} onPress={save} bg={isIn ? colors.income : colors.expense} style={{ marginTop: 22 }} />
        {editing ? <Btn title="Hapus Transaksi" bg={colors.sub} onPress={remove} style={{ marginTop: 12 }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
