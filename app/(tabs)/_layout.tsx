import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { Cat } from '../../src/components/Cat';

const icon = (emoji: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
);
const catIcon = ({ focused }: { focused: boolean }) => (
  <View style={{ opacity: focused ? 1 : 0.5 }}><Cat size={30} mood="happy" /></View>
);

export default function TabsLayout() {
  useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.sub,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Beranda', tabBarIcon: catIcon }} />
      <Tabs.Screen name="transaksi" options={{ title: 'Transaksi', tabBarIcon: icon('🧾') }} />
      <Tabs.Screen name="hutang" options={{ title: 'Hutang', tabBarIcon: icon('🤝') }} />
      <Tabs.Screen name="laporan" options={{ title: 'Laporan', tabBarIcon: icon('📊') }} />
      <Tabs.Screen name="akun" options={{ title: 'Akun', tabBarIcon: icon('👛') }} />
    </Tabs>
  );
}
