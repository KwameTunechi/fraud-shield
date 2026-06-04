import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const PIN_LENGTH = 4;

// Normalise a Ghana number entered without country code.
// Accepts "0244567890", "244567890", "24 456 7890" etc.
function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  const clean  = digits.startsWith('0') ? digits.slice(1) : digits;
  if (clean.length !== 9) return null;
  return '+233' + clean;
}

export default function SignInScreen({ navigation }) {
  const { requestOtp, loginWithPin } = useAuth();
  const [phone,   setPhone]   = useState('');
  const [pin,     setPin]     = useState('');
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState('phone'); // 'phone' | 'pin'

  // ── Step 1: send OTP ──────────────────────────────────────────────────────
  async function handleContinue() {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      Alert.alert('Invalid Number', 'Enter your 9-digit Ghana mobile number (e.g. 244 567 890).');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(normalized);
      navigation.navigate('OTP', { phone: normalized });
    } catch (err) {
      Alert.alert('Could not send OTP', err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: PIN sign-in (returning users) ─────────────────────────────────
  function handlePinDigit(d) { if (pin.length < PIN_LENGTH) setPin(p => p + d); }
  function handlePinDelete() { setPin(p => p.slice(0, -1)); }

  async function handlePinSignIn() {
    if (pin.length < PIN_LENGTH) return;
    const normalized = normalizePhone(phone);
    if (!normalized) return;
    setLoading(true);
    try {
      await loginWithPin(normalized, pin);
      navigation.navigate('Biometric');
    } catch (err) {
      Alert.alert('Invalid PIN', 'The PIN you entered is incorrect.');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.header}>
        <Text style={styles.headerIcon}>🛡️</Text>
        <Text style={styles.headerTitle}>FraudShield</Text>
        <Text style={styles.headerSub}>Sign in to Telecel Cash</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputRow}>
              <View style={styles.prefix}><Text style={styles.prefixText}>🇬🇭 +233</Text></View>
              <TextInput
                style={styles.input}
                placeholder="24 567 8901"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={12}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.6 }]}
              onPress={handleContinue}
              disabled={loading}
            >
              <LinearGradient colors={['#4338ca', '#0d9488']} style={styles.btnGrad}>
                <Text style={styles.btnText}>{loading ? 'Sending OTP…' : 'Get OTP Code'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('pin')}>
              <Text style={styles.link}>Sign in with PIN instead →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.pinHeader}>
              <Text style={styles.label}>Enter your 4-digit PIN</Text>
              <Text style={styles.phonePill}>📱 +233 {phone}</Text>
            </View>

            <View style={styles.pinDots}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
              ))}
            </View>

            <View style={styles.numpad}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.key, k === '' && { opacity: 0 }]}
                  onPress={() => k === '⌫' ? handlePinDelete() : k && handlePinDigit(k)}
                  disabled={k === ''}
                >
                  <Text style={styles.keyText}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.btn, (pin.length < PIN_LENGTH || loading) && { opacity: 0.5 }]}
              onPress={handlePinSignIn}
              disabled={pin.length < PIN_LENGTH || loading}
            >
              <LinearGradient colors={['#4338ca', '#0d9488']} style={styles.btnGrad}>
                <Text style={styles.btnText}>{loading ? 'Verifying…' : 'Sign In with PIN'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep('phone'); setPin(''); }}>
              <Text style={styles.link}>← Use OTP instead</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.securityNote}>
          <Text style={styles.secNote}>🔒 Protected by AI fraud detection + blockchain audit trail</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:      { paddingTop: 60, paddingBottom: 36, alignItems: 'center', gap: 6 },
  headerIcon:  { fontSize: 40 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, color: '#a5b4fc' },
  body:        { flex: 1, backgroundColor: '#f8fafc' },
  label:       { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  inputRow:    { flexDirection: 'row', borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  prefix:      { backgroundColor: '#f1f5f9', paddingHorizontal: 14, justifyContent: 'center' },
  prefixText:  { fontSize: 14, color: '#374151', fontWeight: '600' },
  input:       { flex: 1, padding: 16, fontSize: 16, color: '#0f172a' },
  btn:         { borderRadius: 14, overflow: 'hidden' },
  btnGrad:     { paddingVertical: 16, alignItems: 'center' },
  btnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  pinHeader:   { gap: 6 },
  phonePill:   { fontSize: 13, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  pinDots:     { flexDirection: 'row', justifyContent: 'center', gap: 16, marginVertical: 8 },
  dot:         { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  dotFilled:   { backgroundColor: '#4338ca', borderColor: '#4338ca' },
  numpad:      { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginVertical: 8 },
  key:         { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  keyText:     { fontSize: 22, fontWeight: '600', color: '#0f172a' },
  link:        { textAlign: 'center', color: '#4338ca', fontSize: 14, fontWeight: '600' },
  securityNote:{ backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  secNote:     { fontSize: 12, color: '#1d4ed8', textAlign: 'center' },
});
