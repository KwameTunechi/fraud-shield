import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const C = {
  primary:      '#1652F0',
  primaryLight: '#EBF0FE',
  danger:       '#DE350B',
  text:         '#0D1421',
  textSub:      '#6B7280',
  textMuted:    '#9CA3AF',
  bg:           '#F5F7FA',
  surface:      '#FFFFFF',
  border:       '#E8ECEF',
};

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
  const [error,   setError]   = useState('');
  const [step,    setStep]    = useState('phone'); // 'phone' | 'pin'

  async function handleContinue() {
    setError('');
    const normalized = normalizePhone(phone);
    if (!normalized) { setError('Enter a valid 10-digit Ghana mobile number.'); return; }
    setLoading(true);
    try {
      const res = await requestOtp(normalized);
      if (res?.pinSetup === false) {
        navigation.navigate('OTP', { phone: normalized });
      } else {
        setStep('pin');
      }
    } catch (err) {
      setError(err.message ?? 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePinLogin() {
    setError('');
    if (pin.length < 4) return;
    const normalized = normalizePhone(phone);
    setLoading(true);
    try {
      await loginWithPin(normalized, pin);
    } catch (err) {
      setError(err.message ?? 'Incorrect PIN. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  function handleDigit(d) { if (pin.length < 4) setPin(p => p + d); }
  function handleDelete()  { setPin(p => p.slice(0, -1)); }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Ionicons name="shield-checkmark" size={28} color={C.primary} />
            </View>
            <Text style={styles.brandName}>FraudShield</Text>
            <Text style={styles.brandTag}>Secure Mobile Money</Text>
          </View>

          {step === 'phone' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSub}>Enter your registered mobile number to continue.</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.prefix}>
                    <Text style={styles.prefixText}>🇬🇭 +233</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="20 000 0000"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={t => { setPhone(t); setError(''); }}
                    autoFocus
                    placeholderTextColor={C.textMuted}
                  />
                </View>
                {error ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color={C.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, (!phone || loading) && styles.primaryBtnDisabled]}
                onPress={handleContinue}
                disabled={!phone || loading}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Please wait…' : 'Continue'}</Text>
                {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <TouchableOpacity style={styles.backRow} onPress={() => { setStep('phone'); setPin(''); setError(''); }}>
                <Ionicons name="arrow-back" size={16} color={C.textSub} />
                <Text style={styles.backText}>Change number</Text>
              </TouchableOpacity>

              <Text style={styles.cardTitle}>Enter your PIN</Text>
              <Text style={styles.cardSub}>Use your 4-digit PIN to sign in.</Text>

              <View style={styles.pinDots}>
                {[0, 1, 2, 3].map(i => (
                  <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
                ))}
              </View>

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={C.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.numpad}>
                {['1','2','3','4','5','6','7','8','9','','0','del'].map((k, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.numKey, k === '' && { opacity: 0 }]}
                    onPress={() => k === 'del' ? handleDelete() : k && handleDigit(k)}
                    disabled={k === ''}
                    activeOpacity={0.7}
                  >
                    {k === 'del'
                      ? <Ionicons name="backspace-outline" size={22} color={C.text} />
                      : <Text style={styles.numKeyText}>{k}</Text>
                    }
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, (pin.length < 4 || loading) && styles.primaryBtnDisabled]}
                onPress={handlePinLogin}
                disabled={pin.length < 4 || loading}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => navigation.navigate('OTP', { phone: normalizePhone(phone) })}
              >
                <Text style={styles.linkText}>Sign in with OTP instead</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.footer}>Protected by 256-bit encryption &amp; blockchain audit trail</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.bg },
  scroll:            { flexGrow: 1, padding: 24, gap: 32, justifyContent: 'center' },
  brand:             { alignItems: 'center', gap: 8 },
  brandIcon:         { width: 64, height: 64, borderRadius: 20, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  brandName:         { fontSize: 22, fontWeight: '800', color: C.text },
  brandTag:          { fontSize: 13, color: C.textSub },
  card:              { backgroundColor: C.surface, borderRadius: 20, padding: 24, gap: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  cardTitle:         { fontSize: 20, fontWeight: '800', color: C.text },
  cardSub:           { fontSize: 14, color: C.textSub, lineHeight: 20, marginTop: -8 },
  field:             { gap: 8 },
  fieldLabel:        { fontSize: 13, fontWeight: '600', color: C.textSub },
  phoneRow:          { flexDirection: 'row', borderRadius: 12, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden', backgroundColor: C.surface },
  prefix:            { paddingHorizontal: 14, paddingVertical: 14, backgroundColor: C.bg, borderRightWidth: 1, borderRightColor: C.border, justifyContent: 'center' },
  prefixText:        { fontSize: 14, fontWeight: '600', color: C.textSub },
  phoneInput:        { flex: 1, fontSize: 16, color: C.text, paddingHorizontal: 14, paddingVertical: 14 },
  errorRow:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText:         { fontSize: 12, color: C.danger },
  primaryBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16 },
  primaryBtnDisabled:{ opacity: 0.4 },
  primaryBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  backRow:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText:          { fontSize: 13, color: C.textSub },
  pinDots:           { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 8 },
  pinDot:            { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border },
  pinDotFilled:      { backgroundColor: C.primary, borderColor: C.primary },
  numpad:            { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  numKey:            { width: 72, height: 72, borderRadius: 36, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  numKeyText:        { fontSize: 22, fontWeight: '500', color: C.text },
  linkRow:           { alignItems: 'center' },
  linkText:          { fontSize: 14, color: C.primary, fontWeight: '600' },
  footer:            { textAlign: 'center', fontSize: 12, color: C.textMuted, lineHeight: 18 },
});
