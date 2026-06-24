import React, { useState, useEffect } from 'react';
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

function maskPhone(phone) {
  // "+233244100001" → "+233 24•• ••• 001"
  if (!phone) return '';
  const local = phone.replace('+233', '');   // "244100001"
  return '+233 ' + local.slice(0, 2) + '• •••' + local.slice(-3);
}

// Modes:
//  'returning'  — remembered phone found, show PIN numpad directly
//  'phone'      — no remembered phone, enter phone number
//  'pin'        — phone entered manually, now enter PIN
export default function SignInScreen({ navigation }) {
  const { requestOtp, loginWithPin, completeBiometric, loginWithBiometric,
          rememberedPhone, clearRememberedPhone, biometricType } = useAuth();

  const [mode,    setMode]    = useState('phone');  // will update in useEffect
  const [phone,   setPhone]   = useState('');
  const [pin,     setPin]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // As soon as rememberedPhone is known, jump to 'returning' mode
  useEffect(() => {
    if (rememberedPhone) {
      setMode('returning');
    }
  }, [rememberedPhone]);

  // ── Phone-entry continue ────────────────────────────────────────────────
  async function handleContinue() {
    setError('');
    const normalized = normalizePhone(phone);
    if (!normalized) { setError('Enter a valid 10-digit Ghana mobile number.'); return; }
    setLoading(true);
    try {
      await requestOtp(normalized);
      navigation.navigate('OTP', { phone: normalized });
    } catch (err) {
      setError(err.message ?? 'Could not verify number.');
    } finally {
      setLoading(false);
    }
  }

  // ── PIN login (returning user) — PIN alone is sufficient, no biometric MFA ──
  async function handlePinLogin() {
    setError('');
    if (pin.length < 4) return;
    const target = mode === 'returning' ? rememberedPhone : normalizePhone(phone);
    setLoading(true);
    try {
      await loginWithPin(target, pin);
      // Promote pendingUser directly — returning users don't need biometric MFA
      completeBiometric();
    } catch (err) {
      setError(err.message ?? 'Incorrect PIN. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  // ── Biometric login for returning user (bypasses PIN) ────────────────────
  async function handleBiometricLogin() {
    setError('');
    setLoading(true);
    try {
      await loginWithBiometric(); // returning-user path: biometric → stored PIN → API
      // loginWithBiometric sets user directly → AppNavigator switches to main
    } catch (err) {
      setError(err.message ?? 'Biometric failed. Use your PIN.');
    } finally {
      setLoading(false);
    }
  }

  // ── OTP for returning user ──────────────────────────────────────────────
  async function handleOtpForReturning() {
    setLoading(true);
    try {
      await requestOtp(rememberedPhone);
      navigation.navigate('OTP', { phone: rememberedPhone });
    } catch (err) {
      setError(err.message ?? 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  }

  // ── Switch to different account ─────────────────────────────────────────
  async function handleDifferentAccount() {
    await clearRememberedPhone();
    setPin('');
    setError('');
    setMode('phone');
  }

  function handleDigit(d) { if (pin.length < 4) setPin(p => p + d); setError(''); }
  function handleDelete()  { setPin(p => p.slice(0, -1)); setError(''); }

  // ── Shared PIN numpad ───────────────────────────────────────────────────
  function PinNumpad({ onSubmit, submitLabel }) {
    return (
      <>
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
          onPress={onSubmit}
          disabled={pin.length < 4 || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : submitLabel}</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Ionicons name="shield-checkmark" size={28} color={C.primary} />
            </View>
            <Text style={styles.brandName}>FraudShield</Text>
            <Text style={styles.brandTag}>Secure Mobile Money</Text>
          </View>

          {/* ── RETURNING USER: PIN numpad, phone pre-filled ── */}
          {mode === 'returning' && (
            <View style={styles.card}>
              <View style={styles.accountRow}>
                <View style={styles.accountIcon}>
                  <Ionicons name="person" size={18} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountPhone}>{maskPhone(rememberedPhone)}</Text>
                  <Text style={styles.accountLabel}>Your account</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>Welcome back</Text>

              {/* Biometric quick-login */}
              {biometricType && (
                <>
                  <TouchableOpacity
                    style={[styles.biometricBtn, loading && styles.primaryBtnDisabled]}
                    onPress={handleBiometricLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={biometricType === 'face' ? 'scan' : 'finger-print'}
                      size={26}
                      color={C.primary}
                    />
                    <Text style={styles.biometricBtnText}>
                      {loading ? 'Verifying…' : biometricType === 'face' ? 'Sign in with Face ID' : 'Sign in with Fingerprint'}
                    </Text>
                  </TouchableOpacity>

                  {error ? (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle" size={14} color={C.danger} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or use PIN</Text>
                    <View style={styles.dividerLine} />
                  </View>
                </>
              )}

              {!biometricType && <Text style={styles.cardSub}>Enter your PIN to continue.</Text>}
              {!biometricType && error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={C.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <PinNumpad onSubmit={handlePinLogin} submitLabel="Sign In with PIN" />

              <TouchableOpacity onPress={handleOtpForReturning} disabled={loading} activeOpacity={0.7} style={styles.otpLink}>
                <Ionicons name="chatbubble-outline" size={14} color={C.primary} />
                <Text style={styles.linkText}>Use OTP instead</Text>
              </TouchableOpacity>
            </View>

            {/* Different account — outside the card, clearly visible */}
            <TouchableOpacity onPress={handleDifferentAccount} activeOpacity={0.8} style={styles.diffAccountBtn}>
              <Ionicons name="swap-horizontal-outline" size={16} color={C.textSub} />
              <Text style={styles.diffAccountText}>Login to a different account</Text>
            </TouchableOpacity>
          )}

          {/* ── NEW USER / NO REMEMBERED PHONE: enter number ── */}
          {mode === 'phone' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sign In</Text>
              <Text style={styles.cardSub}>Enter your registered Ghana mobile number.</Text>

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
          )}

          <Text style={styles.footer}>Protected by 256-bit encryption &amp; blockchain audit trail</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: C.bg },
  scroll:             { flexGrow: 1, padding: 24, gap: 32, justifyContent: 'center' },
  brand:              { alignItems: 'center', gap: 8 },
  brandIcon:          { width: 64, height: 64, borderRadius: 20, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  brandName:          { fontSize: 22, fontWeight: '800', color: C.text },
  brandTag:           { fontSize: 13, color: C.textSub },
  card:               { backgroundColor: C.surface, borderRadius: 20, padding: 24, gap: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  cardTitle:          { fontSize: 20, fontWeight: '800', color: C.text },
  cardSub:            { fontSize: 14, color: C.textSub, lineHeight: 20, marginTop: -8 },
  accountRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.primaryLight, borderRadius: 14, padding: 14 },
  accountIcon:        { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  accountPhone:       { fontSize: 15, fontWeight: '700', color: C.text },
  accountLabel:       { fontSize: 11, color: C.textSub, marginTop: 1 },
  field:              { gap: 8 },
  fieldLabel:         { fontSize: 13, fontWeight: '600', color: C.textSub },
  phoneRow:           { flexDirection: 'row', borderRadius: 12, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden', backgroundColor: C.surface },
  prefix:             { paddingHorizontal: 14, paddingVertical: 14, backgroundColor: C.bg, borderRightWidth: 1, borderRightColor: C.border, justifyContent: 'center' },
  prefixText:         { fontSize: 14, fontWeight: '600', color: C.textSub },
  phoneInput:         { flex: 1, fontSize: 16, color: C.text, paddingHorizontal: 14, paddingVertical: 14 },
  errorRow:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText:          { fontSize: 12, color: C.danger },
  primaryBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16 },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  backRow:            { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText:           { fontSize: 13, color: C.textSub },
  pinDots:            { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 8 },
  pinDot:             { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border },
  pinDotFilled:       { backgroundColor: C.primary, borderColor: C.primary },
  numpad:             { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  numKey:             { width: 72, height: 72, borderRadius: 36, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  numKeyText:         { fontSize: 22, fontWeight: '500', color: C.text },
  otpLink:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 },
  linkText:           { fontSize: 14, color: C.primary, fontWeight: '600' },
  diffAccountBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  diffAccountText:    { fontSize: 14, fontWeight: '600', color: C.textSub },
  biometricBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.primaryLight, borderRadius: 14, paddingVertical: 16, borderWidth: 1.5, borderColor: C.primary + '30' },
  biometricBtnText:   { fontSize: 16, fontWeight: '700', color: C.primary },
  dividerRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine:        { flex: 1, height: 1, backgroundColor: C.border },
  dividerText:        { fontSize: 12, color: C.textMuted, fontWeight: '500' },
  footer:             { textAlign: 'center', fontSize: 12, color: C.textMuted, lineHeight: 18 },
});
