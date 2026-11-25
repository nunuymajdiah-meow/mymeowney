import React, { useState } from 'react';
import { useTheme } from '../src/context/ThemeContext';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../src/constants/theme';
import { useData } from '../src/context/DataContext';
import { Btn, Card, Chip, Input, Label } from '../src/components/ui';
import { TxType } from '../src/types';

type Form = { old?: string; emoji: string; name: string };

// "🍜 Makanan" -> { emoji: "🍜", name: "Makanan" }
const split = (c: string) => {
  const i = c.indexOf(' ');
  if (i > 0 && c.charCodeAt(0) > 0x2000) return { emoji: c.slice(0, i), name: c.slice(i + 1) };
  return { emoji: '', name: c };
};

export default function Kategori() {
  useTheme();
  const { categories, txs, addCategory, renameCategory, deleteCategory } = useData();
  const [kind, setKind] = useState<TxType>('out');
  const [form, setForm] = useState<Form | null>(null);
  const list = categories[kind];

  const save = () => {
    if (!form) return;
    if (!form.name.trim()) return Alert.alert('Oops 🙀', 'Nama kategori belum diisi.');
    const full = `${form.emoji.trim()} ${form.name.trim()}`.trim();
    const ok = form.old ? renameCategory(kind, form.old, full) : addCategory(kind, full);
    if (!ok) return Alert.alert('Oops 🙀', 'Nama kategori itu sudah ada.');
    setForm(null);
  };

  const remove = () => {
    if (!form?.old) return;
    const old = form.old;
    if (list.length <= 1) return Alert.alert('Tidak bisa dihapus', 'Minimal harus ada satu kategori.');
    const used = txs.filter((t) => t.type === kind && t.category === old).length;
    Alert.alert('Hapus kategori?', used ? `${used} transaksi masih memakai kategori ini dan tetap tampil dengan nama lama.` : undefined, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => { deleteCategory(kind, old); setForm(null); } },
    ]);
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Kategori 🏷️</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={{ color: colors.sub, fontSize: 16 }}>Tutup</Text></Pressable>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <Chip label="⬆ Pengeluaran" active={kind === 'out'} onPress={() => { setKind('out'); setForm(null); }} />
          <Chip label="⬇ Pemasukan" active={kind === 'in'} onPress={() => { setKind('in'); setForm(null); }} />
        </View>

        {form ? (
          <Card>
            <Text style={{ fontWeight: '800', color: colors.text, fontSize: 16 }}>{form.old ? 'Ubah Kategori' : 'Kategori Baru'}</Text>
            <Label text="Emoji (opsional)" />
            <Input value={form.emoji} onChangeText={(t) => setForm({ ...form, emoji: t })} maxLength={4} placeholder="🐟" />
            <Label text="Nama kategori" />
            <Input value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Contoh: Makanan Kucing" />
            {form.old ? <Text style={{ color: colors.sub, marginTop: 10 }}>Mengubah nama ikut mengubah kategori di transaksi lama dan anggaran.</Text> : null}
            <Btn title="Simpan" onPress={save} style={{ marginTop: 18 }} />
            <Btn title="Batal" bg={colors.sub} onPress={() => setForm(null)} style={{ marginTop: 10 }} />
            {form.old ? <Btn title="Hapus Kategori" bg={colors.expense} onPress={remove} style={{ marginTop: 10 }} /> : null}
          </Card>
        ) : (
          <>
            <Text style={{ color: colors.sub, marginBottom: 10 }}>Ketuk kategori untuk mengubah atau menghapus.</Text>
            {list.map((c) => (
              <Pressable key={c} onPress={() => setForm({ old: c, ...split(c) })}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }}>
                  <Text style={{ fontSize: 16, color: colors.text, fontWeight: '600' }}>{c}</Text>
                  <Text style={{ color: colors.primaryDark, fontWeight: '700' }}>Ubah</Text>
                </Card>
              </Pressable>
            ))}
            <Btn title="+ Tambah Kategori" onPress={() => setForm({ emoji: '', name: '' })} style={{ marginTop: 6 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
