import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, PALETTES } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { Cat } from '../src/components/Cat';

export default function Tema() {
  const { paletteId, setPaletteId } = useTheme();
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Tema Warna 🎨</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={{ color: colors.sub, fontSize: 16 }}>Tutup</Text></Pressable>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Cat size={64} mood="joy" />
          <Text style={{ color: colors.sub, flex: 1, marginLeft: 8 }}>Pilih warna favoritmu. Langsung berubah dan tersimpan di HP.</Text>
        </View>

        {PALETTES.map((p) => {
          const active = p.id === paletteId;
          return (
            <Pressable key={p.id} onPress={() => setPaletteId(p.id)}>
              <View style={{ borderRadius: 20, overflow: 'hidden', marginTop: 14, borderWidth: active ? 3 : 1, borderColor: active ? colors.primaryDark : colors.border, backgroundColor: p.colors.bg }}>
                <LinearGradient colors={[p.colors.gradA, p.colors.gradB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: p.colors.text }}>{p.emoji} {p.name}</Text>
                  {active ? <Text style={{ fontWeight: '800', color: p.colors.text }}>✓ Dipakai</Text> : null}
                </LinearGradient>
                <View style={{ flexDirection: 'row', padding: 12, alignItems: 'center' }}>
                  {[p.colors.primary, p.colors.primaryDark, p.colors.income, p.colors.expense, p.colors.card].map((c, i) => (
                    <View key={i} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c, marginRight: 8, borderWidth: 1, borderColor: p.colors.border }} />
                  ))}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
