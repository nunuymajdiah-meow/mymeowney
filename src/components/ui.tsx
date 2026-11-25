import React from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';
import { Cat } from './Cat';
import { Transfer, Tx } from '../types';
import { formatDigits, monthLabel, prettyDate, rupiah, shiftMonth } from '../utils/format';

// Gaya dibuat ulang tiap render supaya ikut berubah saat tema warna diganti.
const makeStyles = () => StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { color: colors.sub, marginTop: 2 },
  btn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginRight: 8, marginBottom: 8 },
  chipText: { color: colors.text },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12, marginBottom: 14 },
  arrow: { fontSize: 18, color: colors.text },
  monthText: { fontSize: 17, fontWeight: '800', color: colors.text },
  label: { color: colors.sub, fontWeight: '700', marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  txCat: { fontWeight: '700', color: colors.text, fontSize: 15 },
  txMeta: { color: colors.sub, fontSize: 12, marginTop: 2, marginRight: 8 },
});

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const s = makeStyles();
  return <View style={[s.card, style]}>{children}</View>;
}

// Kartu dengan latar gradasi sesuai tema.
export function GradCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient colors={[colors.gradA, colors.gradB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[{ borderRadius: 20, padding: 16, marginBottom: 14 }, style]}>
      {children}
    </LinearGradient>
  );
}

export function Title({ text, sub }: { text: string; sub?: string }) {
  const s = makeStyles();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.title}>{text}</Text>
      {sub ? <Text style={s.sub}>{sub}</Text> : null}
    </View>
  );
}

export function Btn({ title, onPress, bg = colors.primaryDark, style }: { title: string; onPress: () => void; bg?: string; style?: ViewStyle }) {
  const s = makeStyles();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: pressed ? 0.8 : 1 }, style]}>
      <Text style={s.btnText}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const s = makeStyles();
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
      <Text style={[s.chipText, active && { color: '#fff', fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

export function MonthSwitcher({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const s = makeStyles();
  return (
    <LinearGradient colors={[colors.gradA, colors.gradB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.monthRow}>
      <Pressable hitSlop={12} onPress={() => onChange(shiftMonth(month, -1))}><Text style={s.arrow}>◀</Text></Pressable>
      <Text style={s.monthText}>{monthLabel(month)}</Text>
      <Pressable hitSlop={12} onPress={() => onChange(shiftMonth(month, 1))}><Text style={s.arrow}>▶</Text></Pressable>
    </LinearGradient>
  );
}

export function Bar({ pct, color, height = 10 }: { pct: number; color: string; height?: number }) {
  return (
    <View style={{ height, backgroundColor: colors.border, borderRadius: 999, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height, backgroundColor: color, borderRadius: 999 }} />
    </View>
  );
}

export function Label({ text }: { text: string }) {
  const s = makeStyles();
  return <Text style={s.label}>{text}</Text>;
}

export function Input(props: TextInputProps) {
  const s = makeStyles();
  return <TextInput placeholderTextColor={colors.sub} {...props} style={[s.input, props.style]} />;
}

export function AmountInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const s = makeStyles();
  return (
    <View style={[s.input, { flexDirection: 'row', alignItems: 'center' }]}>
      <Text style={{ color: colors.sub, fontWeight: '700', marginRight: 8 }}>Rp</Text>
      <TextInput
        style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.text }}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.sub}
        value={value ? formatDigits(value) : ''}
        onChangeText={(t) => onChange(Number(t.replace(/\D/g, '')) || 0)}
      />
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={{ alignItems: 'center', padding: 20 }}>
      <Cat size={96} mood="sleepy" />
      <Text style={{ color: colors.sub, marginTop: 8, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

export function TxRow({ tx, accountName, onPress, onLongPress }: { tx: Tx; accountName: string; onPress?: () => void; onLongPress?: () => void }) {
  const s = makeStyles();
  const isIn = tx.type === 'in';
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={s.txRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.txCat}>{tx.category}</Text>
        <Text style={s.txMeta} numberOfLines={1}>{accountName} • {prettyDate(tx.date)}{tx.note ? ` • ${tx.note}` : ''}</Text>
      </View>
      <Text style={{ fontWeight: '800', color: isIn ? colors.income : colors.expense }}>
        {isIn ? '+' : '-'}{rupiah(tx.amount)}
      </Text>
    </Pressable>
  );
}

export function TransferRow({ tf, fromName, toName, sign, onPress, onLongPress }: { tf: Transfer; fromName: string; toName: string; sign: '+' | '-' | ''; onPress?: () => void; onLongPress?: () => void }) {
  const s = makeStyles();
  const color = sign === '+' ? colors.income : sign === '-' ? colors.expense : colors.primaryDark;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={s.txRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.txCat}>🔁 Transfer</Text>
        <Text style={s.txMeta} numberOfLines={1}>{fromName} → {toName} • {prettyDate(tf.date)}{tf.fee ? ` • admin ${rupiah(tf.fee)}` : ''}{tf.note ? ` • ${tf.note}` : ''}</Text>
      </View>
      <Text style={{ fontWeight: '800', color }}>{sign}{rupiah(tf.amount)}</Text>
    </Pressable>
  );
}
