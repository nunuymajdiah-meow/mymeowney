import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cat } from './Cat';
import { colors } from '../constants/theme';

// Layar pembuka di dalam aplikasi (tampil juga di Expo Go).
export function CatSplash() {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -14, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [y]);

  return (
    <LinearGradient colors={[colors.gradA, colors.gradB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ translateY: y }] }}>
        <Cat size={170} mood="joy" coin />
      </Animated.View>
      <Text style={{ marginTop: 18, fontSize: 30, fontWeight: '900', color: colors.text }}>Mymeowney</Text>
      <Text style={{ marginTop: 4, color: colors.sub }}>Catat uangmu, meow~</Text>
    </LinearGradient>
  );
}

export function SplashGate({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1300);
    return () => clearTimeout(t);
  }, []);
  return done ? <>{children}</> : <CatSplash />;
}
