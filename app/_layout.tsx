import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DataProvider } from '../src/context/DataContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { SplashGate } from '../src/components/Splash';
import { colors, PALETTES } from '../src/constants/theme';

function Inner() {
  const { paletteId } = useTheme();
  const dark = PALETTES.find((p) => p.id === paletteId)?.isDark;
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="tambah-transaksi" options={{ presentation: 'modal' }} />
        <Stack.Screen name="transfer" options={{ presentation: 'modal' }} />
        <Stack.Screen name="anggaran" options={{ presentation: 'modal' }} />
        <Stack.Screen name="kategori" options={{ presentation: 'modal' }} />
        <Stack.Screen name="tema" options={{ presentation: 'modal' }} />
        <Stack.Screen name="cadangan" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ekspor" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DataProvider>
        <SplashGate>
          <Inner />
        </SplashGate>
      </DataProvider>
    </ThemeProvider>
  );
}
