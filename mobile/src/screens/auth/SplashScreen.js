import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ navigation, static: isStatic }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: false, tension: 50, friction: 7 }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: false }),
    ]).start();
    // Skip auto-navigation when rendered as a static loading screen (no NavigationContainer)
    if (isStatic || !navigation) return;
    const timer = setTimeout(() => navigation.replace('SignIn'), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={['#1e3a8a', '#4338ca', '#0d9488']} style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }], opacity }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🛡️</Text>
        </View>
        <Text style={styles.brand}>FraudShield</Text>
        <Text style={styles.tagline}>AI-Powered Mobile Money Security</Text>
      </Animated.View>
      <View style={styles.badges}>
        <View style={styles.badge}><Text style={styles.badgeText}>🤖 AI Detection</Text></View>
        <View style={styles.badge}><Text style={styles.badgeText}>🔗 Blockchain</Text></View>
        <View style={styles.badge}><Text style={styles.badgeText}>🔒 Biometric MFA</Text></View>
      </View>
      <Text style={styles.powered}>Telecel Cash · Secured by FraudShield</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 40 },
  logoWrap: { alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  logoIcon: { fontSize: 44 },
  brand: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: '#a5b4fc', fontWeight: '500' },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: { color: '#e0e7ff', fontSize: 12, fontWeight: '600' },
  powered: { position: 'absolute', bottom: 40, color: '#818cf8', fontSize: 12 },
});
