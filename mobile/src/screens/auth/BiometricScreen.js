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
};

// state: 'idle' | 'scanning' | 'success' | 'error'
export default function BiometricScreen() {
  const { loginWithBiometric, skipBiometric, biometricType } = useAuth();
  const [state,    setState]    = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const pulseLoop  = useRef(null);
  const isFace     = biometricType === 'face';

  // Auto-trigger on mount — skip immediately if no biometric hardware enrolled
  useEffect(() => {
    if (!biometricType) { skipBiometric(); return; }
    const t = setTimeout(handleScan, 500);
    return () => clearTimeout(t);
  }, []);

  function startPulse() {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  }

  function stopPulse() {
    pulseLoop.current?.stop();
    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }

  async function handleScan() {
    if (state === 'scanning' || state === 'success') return;
    setErrorMsg('');
    setState('scanning');
    startPulse();
    try {
      await loginWithBiometric();
      stopPulse();
      setState('success');
      // user state is now set — AppNavigator will switch to MainNavigator
    } catch (err) {
      stopPulse();
      setState('error');
      setErrorMsg(err.message ?? 'Biometric not recognised');
    }
  }

  const isIdle    = state === 'idle' || state === 'error';
  const iconName  = state === 'success' ? 'checkmark-circle'
                  : state === 'error'   ? 'close-circle'
                  : isFace              ? 'scan'
                  :                       'finger-print';
  const iconColor = state === 'success' ? C.success
                  : state === 'error'   ? C.danger
                  : C.primary;
  const ringBg    = state === 'success' ? C.successLight
                  : state === 'error'   ? C.dangerLight
                  : C.primaryLight;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <View style={styles.body}>
        {/* Icon + shield badge */}
        <View style={styles.shieldRow}>
          <Ionicons name="shield-checkmark" size={20} color={C.primary} />
          <Text style={styles.shieldLabel}>FraudShield MFA</Text>
        </View>

        <Text style={styles.title}>
          {isFace ? 'Face Recognition' : 'Fingerprint Login'}
        </Text>
        <Text style={styles.subtitle}>
          {state === 'success'
            ? 'Identity confirmed. Welcome!'
            : `Verify your identity with ${isFace ? 'your face' : 'your fingerprint'} to continue.`}
        </Text>

        {/* Pulsing biometric button */}
        <TouchableOpacity
          onPress={isIdle ? handleScan : undefined}
          activeOpacity={0.8}
          disabled={!isIdle}
        >
          <Animated.View style={[styles.ring, { backgroundColor: ringBg, transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name={iconName} size={60} color={iconColor} />
          </Animated.View>
        </TouchableOpacity>

        {/* Status hint */}
        <Text style={[styles.hint, state === 'error' && { color: C.danger }]}>
          {state === 'idle'     ? `Tap to scan your ${isFace ? 'face' : 'fingerprint'}` : ''}
          {state === 'scanning' ? `Scanning${isFace ? ' face' : ' fingerprint'}…`        : ''}
          {state === 'success'  ? 'Identity confirmed'                                   : ''}
          {state === 'error'    ? (errorMsg || 'Not recognised — tap to try again')      : ''}
        </Text>

        {/* Retry button on error */}
        {state === 'error' && (
          <TouchableOpacity style={styles.retryBtn} onPress={handleScan} activeOpacity={0.8}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}

        {/* Skip */}
        {state !== 'success' && (
          <TouchableOpacity style={styles.skipBtn} onPress={skipBiometric} activeOpacity={0.7}>
            <Text style={styles.skipText}>Continue without biometric</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.surface },
  body:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  shieldRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99 },
  shieldLabel:{ fontSize: 12, fontWeight: '700', color: C.primary },
  title:      { fontSize: 26, fontWeight: '800', color: C.text, textAlign: 'center' },
  subtitle:   { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 22, marginTop: -8, paddingHorizontal: 16 },
  ring:       { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  hint:       { fontSize: 14, color: C.textSub, textAlign: 'center', minHeight: 20 },
  retryBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryText:  { fontSize: 14, fontWeight: '700', color: '#fff' },
  skipBtn:    { paddingVertical: 12, paddingHorizontal: 28, marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  skipText:   { fontSize: 14, fontWeight: '600', color: C.textSub },
});
