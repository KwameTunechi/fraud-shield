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
  success:      '#00875A',
  successLight: '#E3F5F0',
  danger:       '#DE350B',
  text:         '#0D1421',
  textSub:      '#6B7280',
  textMuted:    '#9CA3AF',
  bg:           '#F5F7FA',
  surface:      '#FFFFFF',
  border:       '#E8ECEF',
};

const BILLERS = [
  { id: 'ecg',       label: 'ECG Electricity',   icon: 'flash-outline',         color: '#F59E0B', recipientPhone: '+233200000001' },
  { id: 'gwcl',      label: 'Ghana Water',        icon: 'water-outline',         color: '#3B82F6', recipientPhone: '+233200000002' },
  { id: 'dstv',      label: 'DStv',               icon: 'tv-outline',            color: '#0066CC', recipientPhone: '+233200000003' },
  { id: 'gotv',      label: 'GOtv',               icon: 'desktop-outline',       color: '#EF4444', recipientPhone: '+233200000004' },
  { id: 'nhil',      label: 'NHIS',               icon: 'heart-outline',         color: '#10B981', recipientPhone: '+233200000005' },
  { id: 'internet',  label: 'Internet (ISP)',      icon: 'wifi-outline',          color: '#8B5CF6', recipientPhone: '+233200000006' },
];

function fmtMoney(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

export default function PayBillScreen({ navigation }) {
  const { user, refreshUser } = useAuth();

  const [biller,   setBiller]   = useState(null);
  const [account,  setAccount]  = useState('');
  const [amount,   setAmount]   = useState('');
  const [pin,      setPin]      = useState('');
  const [step,     setStep]     = useState('form');  // 'form' | 'pin' | 'done'
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);

  const balance   = Number(user?.balance ?? 0);
  const amountNum = parseFloat(amount) || 0;
  const canNext   = biller && account.length >= 3 && amountNum >= 1 && amountNum <= balance;

  async function handleConfirm() {
    if (pin.length !== 4) {
      Alert.alert('PIN required', 'Enter your 4-digit PIN to continue.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/transactions', {
        recipientPhone: biller.recipientPhone,
        amount: amountNum,
        pin,
        category: 'BILL',
      });
      setResult(res.transaction);
      setStep('done');
      refreshUser?.();
    } catch (err) {
      const msg = err?.response?.data?.error ?? 'Payment failed. Please try again.';
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
          <Text style={styles.headerTitle}>Pay Bill</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.doneBody}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark-circle" size={64} color={C.success} />
          </View>
          <Text style={styles.doneTitle}>Payment Successful!</Text>
          <Text style={styles.doneAmt}>{fmtMoney(amountNum)}</Text>
          <Text style={styles.doneTo}>paid to {biller?.label}</Text>
          <Text style={styles.doneAccount}>Account: {account}</Text>
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
          <Text style={styles.headerTitle}>Confirm Payment</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Biller</Text>
              <Text style={styles.summaryValue}>{biller?.label}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Account / Meter No.</Text>
              <Text style={styles.summaryValue}>{account}</Text>
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
              : <Text style={styles.btnPrimaryText}>Pay Now</Text>}
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
        <Text style={styles.headerTitle}>Pay Bill</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Biller selection */}
        <Text style={styles.sectionLabel}>Select Biller</Text>
        <View style={styles.billerGrid}>
          {BILLERS.map(b => (
            <TouchableOpacity
              key={b.id}
              style={[styles.billerBtn, biller?.id === b.id && styles.billerBtnActive]}
              onPress={() => setBiller(b)}
              activeOpacity={0.8}
            >
              <View style={[styles.billerIcon, { backgroundColor: b.color + '20' }]}>
                <Ionicons name={b.icon} size={22} color={b.color} />
              </View>
              <Text style={[styles.billerLabel, biller?.id === b.id && { color: C.primary }]} numberOfLines={2}>
                {b.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Account / Meter number */}
        <Text style={styles.sectionLabel}>
          {biller?.id === 'ecg' ? 'Meter Number' : biller?.id === 'gwcl' ? 'Account Number' : biller?.id === 'dstv' || biller?.id === 'gotv' ? 'Smart Card Number' : biller?.id === 'nhil' ? 'NHIS ID' : 'Account / Reference'}
        </Text>
        <TextInput
          style={styles.input}
          value={account}
          onChangeText={setAccount}
          keyboardType={biller?.id === 'nhil' ? 'default' : 'numeric'}
          placeholder="Enter reference number"
          placeholderTextColor={C.textMuted}
        />

        {/* Amount */}
        <Text style={styles.sectionLabel}>Amount (GHS)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={t => setAmount(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={C.textMuted}
        />

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
  scrollContent:   { padding: 20 },
  sectionLabel:    { fontSize: 13, fontWeight: '700', color: C.textSub, marginBottom: 10, marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  billerGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  billerBtn:       { width: '30%', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  billerBtnActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  billerIcon:      { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  billerLabel:     { fontSize: 11, fontWeight: '600', color: C.textSub, textAlign: 'center' },
  input:           { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: C.text },
  balanceHint:     { fontSize: 13, color: C.textSub, marginTop: 8, marginBottom: 4 },
  errorText:       { fontSize: 12, color: C.danger, marginBottom: 4 },
  btnPrimary:      { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnPrimaryText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled:     { opacity: 0.4 },
  summaryCard:     { backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryLabel:    { fontSize: 14, color: C.textSub },
  summaryValue:    { fontSize: 14, fontWeight: '600', color: C.text },
  pinInput:        { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 16, fontSize: 24, color: C.text, textAlign: 'center', letterSpacing: 8 },
  doneBody:        { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneIcon:        { marginBottom: 20 },
  doneTitle:       { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 8 },
  doneAmt:         { fontSize: 32, fontWeight: '800', color: C.primary, marginBottom: 4 },
  doneTo:          { fontSize: 15, color: C.textSub, marginBottom: 4 },
  doneAccount:     { fontSize: 13, color: C.textMuted, marginBottom: 4 },
  doneRef:         { fontSize: 12, color: C.textMuted, marginBottom: 32 },
});
