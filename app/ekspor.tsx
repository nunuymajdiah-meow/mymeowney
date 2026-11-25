import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { colors } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useData } from '../src/context/DataContext';
import { Btn, Card, Chip, Label, MonthSwitcher } from '../src/components/ui';
import { buildReport, reportToSheets } from '../src/utils/report';
import { reportHtml } from '../src/utils/reportHtml';
import { buildXlsx } from '../src/utils/exportXlsx';
import { monthKey, rupiah } from '../src/utils/format';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export default function Ekspor() {
  useTheme();
  const params = useLocalSearchParams<{ month?: string; acc?: string }>();
  const { accounts, txs, transfers } = useData();
  const [scope, setScope] = useState<'month' | 'all'>('month');
  const [month, setMonth] = useState(params.month ?? monthKey());
  const [acc, setAcc] = useState<string>(params.acc && accounts.some((a) => a.id === params.acc) ? params.acc : 'all');
  const [busy, setBusy] = useState<null | 'pdf' | 'xlsx'>(null);

  const report = buildReport({ txs, transfers, accounts, month: scope === 'month' ? month : null, accId: acc });
  const empty = report.rows.length === 0;

  const accSlug = acc === 'all' ? '' : '-' + (accounts.find((a) => a.id === acc)?.name ?? '').replace(/[^A-Za-z0-9]+/g, '-');
  const baseName = `Mymeowney-${scope === 'month' ? month : 'semua'}${accSlug}`.replace(/-+$/, '');

  const share = async (uri: string, mimeType: string, dialogTitle: string, UTI?: string) => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Tidak bisa dibagikan', 'Fitur berbagi file tidak tersedia di perangkat ini.');
      return;
    }
    await Sharing.shareAsync(uri, { mimeType, dialogTitle, UTI });
  };

  const exportPdf = async () => {
    if (empty) { Alert.alert('Tidak ada data', 'Tidak ada transaksi pada filter ini.'); return; }
    setBusy('pdf');
    try {
      const { uri } = await Print.printToFileAsync({
        html: reportHtml(report), width: 595, height: 842,
        margins: { top: 36, bottom: 36, left: 28, right: 28 },
      });
      let finalUri = uri;
      try { // beri nama file yang rapi
        const target = new File(Paths.cache, `${baseName}.pdf`);
        if (target.exists) target.delete();
        await new File(uri).copy(target);
        finalUri = target.uri;
      } catch {}
      await share(finalUri, 'application/pdf', 'Laporan Mymeowney (PDF)', '.pdf');
    } catch (e) {
      Alert.alert('Gagal membuat PDF', String(e));
    } finally { setBusy(null); }
  };

  const exportXlsx = async () => {
    if (empty) { Alert.alert('Tidak ada data', 'Tidak ada transaksi pada filter ini.'); return; }
    setBusy('xlsx');
    try {
      const file = new File(Paths.cache, `${baseName}.xlsx`);
      file.create({ overwrite: true });
      await file.write(buildXlsx(reportToSheets(report)));
      await share(file.uri, XLSX_MIME, 'Laporan Mymeowney (Excel)', 'org.openxmlformats.spreadsheetml.sheet');
    } catch (e) {
      Alert.alert('Gagal membuat file Excel', String(e));
    } finally { setBusy(null); }
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Ekspor Transaksi 📤</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={{ color: colors.sub, fontSize: 16 }}>Tutup</Text></Pressable>
        </View>

        <Label text="Periode" />
        <View style={{ flexDirection: 'row' }}>
          <Chip label="Satu bulan" active={scope === 'month'} onPress={() => setScope('month')} />
          <Chip label="Semua data" active={scope === 'all'} onPress={() => setScope('all')} />
        </View>
        {scope === 'month' ? <MonthSwitcher month={month} onChange={setMonth} /> : null}

        <Label text="Akun" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Chip label="Semua akun" active={acc === 'all'} onPress={() => setAcc('all')} />
          {accounts.map((a) => <Chip key={a.id} label={`${a.emoji} ${a.name}`} active={acc === a.id} onPress={() => setAcc(a.id)} />)}
        </View>

        <Card style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: '800', color: colors.text }}>Yang akan diekspor</Text>
          <Text style={{ color: colors.sub, marginTop: 4 }}>{report.periodLabel} • {report.accountLabel}</Text>
          <Text style={{ color: colors.text, marginTop: 6 }}>{report.txCount} transaksi, {report.trCount} transfer</Text>
          <Text style={{ color: colors.income, marginTop: 4 }}>Pemasukan {rupiah(report.coreIn)}</Text>
          <Text style={{ color: colors.expense, marginTop: 2 }}>Pengeluaran {rupiah(report.coreOut)}</Text>
        </Card>

        <Btn title={busy === 'pdf' ? 'Membuat PDF...' : '📄 Ekspor PDF'} onPress={exportPdf} style={{ marginBottom: 12, opacity: busy || empty ? 0.6 : 1 }} />
        <Btn title={busy === 'xlsx' ? 'Membuat Excel...' : '📊 Ekspor Excel (.xlsx)'} bg={colors.primary} onPress={exportXlsx} style={{ opacity: busy || empty ? 0.6 : 1 }} />

        <Text style={{ color: colors.sub, marginTop: 16 }}>
          Setelah file dibuat, pilih Simpan ke File untuk menyimpannya (misalnya ke iCloud Drive), atau kirim lewat WhatsApp dan email. File Excel bisa dibuka di Excel, Numbers, atau Google Sheets. Pemasukan dan pengeluaran tidak termasuk pinjaman, cicilan hutang/piutang, dan transfer.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
