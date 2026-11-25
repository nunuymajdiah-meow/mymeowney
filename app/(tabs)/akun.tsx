import React, { useState } from 'react';
import { useTheme } from '../../src/context/ThemeContext';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/constants/theme';
import { useData } from '../../src/context/DataContext';
import { AmountInput, Btn, Card, Input, Label, Title } from '../../src/components/ui';
import { rupiah } from '../../src/utils/format';

type Form = { id?: string; name: string; emoji: string; balance: number };

export default function Akun() {
  useTheme();
  const { accounts, addAccount, updateAccount, deleteAccount } = useData();
  const [form, setForm] = useState<Form | null>(null);

  const save = () => {
    if (!form) return;
    if (!form.name.trim()) return Alert.alert('Oops 🙀', 'Nama akun belum diisi.');
    const emoji = form.emoji.trim() || '👛';
    if (form.id) updateAccount(form.id, { name: form.name.trim(), emoji, balance: form.balance });
    else addAccount({ name: form.name.trim(), emoji, balance: form.balance });
    setForm(null);
  };

  const remove = () => {
    if (!form?.id) return;
    const id = form.id;
    Alert.alert('Hapus akun?', undefined, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: () => {
          if (deleteAccount(id)) setForm(null);
          else Alert.alert('Tidak bisa dihapus', 'Akun ini sudah punya transaksi atau transfer. Hapus dulu catatannya.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Title text="Akun 👛" sub="Ketuk akun untuk mengubah nama / menyesuaikan saldo" />
        {accounts.map((a) => (
          <Pressable key={a.id} onPress={() => setForm({ id: a.id, name: a.name, emoji: a.emoji, balance: a.balance })}>
            <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 32, marginRight: 14 }}>{a.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>{a.name}</Text>
                <Text style={{ color: a.balance < 0 ? colors.expense : colors.text, marginTop: 2 }}>{rupiah(a.balance)}</Text>
              </View>
              <Text style={{ color: colors.primaryDark, fontWeight: '700' }}>Ubah</Text>
            </Card>
          </Pressable>
        ))}
        <Btn title="🔁 Transfer Antar Akun" bg={colors.primary} onPress={() => router.push('/transfer')} style={{ marginBottom: 12 }} />
        <Btn title="📤 Ekspor PDF / Excel" bg={colors.primary} onPress={() => router.push('/ekspor')} style={{ marginBottom: 12 }} />
        <Btn title="💾 Cadangan & Pulihkan" bg={colors.primary} onPress={() => router.push('/cadangan')} style={{ marginBottom: 12 }} />
        <Btn title="🎨 Tema Warna" bg={colors.primary} onPress={() => router.push('/tema')} style={{ marginBottom: 12 }} />
        <Btn title="🏷️ Kelola Kategori" bg={colors.primary} onPress={() => router.push('/kategori')} style={{ marginBottom: 12 }} />
        <Btn title="+ Tambah Akun" onPress={() => setForm({ name: '', emoji: '👛', balance: 0 })} />
      </ScrollView>

      <Modal visible={!!form} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setForm(null)}>
        {form && (
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <ScrollView contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{form.id ? 'Ubah Akun' : 'Akun Baru'}</Text>
                <Pressable onPress={() => setForm(null)} hitSlop={12}><Text style={{ color: colors.sub, fontSize: 16 }}>Tutup</Text></Pressable>
              </View>
              <Label text="Nama akun" />
              <Input value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Contoh: Bank BCA" />
              <Label text="Emoji" />
              <Input value={form.emoji} onChangeText={(t) => setForm({ ...form, emoji: t })} maxLength={4} />
              <Label text={form.id ? 'Saldo saat ini (ubah untuk menyesuaikan)' : 'Saldo awal'} />
              <AmountInput value={form.balance} onChange={(n) => setForm({ ...form, balance: n })} />
              <Btn title="Simpan" onPress={save} style={{ marginTop: 24 }} />
              {form.id ? <Btn title="Hapus Akun" bg={colors.expense} onPress={remove} style={{ marginTop: 12 }} /> : null}
            </ScrollView>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}
