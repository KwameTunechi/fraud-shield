import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, SafeAreaView, Alert, StatusBar,
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
  warning:      '#FF8B00',
  warningLight: '#FFF3E0',
  danger:       '#DE350B',
  dangerLight:  '#FFEBE6',
  text:         '#0D1421',
  textSub:      '#6B7280',
  textMuted:    '#9CA3AF',
  bg:           '#F5F7FA',
  surface:      '#FFFFFF',
  border:       '#E8ECEF',
};

const REASON_LABELS = {
  late_night:            'Late-night transaction (22:00–05:00)',
  amount_above_2000_ghs: 'Amount above GHS 2,000',
  new_recipient:         'New recipient — no prior transactions',
  amount_3x_avg:         'Amount 3× your rolling average',
  amount_3x_rolling_avg: 'Amount exceeds 3× rolling average',
  rapid_succession:      'Multiple transactions in quick succession',
  recipient_flagged:     'Recipient flagged in recent alerts',
};

function fmtMoney(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  const clean  = digits.startsWith('0') ? digits.slice(1) : digits;
  return '+233' + clean;
}

function riskInfo(score) {
  if (score < 30) return { label: 'Low Risk',    color: C.success, bg: C.successLight };
  if (score < 70) return { label: 'Medium Risk', color: C.warning, bg: C.warningLight };
  return              { label: 'High Risk',   color: C.danger,  bg: C.dangerLight  };
}

const QUICK_AMOUNTS = ['50', '100', '200', '500'];

export default function SendMoneyScreen({ navigation }) {
  const { user } = useAuth();

  const [step,       setStep]       = useState(0);
  const [phone,      setPhone]      = useState('');
  const [amount,     setAmount]     = useState('');
  const [note,       setNote]       = useState('');
  const [preview,    setPreview]    = useState(null);
  const [analyzing,  setAnalyzing]  = useState(false);
  const [pin,        setPin]        = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);

  async function handleAnalyse() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert('Invalid Amount', 'Please enter a valid amount.'); return; }
    if (user?.balance && num > Number(user.balance)) {
      Alert.alert('Insufficient Balance', `Your balance is ${fmtMoney(user.balance)}.`); return;
    }
    setStep(1);
    setAnalyzing(true);
    try {
      const data = await api.post('/api/transactions/preview', {
        recipientPhone: normalizePhone(phone),
        amount: num,
      });
      setPreview(data);
    } catch (err) {
      Alert.alert('Analysis Failed', err.message ?? 'Could not check this transaction.');
      setStep(0);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSend() {
    if (pin.length < 4) return;
    setSubmitting(true);
    try {
      const { transaction } = await api.post('/api/transactions', {
        recipientPhone: normalizePhone(phone),
        amount: parseFloat(amount),
        pin,
        category: 'P2P',
        note,
      });
      setResult(transaction);
      setStep(3);
    } catch (err) {
      Alert.alert('Transaction Failed', err.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(0); setPhone(''); setAmount(''); setNote('');
    setPreview(null); setPin(''); setResult(null);
  }

  const risk = preview ? riskInfo(preview.score) : null;
  const num  = parseFloat(amount) || 0;

  const stepLabels = ['Send to', 'Risk Check', 'Confirm', 'Done'];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => step === 0 ? navigation.goBack() : step === 3 ? reset() : setStep(s => s - 1)}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name={step === 3 ? 'close' : 'arrow-back'} size={20} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Send Money</Text>
          <Text style={styles.headerSub}>{stepLabels[step]}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Step dots */}
      {step < 3 && (
        <View style={styles.steps}>
          {stepLabels.slice(0, 3).map((_, i) => (
            <React.Fragment key={i}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]} />
              {i < 2 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
            </React.Fragment>
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Step 0: Recipient + amount */}
        {step === 0 && (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Recipient Phone Number</Text>
              <View style={styles.inputRow}>
                <View style={styles.prefix}>
                  <Text style={styles.prefixText}>+233</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="20 000 0000"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  placeholderTextColor={C.textMuted}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Amount (GHS)</Text>
              <View style={styles.amountBox}>
                <Text style={styles.cedi}>₵</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  placeholderTextColor={C.textMuted}
                />
              </View>
              <Text style={styles.balanceHint}>
                Available: {fmtMoney(user?.balance ?? 0)}
              </Text>
              <View style={styles.quickRow}>
                {QUICK_AMOUNTS.map(a => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.quickBtn, amount === a && styles.quickBtnActive]}
                    onPress={() => setAmount(a)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickBtnText, amount === a && styles.quickBtnTextActive]}>₵{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <TextInput
                style={[styles.input, { paddingVertical: 14 }]}
                placeholder="What's this for?"
                value={note}
                onChangeText={setNote}
                placeholderTextColor={C.textMuted}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, (!phone || !amount) && styles.primaryBtnDisabled]}
              onPress={handleAnalyse}
              disabled={!phone || !amount}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Check &amp; Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        {/* Step 1: Risk check result */}
        {step === 1 && (
          <>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryText}>
                Sending {fmtMoney(num)} to {normalizePhone(phone)}
              </Text>
            </View>

            {analyzing ? (
              <View style={styles.analyzingBox}>
                <View style={styles.spinner}>
                  <Ionicons name="scan-outline" size={32} color={C.primary} />
                </View>
                <Text style={styles.analyzingTitle}>Analysing transaction</Text>
                <Text style={styles.analyzingDesc}>Checking time · recipient · amount · history</Text>
              </View>
            ) : preview && (
              <>
                <View style={[styles.riskCard, { backgroundColor: risk.bg }]}>
                  <Text style={[styles.riskScore, { color: risk.color }]}>{preview.score}%</Text>
                  <Text style={[styles.riskLabel, { color: risk.color }]}>{risk.label}</Text>
                </View>

                {preview.reasons.length > 0 ? (
                  <View style={styles.flagCard}>
                    <View style={styles.flagHeader}>
                      <Ionicons name="warning" size={16} color={C.warning} />
                      <Text style={styles.flagTitle}>Risk factors detected</Text>
                    </View>
                    {preview.reasons.map(r => (
                      <View key={r} style={styles.flagItem}>
                        <View style={styles.flagDot} />
                        <Text style={styles.flagText}>{REASON_LABELS[r] ?? r}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.clearCard}>
                    <Ionicons name="shield-checkmark" size={20} color={C.success} />
                    <Text style={styles.clearText}>No suspicious patterns detected</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.primaryBtn, preview.score >= 80 && styles.dangerBtn]}
                  onPress={() => setStep(2)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryBtnText}>
                    {preview.score >= 80 ? 'Proceed (High Risk)' : 'Continue to Confirm'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* Step 2: PIN confirm */}
        {step === 2 && (
          <>
            <View style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmKey}>To</Text>
                <Text style={styles.confirmVal}>{normalizePhone(phone)}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmKey}>Amount</Text>
                <Text style={[styles.confirmVal, { color: C.primary, fontWeight: '800' }]}>{fmtMoney(num)}</Text>
              </View>
              {note ? (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmKey}>Note</Text>
                  <Text style={styles.confirmVal}>{note}</Text>
                </View>
              ) : null}
              <View style={[styles.confirmRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.confirmKey}>Risk</Text>
                <Text style={[styles.confirmVal, { color: risk?.color }]}>{preview?.score ?? 0}% — {risk?.label}</Text>
              </View>
            </View>

            <Text style={styles.pinLabel}>Enter your 4-digit PIN</Text>
            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
              ))}
            </View>

            <View style={styles.numpad}>
              {['1','2','3','4','5','6','7','8','9','','0','del'].map((k, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.numKey, k === '' && { opacity: 0 }]}
                  onPress={() => {
                    if (k === 'del') setPin(p => p.slice(0, -1));
                    else if (k && pin.length < 4) setPin(p => p + k);
                  }}
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
              style={[styles.primaryBtn, (pin.length < 4 || submitting) && styles.primaryBtnDisabled]}
              onPress={handleSend}
              disabled={pin.length < 4 || submitting}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>
                {submitting ? 'Processing…' : `Send ${fmtMoney(num)}`}
              </Text>
              {!submitting && <Ionicons name="send" size={16} color="#fff" />}
            </TouchableOpacity>
          </>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <View style={styles.resultBox}>
            <View style={[styles.resultIcon, {
              backgroundColor: result.status === 'blocked' ? C.dangerLight
                             : result.status === 'review'  ? C.warningLight
                             : C.successLight,
            }]}>
              <Ionicons
                name={result.status === 'blocked' ? 'close-circle' : result.status === 'review' ? 'time' : 'checkmark-circle'}
                size={52}
                color={result.status === 'blocked' ? C.danger : result.status === 'review' ? C.warning : C.success}
              />
            </View>

            <Text style={styles.resultTitle}>
              {result.status === 'blocked' ? 'Transaction Blocked'
                : result.status === 'review' ? 'Under Review'
                : 'Money Sent!'}
            </Text>
            <Text style={styles.resultDesc}>
              {result.status === 'blocked'
                ? 'This transaction was blocked due to high fraud risk.'
                : result.status === 'review'
                ? 'Our team is reviewing this transaction. You will be notified.'
                : `${fmtMoney(result.amount)} sent successfully to ${result.recipient_phone}.`}
            </Text>

            <View style={styles.refCard}>
              <Text style={styles.refLabel}>Reference</Text>
              <Text style={styles.refValue}>{result.reference}</Text>
              {result.blockchain_hash && (
                <>
                  <View style={styles.refDivider} />
                  <View style={styles.refRow}>
                    <Ionicons name="link" size={14} color={C.success} />
                    <Text style={styles.refHash} numberOfLines={1}>
                      {result.blockchain_hash.slice(0, 20)}…
                    </Text>
                    <Text style={styles.refHashLabel}>On-chain</Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => { reset(); navigation.goBack(); }} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.bg },
  header:            { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:           { width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  headerTitle:       { fontSize: 15, fontWeight: '700', color: C.text },
  headerSub:         { fontSize: 12, color: C.textSub, marginTop: 1 },
  steps:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: C.surface, gap: 0, borderBottomWidth: 1, borderBottomColor: C.border },
  stepDot:           { width: 10, height: 10, borderRadius: 5, backgroundColor: C.border },
  stepDotActive:     { backgroundColor: C.primary },
  stepLine:          { width: 48, height: 2, backgroundColor: C.border },
  stepLineActive:    { backgroundColor: C.primary },
  scroll:            { flex: 1 },
  scrollContent:     { padding: 20, gap: 16 },
  field:             { gap: 8 },
  fieldLabel:        { fontSize: 13, fontWeight: '600', color: C.textSub },
  inputRow:          { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden' },
  prefix:            { paddingHorizontal: 14, paddingVertical: 14, backgroundColor: C.bg, borderRightWidth: 1, borderRightColor: C.border, justifyContent: 'center' },
  prefixText:        { fontSize: 15, fontWeight: '600', color: C.textSub },
  input:             { flex: 1, fontSize: 15, color: C.text, paddingHorizontal: 14, paddingVertical: 14 },
  amountBox:         { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 16 },
  cedi:              { fontSize: 24, fontWeight: '800', color: C.primary, marginRight: 8 },
  amountInput:       { flex: 1, fontSize: 28, fontWeight: '800', color: C.text, paddingVertical: 14 },
  balanceHint:       { fontSize: 12, color: C.textSub },
  quickRow:          { flexDirection: 'row', gap: 8 },
  quickBtn:          { flex: 1, paddingVertical: 10, backgroundColor: C.surface, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  quickBtnActive:    { borderColor: C.primary, backgroundColor: C.primaryLight },
  quickBtnText:      { fontSize: 13, fontWeight: '700', color: C.textSub },
  quickBtnTextActive:{ color: C.primary },
  primaryBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16 },
  primaryBtnDisabled:{ opacity: 0.4 },
  primaryBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  dangerBtn:         { backgroundColor: C.danger },
  summaryPill:       { backgroundColor: C.primaryLight, borderRadius: 12, padding: 14, alignItems: 'center' },
  summaryText:       { fontSize: 14, fontWeight: '600', color: C.primary },
  analyzingBox:      { backgroundColor: C.surface, borderRadius: 16, padding: 32, alignItems: 'center', gap: 12 },
  spinner:           { width: 64, height: 64, borderRadius: 20, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  analyzingTitle:    { fontSize: 16, fontWeight: '700', color: C.text },
  analyzingDesc:     { fontSize: 13, color: C.textSub, textAlign: 'center' },
  riskCard:          { borderRadius: 14, padding: 24, alignItems: 'center', gap: 6 },
  riskScore:         { fontSize: 40, fontWeight: '800' },
  riskLabel:         { fontSize: 14, fontWeight: '700' },
  flagCard:          { backgroundColor: C.warningLight, borderRadius: 14, padding: 14, gap: 10 },
  flagHeader:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flagTitle:         { fontSize: 13, fontWeight: '700', color: C.warning },
  flagItem:          { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  flagDot:           { width: 5, height: 5, borderRadius: 3, backgroundColor: C.warning, marginTop: 5, flexShrink: 0 },
  flagText:          { fontSize: 12, color: '#92400E', flex: 1, lineHeight: 18 },
  clearCard:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.successLight, borderRadius: 14, padding: 14 },
  clearText:         { fontSize: 14, fontWeight: '600', color: C.success },
  confirmCard:       { backgroundColor: C.surface, borderRadius: 14, padding: 18, gap: 0, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  confirmRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  confirmKey:        { fontSize: 13, color: C.textSub },
  confirmVal:        { fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'right', flex: 1, marginLeft: 16 },
  pinLabel:          { fontSize: 14, fontWeight: '700', color: C.text, textAlign: 'center' },
  pinDots:           { flexDirection: 'row', justifyContent: 'center', gap: 18 },
  pinDot:            { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: C.border },
  pinDotFilled:      { backgroundColor: C.primary, borderColor: C.primary },
  numpad:            { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  numKey:            { width: 76, height: 76, borderRadius: 38, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  numKeyText:        { fontSize: 22, fontWeight: '500', color: C.text },
  resultBox:         { alignItems: 'center', gap: 16, paddingVertical: 20 },
  resultIcon:        { width: 100, height: 100, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  resultTitle:       { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center' },
  resultDesc:        { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  refCard:           { backgroundColor: C.surface, borderRadius: 14, padding: 16, width: '100%', gap: 6, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  refLabel:          { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  refValue:          { fontSize: 16, fontWeight: '800', color: C.text },
  refDivider:        { height: 1, backgroundColor: C.border },
  refRow:            { flexDirection: 'row', alignItems: 'center', gap: 6 },
  refHash:           { flex: 1, fontSize: 11, fontFamily: 'monospace', color: C.success },
  refHashLabel:      { fontSize: 11, fontWeight: '700', color: C.success },
});
