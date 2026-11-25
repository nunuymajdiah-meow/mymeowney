import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useData } from '../src/context/DataContext';
import { Btn, Card } from '../src/components/ui';
import { makeBackup, normalizeStored, validateBackup } from '../src/utils/backup';
import { prettyDate, toDateStr } from '../src/utils/format';

const LAST_KEY = 'mymeowney:lastBackup';

export default function Cadangan() {
  useTheme();
  const { accounts, txs, debts, transfers, exportData, restoreData } = useData();
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LAST_KEY).then((v) => setLast(v)).catch(() => {});
  }, []);

  const createBackup = async () => {
    setBusy(true);
    try {
      const file = new File(Paths.cache, `Mymeowney-Cadangan-${toDateStr(new Date())}.json`);
      file.create({ overwrite: true });
      await file.write(JSON.stringify(makeBackup(exportData())));
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Tidak bisa dibagikan', 'Fitur berbagi file tidak tersedia di perangkat ini.');
        return;
      }
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Simpan cadangan Mymeowney' });
      const stamp = new Date().toISOString();
      await AsyncStorage.setItem(LAST_KEY, stamp);
      setLast(stamp);
    } catch (e) {
      Alert.alert('Gagal membuat cadangan', String(e));
    } finally {
      setBusy(false);
    }
  };

  const pickAndRestore = async () => {
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (res.canceled) return;
      const text = await new File(res.assets[0].uri).text();

      let parsed: any;
      try { parsed = JSON.parse(text); } catch { parsed = null; }
      const error = validateBackup(parsed);
      if (error) { Alert.alert('File tidak bisa dipakai', error); return; }

      const snap = normalizeStored(parsed.data);
      const made = typeof parsed.exportedAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(parsed.exportedAt)
        ? `Dibuat ${prettyDate(parsed.exportedAt.slice(0, 10))}. ` : '';
      Alert.alert(
        'Pulihkan data?',
        `${made}Isi cadangan: ${snap.accounts.length} akun, ${snap.txs.length} transaksi, ${snap.transfers.length} transfer, ${snap.debts.length} hutang/piutang.\n\nSemua data di aplikasi sekarang akan DIGANTI. Sebaiknya buat cadangan data saat ini dulu.`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Ganti Data', style: 'destructive', onPress: () => { restoreData(snap); Alert.alert('Berhasil 🎉', 'Data berhasil dipulihkan.'); } },
        ]
      );
    } catch (e) {
      Alert.alert('Gagal memulihkan', String(e));
    } finally {
      setBusy(false);
    }
  };

  const step = (n: string, t: string) => (
    <Text style={{ color: colors.text, marginTop: 6 }}><Text style={{ fontWeight: '800', color: colors.primaryDark }}>{n}  </Text>{t}</Text>
  );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Cadangan Data 💾</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={{ color: colors.sub, fontSize: 16 }}>Tutup</Text></Pressable>
        </View>

        <Card>
          <Text style={{ fontWeight: '800', color: colors.text }}>Data saat ini</Text>
          <Text style={{ color: colors.sub, marginTop: 4 }}>
            {accounts.length} akun • {txs.length} transaksi • {transfers.length} transfer • {debts.length} hutang/piutang
          </Text>
          <Text style={{ color: colors.sub, marginTop: 4 }}>
            {last ? `Cadangan terakhir dibuat: ${prettyDate(toDateStr(new Date(last)))}` : 'Belum pernah membuat cadangan.'}
          </Text>
        </Card>

        <Btn title={busy ? 'Memproses...' : '⬆ Buat Cadangan'} onPress={createBackup} style={{ marginBottom: 12, opacity: busy ? 0.6 : 1 }} />
        <Btn title="⬇ Pulihkan dari File" bg={colors.primary} onPress={pickAndRestore} style={{ marginBottom: 18, opacity: busy ? 0.6 : 1 }} />

        <Card>
          <Text style={{ fontWeight: '800', color: colors.text }}>Simpan ke iCloud Drive ☁️</Text>
          {step('1.', 'Ketuk Buat Cadangan.')}
          {step('2.', 'Di menu yang muncul, pilih "Simpan ke File" (Save to Files).')}
          {step('3.', 'Pilih iCloud Drive, lalu Simpan.')}
          <Text style={{ fontWeight: '800', color: colors.text, marginTop: 14 }}>Memulihkan</Text>
          {step('1.', 'Ketuk Pulihkan dari File.')}
          {step('2.', 'Pilih file cadangan dari iCloud Drive.')}
          <Text style={{ color: colors.sub, marginTop: 14 }}>
            Cadangan berisi seluruh catatan keuanganmu, jadi simpan di tempat yang aman. Data aplikasi ada di dalam Expo Go, jadi buat cadangan secara berkala.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
