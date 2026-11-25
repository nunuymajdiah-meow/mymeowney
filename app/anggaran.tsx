import React, { useState } from 'react';
import { useTheme } from '../src/context/ThemeContext';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../src/constants/theme';
import { useData } from '../src/context/DataContext';
import { AmountInput, Btn, Chip, Label, MonthSwitcher } from '../src/components/ui';
import { monthKey, monthLabel } from '../src/utils/format';
import { FEE_CATEGORY } from '../src/types';

type Scope = 'all' | 'month';

export default function Anggaran() {
  useTheme();
  const params = useLocalSearchParams<{ month?: string }>();
  const { budgets, monthBudgets, setBudgets, setMonthBudgets, categories } = useData();

  const startMonth = params.month ?? monthKey();
  const [month, setMonth] = useState(startMonth);
  const [scope, setScope] = useState<Scope>(monthBudgets[startMonth] ? 'month' : 'all');
  const sourceFor = (s: Scope, m: string) => (s === 'month' ? monthBudgets[m] ?? budgets : budgets);
  const [draft, setDraft] = useState<Record<string, number>>({ ...sourceFor(scope, month) });

  const changeScope = (s: Scope) => { setScope(s); setDraft({ ...sourceFor(s, month) }); };
  const changeMonth = (m: string) => { setMonth(m); setDraft({ ...sourceFor(scope, m) }); };

  const hasCustom = !!monthBudgets[month];

  const save = () => {
    const next: Record<string, number> = {};
    Object.entries(draft).forEach(([c, v]) => { if (v > 0) next[c] = v; });
    if (scope === 'month') setMonthBudgets(month, next);
    else setBudgets(next);
    router.back();
  };

  const resetMonth = () =>
    Alert.alert('Kembalikan ke standar?', `${monthLabel(month)} akan memakai anggaran standar lagi.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Kembalikan', onPress: () => { setMonthBudgets(month, null); router.back(); } },
    ]);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Atur Anggaran 🎯</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={{ color: colors.sub, fontSize: 16 }}>Tutup</Text></Pressable>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Chip label="Standar (semua bulan)" active={scope === 'all'} onPress={() => changeScope('all')} />
          <Chip label="Khusus satu bulan" active={scope === 'month'} onPress={() => changeScope('month')} />
        </View>

        {scope === 'month' ? (
          <>
            <MonthSwitcher month={month} onChange={changeMonth} />
            <Text style={{ color: colors.sub }}>
              {hasCustom
                ? `${monthLabel(month)} punya anggaran khusus. Bulan lain tidak terpengaruh.`
                : `Belum ada anggaran khusus. Menyimpan akan membuat anggaran khusus untuk ${monthLabel(month)}, dimulai dari angka standar.`}
            </Text>
          </>
        ) : (
          <Text style={{ color: colors.sub }}>Anggaran standar dipakai di semua bulan yang tidak punya anggaran khusus. Kosongkan angka untuk kategori tanpa batas.</Text>
        )}

        {[...categories.out, FEE_CATEGORY].map((c) => (
          <View key={c}>
            <Label text={c === FEE_CATEGORY ? `${c} (dari transfer)` : c} />
            <AmountInput value={draft[c] ?? 0} onChange={(n) => setDraft((p) => ({ ...p, [c]: n }))} />
          </View>
        ))}

        <Btn title={scope === 'month' ? `Simpan untuk ${monthLabel(month)}` : 'Simpan Anggaran Standar'} onPress={save} style={{ marginTop: 24 }} />
        {scope === 'month' && hasCustom ? <Btn title="Kembalikan ke Standar" bg={colors.sub} onPress={resetMonth} style={{ marginTop: 12 }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
