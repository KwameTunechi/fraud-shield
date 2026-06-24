import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
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

const PIN_LENGTH = 4;

export default function SetPinScreen({ navigation }) {
  const { setPin: savePin, skipBiometric, activateUser, biometricType, pendingUser } = useAuth();
  const [pin,     setPin]    = useState('');
  const [confirm, setConfirm]= useState('');
  const [step,    setStep]   = useState('enter'); // 'enter' | 'confirm'
  const [error,   setError]  = useState('');
  const [loading, setLoading]= useState(false);

  function handleDigit(d) {
    setError('');
    if (step === 'enter') {
      if (pin.length < PIN_LENGTH) setPin(p => p + d);
    } else {
      if (confirm.length < PIN_LENGTH) setConfirm(c => c + d);
    }
  }

  function handleDelete() {
    setError('');
    if (step === 'enter') setPin(p => p.slice(0, -1));
    else setConfirm(c => c.slice(0, -1));
  }

  function handleNext() {
    if (pin.length < PIN_LENGTH) return;
    setStep('confirm');
  }

  async function handleConfirm() {
    if (confirm.length < PIN_LENGTH) return;
    if (pin !== confirm) {
      setError('PINs do not match. Please try again.');
      setConfirm('');
      return;
    }
    setLoading(true);
    try {
      await savePin(pin);
      if (biometricType) {
        navigation.replace('Biometric');
      } else if (pendingUser) {
        // pendingUser is already in state here (user typed PIN twice — many renders have passed)
        activateUser(pendingUser, pendingUser.phone);
      }
    } catch (err) {
      setError(err.message ?? 'Could not set PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const current    = step === 'enter' ? pin : confirm;
  const isEnter    = step === 'enter';
  const canProceed = current.length === PIN_LENGTH;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <View style={styles.header}>
        {!isEnter && (
          <TouchableOpacity onPress={() => { setStep('enter'); setConfirm(''); setError(''); }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.iconBox}>
          <Ionicons name="keypad-outline" size={28} color={C.primary} />
        </View>

        <Text style={styles.title}>
          {isEnter ? 'Create your PIN' : 'Confirm your PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {isEnter
            ? 'Choose a 4-digit PIN to secure your account.'
            : 'Enter the same PIN again to confirm.'}
        </Text>

        <View style={styles.dots}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[styles.dot, current.length > i && styles.dotFilled]} />
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
          style={[styles.primaryBtn, (!canProceed || loading) && styles.primaryBtnDisabled]}
          onPress={isEnter ? handleNext : handleConfirm}
          disabled={!canProceed || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? 'Setting PIN…' : isEnter ? 'Continue' : 'Set PIN'}
          </Text>
          {!loading && <Ionicons name={isEnter ? 'arrow-forward' : 'checkmark'} size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.surface },
  header:            { paddingHorizontal: 16, paddingVertical: 12, minHeight: 52 },
  backBtn:           { width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  body:              { flex: 1, paddingHorizontal: 24, paddingTop: 8, gap: 20, alignItems: 'center' },
  iconBox:           { width: 64, height: 64, borderRadius: 20, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title:             { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center' },
  subtitle:          { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 22, marginTop: -8 },
  dots:              { flexDirection: 'row', gap: 20 },
  dot:               { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border },
  dotFilled:         { backgroundColor: C.primary, borderColor: C.primary },
  errorRow:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText:         { fontSize: 12, color: C.danger },
  numpad:            { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 },
  numKey:            { width: 76, height: 76, borderRadius: 38, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  numKeyText:        { fontSize: 22, fontWeight: '500', color: C.text },
  primaryBtn:        { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16 },
  primaryBtnDisabled:{ opacity: 0.4 },
  primaryBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
