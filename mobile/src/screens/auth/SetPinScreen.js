import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const PIN_LENGTH = 4;

export default function SetPinScreen({ navigation }) {
  const { setPin } = useAuth();
  const [pin,      setLocalPin] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [step,     setStep]     = useState('enter');  // 'enter' | 'confirm'
  const [loading,  setLoading]  = useState(false);

  function handleDigit(d) {
    if (step === 'enter')   { if (pin.length     < PIN_LENGTH) setLocalPin(p  => p  + d); }
    else                    { if (confirm.length < PIN_LENGTH) setConfirm(c   => c  + d); }
  }

  function handleDelete() {
    if (step === 'enter') setLocalPin(p => p.slice(0, -1));
    else                  setConfirm(c  => c.slice(0, -1));
  }

  function handleNext() {
    if (pin.length < PIN_LENGTH) return;
    setStep('confirm');
  }

  async function handleConfirm() {
    if (confirm.length < PIN_LENGTH) return;
    if (confirm !== pin) {
      Alert.alert('PINs do not match', 'Please try again.');
      setConfirm('');
      return;
    }
    setLoading(true);
    try {
      await setPin(pin);
      navigation.navigate('Biometric');
    } catch (err) {
      Alert.alert('Error', err.message ?? 'Could not set PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const current = step === 'enter' ? pin : confirm;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.header}>
        <Text style={styles.headerIcon}>🔐</Text>
        <Text style={styles.headerTitle}>
          {step === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN'}
        </Text>
        <Text style={styles.headerSub}>
          {step === 'enter'
            ? 'Choose a 4-digit PIN to protect your account'
            : 'Enter your PIN once more to confirm'}
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.card}>
          {/* Progress dots */}
          <View style={styles.steps}>
            {['Set PIN', 'Confirm'].map((label, i) => (
              <View key={i} style={styles.stepItem}>
                <View style={[styles.stepDot, (step === 'confirm' || i === 0) && styles.stepDotActive]} />
                <Text style={styles.stepLabel}>{label}</Text>
              </View>
            ))}
            <View style={[styles.stepLine, step === 'confirm' && styles.stepLineActive]} />
          </View>

          {/* PIN indicator */}
          <View style={styles.pinDots}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View key={i} style={[styles.dot, current.length > i && styles.dotFilled]} />
            ))}
          </View>

          {/* Numpad */}
          <View style={styles.numpad}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.key, k === '' && { opacity: 0 }]}
                onPress={() => k === '⌫' ? handleDelete() : k && handleDigit(k)}
                disabled={k === ''}
              >
                <Text style={styles.keyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action button */}
          {step === 'enter' ? (
            <TouchableOpacity
              style={[styles.btn, pin.length < PIN_LENGTH && { opacity: 0.5 }]}
              onPress={handleNext}
              disabled={pin.length < PIN_LENGTH}
            >
              <LinearGradient colors={['#4338ca', '#0d9488']} style={styles.btnGrad}>
                <Text style={styles.btnText}>Next →</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btn, (confirm.length < PIN_LENGTH || loading) && { opacity: 0.5 }]}
              onPress={handleConfirm}
              disabled={confirm.length < PIN_LENGTH || loading}
            >
              <LinearGradient colors={['#4338ca', '#0d9488']} style={styles.btnGrad}>
                <Text style={styles.btnText}>{loading ? 'Saving…' : 'Set PIN'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {step === 'confirm' && (
            <TouchableOpacity onPress={() => { setStep('enter'); setConfirm(''); setLocalPin(''); }}>
              <Text style={styles.link}>← Start over</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f8fafc' },
  header:        { paddingTop: 60, paddingBottom: 36, alignItems: 'center', gap: 6 },
  headerIcon:    { fontSize: 36 },
  headerTitle:   { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub:     { fontSize: 13, color: '#a5b4fc', textAlign: 'center', paddingHorizontal: 24 },
  body:          { flex: 1, padding: 20 },
  card:          { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', gap: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  steps:         { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative' },
  stepItem:      { alignItems: 'center', gap: 4 },
  stepDot:       { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e2e8f0' },
  stepDotActive: { backgroundColor: '#4338ca' },
  stepLine:      { position: 'absolute', top: 5, left: '30%', right: '30%', height: 2, backgroundColor: '#e2e8f0' },
  stepLineActive:{ backgroundColor: '#4338ca' },
  stepLabel:     { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  pinDots:       { flexDirection: 'row', justifyContent: 'center', gap: 16, marginVertical: 4 },
  dot:           { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  dotFilled:     { backgroundColor: '#4338ca', borderColor: '#4338ca' },
  numpad:        { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  key:           { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  keyText:       { fontSize: 22, fontWeight: '600', color: '#0f172a' },
  btn:           { borderRadius: 14, overflow: 'hidden', width: '100%' },
  btnGrad:       { paddingVertical: 16, alignItems: 'center' },
  btnText:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  link:          { textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: '500' },
});
