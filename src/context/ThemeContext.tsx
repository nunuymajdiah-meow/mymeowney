import React, { createContext, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyPalette, colors, DEFAULT_PALETTE_ID, PALETTES } from '../constants/theme';

const KEY = 'mymeowney:theme';
type Ctx = { paletteId: string; setPaletteId: (id: string) => void };

const ThemeCtx = createContext<Ctx>({ paletteId: DEFAULT_PALETTE_ID, setPaletteId: () => {} });
// Panggil useTheme() di tiap layar supaya layar itu ikut digambar ulang saat tema berganti.
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [paletteId, setId] = useState(DEFAULT_PALETTE_ID);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        if (saved && PALETTES.some((p) => p.id === saved)) { applyPalette(saved); setId(saved); }
      } catch {}
      setReady(true);
    })();
  }, []);

  const setPaletteId = (id: string) => {
    applyPalette(id);
    setId(id);
    AsyncStorage.setItem(KEY, id).catch(() => {});
  };

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return <ThemeCtx.Provider value={{ paletteId, setPaletteId }}>{children}</ThemeCtx.Provider>;
}
