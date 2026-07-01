import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const C = {
  primary:      '#1652F0',
  primaryLight: '#EBF0FE',
  primaryDark:  '#0D3DB3',
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

const QUICK_AMOUNTS = [2, 5, 10, 20, 50];
const NETWORKS = [
  { id: 'mtn',     label: 'MTN',     color: '#FFCC00', icon: '📶' },
  { id: 'telecel', label: 'Telecel', color: '#EE1C25', icon: '📶' },
  { id: 'airteltigo', label: 'AirtelTigo', color: '#E40000', icon: '📶' },
];

function fmtMoney(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  const clean  = digits.startsWith('0') ? digits.slice(1) : digits;
  return '+233' + clean;
}

export default function AirtimeScreen({ navigation }) {
  const { user, refreshUser } = useAuth();

  const [phone,    setPhone]    = useState('');
  const [amount,   setAmount]   = useState('');
  const [network,  setNetwork]  = useState('telecel');
  const [pin,      setPin]      = useState('');
  const [step,     setStep]     = useState('form');   // 'form' | 'pin' | 'done'
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);

  const balance   = Number(user?.balance ?? 0);
  const amountNum = parseFloat(amount) || 0;
  const canNext   = phone.replace(/\D/g, '').length >= 9 && amountNum >= 1 && amountNum <= balance;

  function useMyNumber() {
    const local = (user?.phone ?? '').replace('+233', '0');
    setPhone(local);
  }

  async function handleConfirm() {
    if (pin.length !== 4) {
      Alert.alert('PIN required', 'Enter your 4-digit PIN to continue.');
      return;
    }
    setLoading(true);
    try {
      // Airtime is implemented as a P2P transaction to the same number
      // with category MERCHANT and a metadata flag. This keeps the
      // blockchain and risk scorer in the loop.
      const res = await api.post('/api/transactions', {
        recipientPhone: normalizePhone(phone),
        amount: amountNum,
        pin,
        category: 'MERCHANT',
      });
      setResult(res.transaction);
      setStep('done');
      refreshUser?.();
    } catch (err) {
      const msg = err?.response?.data?.error ?? 'Top-up failed. Please try again.';
      if (msg.toLowerCase().includes('locked')) {
        Alert.alert('Account Locked', msg);
      } else if (msg.toLowerCase().includes('pin') || msg.toLowerCase().includes('incorrect')) {
        Alert.alert('Wrong PIN', msg);
        setPin('');
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.primary} />
        <View style={styles.header}>
          <View style={{ width: 36 }} />
          <Text style={styles.headerTitle}>Airtime Top-up</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.doneBody}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark-circle" size={64} color={C.success} />
          </View>
          <Text style={styles.doneTitle}>Top-up Successful!</Text>
          <Text style={styles.doneAmt}>{fmtMoney(amountNum)} airtime</Text>
          <Text style={styles.doneTo}>sent to {phone}</Text>
          <Text style={styles.doneRef}>Ref: {result?.reference}</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'pin') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.primary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('form')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Top-up</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phone number</Text>
              <Text style={styles.summaryValue}>{phone}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Network</Text>
              <Text style={styles.summaryValue}>{NETWORKS.find(n => n.id === network)?.label}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={[styles.summaryValue, { color: C.primary, fontWeight: '800' }]}>{fmtMoney(amountNum)}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Enter your PIN</Text>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={t => setPin(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="numeric"
            secureTextEntry
            maxLength={4}
            placeholder="• • • •"
            placeholderTextColor={C.textMuted}
          />

          <TouchableOpacity
            style={[styles.btnPrimary, (!canNext || loading) && styles.btnDisabled]}
            onPress={handleConfirm}
            disabled={!canNext || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPrimaryText}>Buy Airtime</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Airtime Top-up</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Network selector */}
        <Text style={styles.sectionLabel}>Select Network</Text>
        <View style={styles.networkRow}>
          {NETWORKS.map(n => (
            <TouchableOpacity
              key={n.id}
              style={[styles.networkBtn, network === n.id && styles.networkBtnActive]}
              onPress={() => setNetwork(n.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.networkIcon}>{n.icon}</Text>
              <Text style={[styles.networkLabel, network === n.id && { color: C.primary }]}>{n.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Phone number */}
        <Text style={styles.sectionLabel}>Phone Number</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="0244 000 000"
            placeholderTextColor={C.textMuted}
            maxLength={15}
          />
          <TouchableOpacity style={styles.myNumBtn} onPress={useMyNumber}>
            <Text style={styles.myNumText}>My number</Text>
          </TouchableOpacity>
        </View>

        {/* Quick amounts */}
        <Text style={styles.sectionLabel}>Amount (GHS)</Text>
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map(a => (
            <TouchableOpacity
              key={a}
              style={[styles.quickBtn, amount === String(a) && styles.quickBtnActive]}
              onPress={() => setAmount(String(a))}
            >
              <Text style={[styles.quickText, amount === String(a) && { color: C.primary, fontWeight: '700' }]}>₵{a}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={t => setAmount(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="Or enter custom amount"
          placeholderTextColor={C.textMuted}
        />

        {/* Balance info */}
        <Text style={styles.balanceHint}>
          Balance: <Text style={{ color: C.primary, fontWeight: '700' }}>{fmtMoney(balance)}</Text>
        </Text>
        {amountNum > balance && (
          <Text style={styles.errorText}>Amount exceeds your balance.</Text>
        )}

        <TouchableOpacity
          style={[styles.btnPrimary, !canNext && styles.btnDisabled]}
          onPress={() => { setPin(''); setStep('pin'); }}
          disabled={!canNext}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: C.primary },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:         { padding: 4 },
  headerTitle:     { color: '#fff', fontSize: 17, fontWeight: '700' },
  scroll:          { flex: 1, backgroundColor: C.bg },
  scrollContent:   { padding: 20, gap: 0 },
  sectionLabel:    { fontSize: 13, fontWeight: '700', color: C.textSub, marginBottom: 10, marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  networkRow:      { flexDirection: 'row', gap: 10, marginBottom: 4 },
  networkBtn:      { flex: 1, alignItems: 'center', gap: 6, padding: 12, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  networkBtnActive:{ borderColor: C.primary, backgroundColor: C.primaryLight },
  networkIcon:     { fontSize: 20 },
  networkLabel:    { fontSize: 11, fontWeight: '600', color: C.textSub },
  inputRow:        { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input:           { flex: 1, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: C.text },
  myNumBtn:        { backgroundColor: C.primaryLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 14 },
  myNumText:       { fontSize: 12, color: C.primary, fontWeight: '700' },
  quickRow:        { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  quickBtn:        { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  quickBtnActive:  { borderColor: C.primary, backgroundColor: C.primaryLight },
  quickText:       { fontSize: 13, color: C.textSub, fontWeight: '600' },
  balanceHint:     { fontSize: 13, color: C.textSub, marginTop: 8, marginBottom: 4 },
  errorText:       { fontSize: 12, color: C.danger, marginBottom: 4 },
  btnPrimary:      { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnPrimaryText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled:     { opacity: 0.4 },
  // Summary / PIN step
  summaryCard:     { backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryLabel:    { fontSize: 14, color: C.textSub },
  summaryValue:    { fontSize: 14, fontWeight: '600', color: C.text },
  pinInput:        { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 16, fontSize: 24, color: C.text, textAlign: 'center', letterSpacing: 8 },
  // Done step
  doneBody:        { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneIcon:        { marginBottom: 20 },
  doneTitle:       { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 8 },
  doneAmt:         { fontSize: 32, fontWeight: '800', color: C.primary, marginBottom: 4 },
  doneTo:          { fontSize: 15, color: C.textSub, marginBottom: 8 },
  doneRef:         { fontSize: 12, color: C.textMuted, marginBottom: 32 },
});
