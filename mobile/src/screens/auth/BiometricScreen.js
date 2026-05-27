import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';

export default function BiometricScreen({ onAuthSuccess }) {
  const [status, setStatus] = useState('idle'); // idle | scanning | success | failed | unavailable
  const [hasBiometric, setHasBiometric] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(has => {
      LocalAuthentication.isEnrolledAsync().then(enrolled => {
        setHasBiometric(has && enrolled);
      });
    });
  }, []);

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
      ])
    ).start();
  }

  async function handleBiometric() {
    setStatus('scanning');
    startPulse();
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
      });
      if (result.success) {
        setStatus('success');
        setTimeout(() => onAuthSuccess(), 800);
      } else {
        setStatus('failed');
        pulse.stopAnimation();
      }
    } catch {
      if (hasBiometric) {
        setStatus('failed');
      } else {
        setStatus('unavailable');
      }
      pulse.stopAnimation();
    }
  }

  function handleSkip() {
    setConfirmSkip(true);
  }

  const icons = { idle: '👆', scanning: '🔍', success: '✅', failed: '❌', unavailable: '⚠️' };
  const messages = {
    idle: 'Touch the sensor to verify',
    scanning: 'Scanning fingerprint…',
    success: 'Identity verified!',
    failed: 'Verification failed. Try again.',
    unavailable: 'Biometrics not available on this device',
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.header}>
        <Text style={styles.headerIcon}>🔒</Text>
        <Text style={styles.headerTitle}>Biometric Verification</Text>
        <Text style={styles.headerSub}>Final security layer — MFA</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.card}>
          <Animated.View style={[styles.fingerprintCircle, { transform: [{ scale: pulse }] },
            status === 'success' && { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
            status === 'failed' && { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
          ]}>
            <Text style={styles.fingerprintIcon}>{icons[status]}</Text>
          </Animated.View>

          <Text style={styles.message}>{messages[status]}</Text>

          {(status === 'idle' || status === 'failed' || status === 'unavailable') && (
            <TouchableOpacity style={styles.btn} onPress={handleBiometric}>
              <LinearGradient colors={['#4338ca', '#0d9488']} style={styles.btnGrad}>
                <Text style={styles.btnText}>
                  {status === 'unavailable' ? '🔐 Continue without biometrics' : '👆 Authenticate'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {status !== 'success' && status !== 'unavailable' && (
            confirmSkip ? (
              <View style={styles.skipConfirm}>
                <Text style={styles.skipConfirmText}>Skip biometric security?</Text>
                <View style={styles.skipConfirmRow}>
                  <TouchableOpacity onPress={() => setConfirmSkip(false)} style={styles.skipCancelBtn}>
                    <Text style={styles.skipCancelText}>Go back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onAuthSuccess} style={styles.skipConfirmBtn}>
                    <Text style={styles.skipConfirmBtnText}>Yes, skip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={handleSkip}>
                <Text style={styles.skip}>Skip for now</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <View style={styles.layers}>
          <Text style={styles.layersTitle}>Your 3-Layer Security</Text>
          <View style={styles.layerRow}>
            <Text style={styles.layerCheck}>✅</Text>
            <Text style={styles.layerText}>PIN Authentication</Text>
          </View>
          <View style={styles.layerRow}>
            <Text style={styles.layerCheck}>✅</Text>
            <Text style={styles.layerText}>OTP Verification</Text>
          </View>
          <View style={styles.layerRow}>
            <Text style={status === 'success' ? styles.layerCheck : styles.layerPending}>
              {status === 'success' ? '✅' : '⏳'}
            </Text>
            <Text style={styles.layerText}>Biometric Authentication</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 60, paddingBottom: 36, alignItems: 'center', gap: 6 },
  headerIcon: { fontSize: 36 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#a5b4fc' },
  body: { flex: 1, padding: 20, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', gap: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  fingerprintCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#eff6ff', borderWidth: 3, borderColor: '#4338ca', alignItems: 'center', justifyContent: 'center' },
  fingerprintIcon: { fontSize: 52 },
  message: { fontSize: 15, fontWeight: '600', color: '#374151', textAlign: 'center' },
  btn: { borderRadius: 14, overflow: 'hidden', width: '100%' },
  btnGrad: { paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skip: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  skipConfirm: { alignItems: 'center', gap: 10, paddingVertical: 4 },
  skipConfirmText: { fontSize: 13, color: '#64748b', fontWeight: '600', textAlign: 'center' },
  skipConfirmRow: { flexDirection: 'row', gap: 10 },
  skipCancelBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  skipCancelText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  skipConfirmBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  skipConfirmBtnText: { fontSize: 13, color: '#dc2626', fontWeight: '600' },
  layers: { backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  layersTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  layerCheck: { fontSize: 16 },
  layerPending: { fontSize: 16 },
  layerText: { fontSize: 14, color: '#374151', fontWeight: '500' },
});
