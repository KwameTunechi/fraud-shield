import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const OTP_LENGTH = 6;
const DEMO_OTP = '123456';

export default function OTPScreen({ navigation, route }) {
  const phone = route?.params?.phone || '24 567 8901';
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputs = useRef([]);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  function handleChange(text, idx) {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  }

  function handleKeyPress(e, idx) {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    if (code !== DEMO_OTP) {
      Alert.alert('Invalid OTP', 'Use the demo code: 123456');
      return;
    }
    navigation.navigate('Biometric');
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.header}>
        <Text style={styles.headerIcon}>📲</Text>
        <Text style={styles.headerTitle}>Verify OTP</Text>
        <Text style={styles.headerSub}>Code sent to +233 {phone}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter 6-digit code</Text>
          <Text style={styles.cardSub}>This is part of your adaptive MFA security layer</Text>

          <View style={styles.otpRow}>
            {otp.map((d, i) => (
              <TextInput
                key={i}
                ref={r => inputs.current[i] = r}
                style={[styles.otpBox, d && styles.otpBoxFilled]}
                value={d}
                onChangeText={t => handleChange(t, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={i === 0}
              />
            ))}
          </View>

          <View style={styles.demoHint}>
            <Text style={styles.demoText}>🧪 Demo code: <Text style={{ fontWeight: '700', color: '#4338ca' }}>123456</Text></Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, otp.join('').length < OTP_LENGTH && { opacity: 0.5 }]}
            onPress={handleVerify}
            disabled={otp.join('').length < OTP_LENGTH || loading}
          >
            <LinearGradient colors={['#4338ca', '#0d9488']} style={styles.btnGrad}>
              <Text style={styles.btnText}>{loading ? 'Verifying…' : 'Verify OTP'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity disabled={countdown > 0} onPress={() => setCountdown(30)}>
            <Text style={[styles.resend, countdown > 0 && { color: '#94a3b8' }]}>
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mfaNote}>
          <Text style={styles.mfaIcon}>🔐</Text>
          <Text style={styles.mfaText}>Adaptive MFA — we only ask for OTP when we detect a new device or unusual activity</Text>
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
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, gap: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  cardSub: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginVertical: 4 },
  otpBox: { width: 46, height: 54, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#0f172a', backgroundColor: '#f8fafc' },
  otpBoxFilled: { borderColor: '#4338ca', backgroundColor: '#eff6ff' },
  demoHint: { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  demoText: { fontSize: 13, color: '#15803d', textAlign: 'center' },
  btn: { borderRadius: 14, overflow: 'hidden' },
  btnGrad: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resend: { textAlign: 'center', color: '#4338ca', fontSize: 14, fontWeight: '600' },
  mfaNote: { flexDirection: 'row', gap: 10, backgroundColor: '#faf5ff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e9d5ff', alignItems: 'flex-start' },
  mfaIcon: { fontSize: 20 },
  mfaText: { flex: 1, fontSize: 13, color: '#7c3aed', lineHeight: 19 },
});
