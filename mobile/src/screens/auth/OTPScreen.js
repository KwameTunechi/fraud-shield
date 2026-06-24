import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const C = {
  primary:      '#1652F0',
  primaryLight: '#EBF0FE',
  success:      '#00875A',
  danger:       '#DE350B',
  text:         '#0D1421',
  textSub:      '#6B7280',
  textMuted:    '#9CA3AF',
  bg:           '#F5F7FA',
  surface:      '#FFFFFF',
  border:       '#E8ECEF',
};

const OTP_LENGTH = 6;

export default function OTPScreen({ navigation, route }) {
  const phone = route?.params?.phone ?? '';
  const { verifyOtp, requestOtp, activateUser, biometricType } = useAuth();

  const [otp,       setOtp]       = useState(Array(OTP_LENGTH).fill(''));
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [countdown, setCountdown] = useState(30);
  const inputs = useRef([]);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  function handleChange(text, idx) {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next  = [...otp];
    next[idx]   = digit;
    setOtp(next);
    setError('');
    if (digit && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  }

  function handleKeyPress(e, idx) {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setError('Please enter all 6 digits.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await verifyOtp(phone, code);
      if (result.pinSetup) {
        navigation.replace('SetPin');
      } else if (biometricType) {
        navigation.replace('Biometric');
      } else {
        activateUser(result.user, phone);
      }
    } catch (err) {
      setError(err.message ?? 'Invalid code. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    try {
      await requestOtp(phone);
      setCountdown(30);
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
    } catch (err) {
      setError(err.message ?? 'Could not resend code.');
    }
  }

  const filled = otp.filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.iconBox}>
            <Ionicons name="chatbubble-outline" size={28} color={C.primary} />
          </View>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phone}>{phone}</Text>
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={el => inputs.current[i] = el}
                style={[styles.otpInput, digit && styles.otpInputFilled, error && styles.otpInputError]}
                value={digit}
                onChangeText={t => handleChange(t, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryBtn, (filled < OTP_LENGTH || loading) && styles.primaryBtnDisabled]}
            onPress={handleVerify}
            disabled={filled < OTP_LENGTH || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Verifying…' : 'Verify'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendBtn, countdown > 0 && styles.resendBtnDisabled]}
            onPress={handleResend}
            disabled={countdown > 0}
            activeOpacity={0.7}
          >
            <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
              {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.surface },
  header:            { paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:           { width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  body:              { flex: 1, paddingHorizontal: 24, paddingTop: 16, gap: 20, alignItems: 'center' },
  iconBox:           { width: 64, height: 64, borderRadius: 20, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title:             { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center' },
  subtitle:          { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 22 },
  phone:             { fontWeight: '700', color: C.text },
  otpRow:            { flexDirection: 'row', gap: 10 },
  otpInput:          { width: 46, height: 56, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, fontSize: 22, fontWeight: '700', color: C.text, backgroundColor: C.bg },
  otpInputFilled:    { borderColor: C.primary, backgroundColor: C.primaryLight },
  otpInputError:     { borderColor: C.danger },
  errorRow:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText:         { fontSize: 12, color: C.danger },
  primaryBtn:        { width: '100%', backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryBtnDisabled:{ opacity: 0.4 },
  primaryBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendBtn:         { paddingVertical: 8 },
  resendBtnDisabled: {},
  resendText:        { fontSize: 14, color: C.primary, fontWeight: '600' },
  resendTextDisabled:{ color: C.textMuted },
});
