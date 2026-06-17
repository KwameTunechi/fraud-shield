import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const C = {
  primary:      '#1652F0',
  primaryLight: '#EBF0FE',
  success:      '#00875A',
  successLight: '#E3F5F0',
  danger:       '#DE350B',
  dangerLight:  '#FFEBE6',
  text:         '#0D1421',
  textSub:      '#6B7280',
  textMuted:    '#9CA3AF',
  bg:           '#F5F7FA',
  surface:      '#FFFFFF',
  border:       '#E8ECEF',
};

export default function BiometricScreen({ navigation }) {
  const { loginWithBiometric, skipBiometric } = useAuth();
  const [state,   setState]   = useState('idle'); // 'idle' | 'scanning' | 'success' | 'error'
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loop      = useRef(null);

  function startPulse() {
    loop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    loop.current.start();
  }

  function stopPulse() {
    loop.current?.stop();
    pulseAnim.setValue(1);
  }

  async function handleScan() {
    setState('scanning');
    startPulse();
    try {
      await loginWithBiometric();
      stopPulse();
      setState('success');
    } catch {
      stopPulse();
      setState('error');
    }
  }

  const iconName  = state === 'success' ? 'checkmark-circle' : state === 'error' ? 'close-circle' : 'finger-print';
  const iconColor = state === 'success' ? C.success : state === 'error' ? C.danger : C.primary;
  const ringColor = state === 'success' ? C.successLight : state === 'error' ? C.dangerLight : C.primaryLight;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <View style={styles.body}>
        <Text style={styles.title}>Quick Sign In</Text>
        <Text style={styles.subtitle}>Use biometric authentication to sign in instantly.</Text>

        <TouchableOpacity onPress={state === 'idle' || state === 'error' ? handleScan : undefined} activeOpacity={0.8}>
          <Animated.View style={[styles.ring, { backgroundColor: ringColor, transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name={iconName} size={56} color={iconColor} />
          </Animated.View>
        </TouchableOpacity>

        <Text style={styles.hint}>
          {state === 'idle'     ? 'Tap the icon to begin'              : ''}
          {state === 'scanning' ? 'Scanning…'                          : ''}
          {state === 'success'  ? 'Identity confirmed'                 : ''}
          {state === 'error'    ? 'Not recognised — try again'         : ''}
        </Text>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={skipBiometric ?? (() => navigation.replace('Main'))}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: C.surface },
  body:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 },
  title:    { fontSize: 24, fontWeight: '800', color: C.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: C.textSub, textAlign: 'center', lineHeight: 22, marginTop: -10 },
  ring:     { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  hint:     { fontSize: 14, color: C.textSub, textAlign: 'center', minHeight: 20 },
  skipBtn:  { paddingVertical: 10, paddingHorizontal: 24 },
  skipText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
});
