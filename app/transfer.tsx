import React, { useState } from 'react';
import { useTheme } from '../src/context/ThemeContext';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../src/constants/theme';
import { useData } from '../src/context/DataContext';
import { AmountInput, Btn, Chip, Empty, Input, Label } from '../src/components/ui';
import { fromDateStr, rupiah, toDateStr } from '../src/utils/format';
import { FEE_CATEGORY } from '../src/types';
import { spentByCategory } from '../src/utils/budget';

export default function Transfer() {
  useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { accounts, transfers, txs, budgetsFor, addTransfer, updateTransfer, deleteTransfer } = useData();
  const existing = id ? transfers.find((t) => t.id === id) : undefined;
  const editing = !!existing;

  const [fromId, setFromId] = useState(existing?.fromId ?? accounts[0]?.id ?? '');
  const [toId, setToId] = useState(existing?.toId ?? accounts[1]?.id ?? '');
  const [amount, setAmount] = useState(existing?.amount ?? 0);
  const [fee, setFee] = useState(existing?.fee ?? 0);
  const [date, setDate] = useState(existing ? fromDateStr(existing.date) : new Date());
  const [note, setNote] = useState(existing?.note ?? '');

  const from = accounts.find((a) => a.id === fromId);
  const to = accounts.find((a) => a.id === toId);
  // saat mengubah, uang transfer lama dianggap dikembalikan dulu ke akun asal yang sama
  const available = from ? from.balance + (existing && existing.fromId === fromId ? existing.amount + (existing.fee ?? 0) : 0) : 0;

  const commit = () => {
    const data = { fromId, toId, amount, fee: fee > 0 ? fee : undefined, date: toDateStr(date), note: note.trim() };
    if (existing) updateTransfer(existing.id, data);
    else addTransfer(data);
    router.back();
    const limit = fee > 0 ? budgetsFor(data.date.slice(0, 7))[FEE_CATEGORY] : 0;
    if (limit) {
      const others = txs.filter((t) => !existing || t.transferId !== existing.id);
      const total = (spentByCategory(others, data.date.slice(0, 7))[FEE_CATEGORY] ?? 0) + fee;
      if (total > limit) Alert.alert('Anggaran terlampaui 🙀', `${FEE_CATEGORY} bulan ini jadi ${rupiah(total)} dari anggaran ${rupiah(limit)}.`);
      else if (total >= limit * 0.8) Alert.alert('Anggaran hampir habis 🔔', `${FEE_CATEGORY} bulan ini ${rupiah(total)} dari anggaran ${rupiah(limit)}.`);
    }
  };

  const save = () => {
    if (!fromId || !toId || fromId === toId) return Alert.alert('Oops 🙀', 'Pilih akun asal dan tujuan yang berbeda.');
    if (amount <= 0) return Alert.alert('Oops 🙀', 'Nominal harus lebih dari 0.');
    if (from && amount + fee > available) {
      return Alert.alert('Saldo tidak cukup', `Saldo ${from.name} hanya ${rupiah(available)}, sedangkan yang keluar ${rupiah(amount + fee)}. Tetap lanjutkan?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Lanjutkan', onPress: commit },
      ]);
    }
    commit();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert('Hapus transfer?', 'Saldo kedua akun (dan biaya admin, jika ada) dikembalikan seperti semula.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => { deleteTransfer(existing.id); router.back(); } },
    ]);
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{editing ? 'Ubah Transfer ✏️' : 'Transfer 🔁'}</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={{ color: colors.sub, fontSize: 16 }}>Tutup</Text></Pressable>
        </View>

        {accounts.length < 2 ? (
          <Empty text="Butuh minimal 2 akun untuk transfer. Tambah akun dulu di tab Akun." />
        ) : (
          <>
            <Label text="Dari akun" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {accounts.map((a) => <Chip key={a.id} label={`${a.emoji} ${a.name}`} active={fromId === a.id} onPress={() => setFromId(a.id)} />)}
            </View>
            {from ? <Text style={{ color: colors.sub }}>Saldo: {rupiah(from.balance)}</Text> : null}

            <Pressable onPress={() => { setFromId(toId); setToId(fromId); }} style={{ alignSelf: 'center', marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.yellow }}>
              <Text style={{ fontWeight: '800', color: colors.text }}>⇅ Tukar</Text>
            </Pressable>

            <Label text="Ke akun" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {accounts.map((a) => <Chip key={a.id} label={`${a.emoji} ${a.name}`} active={toId === a.id} onPress={() => setToId(a.id)} />)}
            </View>
            {to ? <Text style={{ color: colors.sub }}>Saldo: {rupiah(to.balance)}</Text> : null}

            <Label text="Nominal" />
            <AmountInput value={amount} onChange={setAmount} />

            <Label text="Biaya admin (opsional)" />
            <AmountInput value={fee} onChange={setFee} />
            {fee > 0 && from ? (
              <Text style={{ color: colors.sub, marginTop: 8 }}>
                Total keluar dari {from.name}: {rupiah(amount + fee)} (biaya admin dicatat sebagai pengeluaran)
              </Text>
            ) : null}

            <Label text="Tanggal" />
            <View style={{ alignItems: 'flex-start' }}>
              <DateTimePicker value={date} mode="date" display="compact" locale="id-ID" onChange={(_, d) => d && setDate(d)} />
            </View>

            <Label text="Catatan (opsional)" />
            <Input value={note} onChangeText={setNote} placeholder="Contoh: tarik tunai" />

            <Btn title={editing ? 'Simpan Perubahan' : 'Transfer'} onPress={save} style={{ marginTop: 22 }} />
            {editing ? <Btn title="Hapus Transfer" bg={colors.expense} onPress={remove} style={{ marginTop: 12 }} /> : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
