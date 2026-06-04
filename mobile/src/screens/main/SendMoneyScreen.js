import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { contacts } from '../../data/mockData';

const STEPS = ['recipient', 'amount', 'ai_check', 'confirm', 'result'];

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtAmount(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function normalizePhone(raw) {
  const stripped = raw.replace(/\s/g, '');
  return stripped.startsWith('+') ? stripped : '+233' + stripped.replace(/^0/, '');
}

const REASON_LABELS = {
  late_night:            'Late-night transaction (22:00–05:00)',
  amount_above_2000_ghs: 'Amount above GHS 2,000',
  new_recipient:         'New recipient — no prior transactions',
  amount_3x_avg:         'Amount 3× your rolling average',
  rapid_succession:      'Multiple transactions in quick succession',
  recipient_flagged:     'Recipient flagged in recent alerts',
};

function riskInfo(score) {
  if (score < 30) return { label: 'Low Risk',    color: '#16a34a', bg: '#f0fdf4' };
  if (score < 70) return { label: 'Medium Risk', color: '#d97706', bg: '#fffbeb' };
  return              { label: 'High Risk',   color: '#dc2626', bg: '#fef2f2' };
}

// ── component ─────────────────────────────────────────────────────────────────

export default function SendMoneyScreen({ navigation }) {
  const { user } = useAuth();

  const [step,       setStep]       = useState(0);
  const [recipient,  setRecipient]  = useState(null);
  const [phone,      setPhone]      = useState('');
  const [amount,     setAmount]     = useState('');
  const [note,       setNote]       = useState('');
  const [preview,    setPreview]    = useState(null);   // { score, status, reasons }
  const [analyzing,  setAnalyzing]  = useState(false);
  const [pinInput,   setPinInput]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);   // real transaction from API

  // Step 1 → 2: call preview endpoint
  async function handleAmountNext() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { Alert.alert('Invalid amount', 'Enter a valid amount.'); return; }
    if (user?.balance && num > Number(user.balance)) {
      Alert.alert('Insufficient balance', 'Amount exceeds your available balance.'); return;
    }
    setStep(2);
    setAnalyzing(true);
    try {
      const recipientPhone = normalizePhone(phone);
      const data = await api.post('/api/transactions/preview', {
        recipientPhone,
        amount: num,
      });
      setPreview(data);
    } catch (err) {
      Alert.alert('AI Check Failed', err.message ?? 'Could not analyse transaction.');
      setStep(1);
    } finally {
      setAnalyzing(false);
    }
  }

  // Step 3 → POST real transaction
  async function handleConfirm() {
    if (pinInput.length < 4) return;
    setSubmitting(true);
    try {
      const recipientPhone = normalizePhone(phone);
      const { transaction } = await api.post('/api/transactions', {
        recipientPhone,
        amount: parseFloat(amount),
        category: 'P2P',
      });
      setResult(transaction);
      setStep(4);
    } catch (err) {
      Alert.alert('Transaction Failed', err.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(0); setRecipient(null); setPhone(''); setAmount('');
    setNote(''); setPreview(null); setPinInput(''); setResult(null);
  }

  const risk = preview ? riskInfo(preview.score) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.header}>
        <TouchableOpacity
          onPress={() => step === 0 ? navigation.goBack() : setStep(s => s - 1)}
          style={styles.back}
        >
          <Text style={styles.backText}>← {step === 0 ? 'Back' : 'Previous'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
        <View style={styles.stepDots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.stepDot, i <= step && styles.stepDotActive]} />
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">

        {/* Step 0: Choose recipient */}
        {step === 0 && (
          <>
            <Text style={styles.stepTitle}>Who are you sending to?</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number (+233...)"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <Text style={styles.label}>Recent Contacts</Text>
            {contacts.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.contactRow, recipient?.id === c.id && styles.contactSelected]}
                onPress={() => { setRecipient(c); setPhone(c.phone); }}
              >
                <View style={styles.avatar}><Text style={styles.avatarText}>{c.initials}</Text></View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={styles.contactPhone}>{c.phone} · {c.network}</Text>
                </View>
                {recipient?.id === c.id && <Text>✅</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.btn}
              onPress={() => phone.length >= 9 ? setStep(1) : Alert.alert('Select a contact or enter a phone number')}
            >
              <LinearGradient colors={['#4338ca', '#0d9488']} style={styles.btnGrad}>
                <Text style={styles.btnText}>Next →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Step 1: Enter amount */}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>How much?</Text>
            <View style={styles.recipientPill}>
              <View style={styles.pillAvatar}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{recipient?.initials ?? '?'}</Text>
              </View>
              <Text style={styles.pillName}>{recipient?.name ?? phone}</Text>
            </View>
            <View style={styles.amountWrap}>
              <Text style={styles.cedi}>₵</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>
            <Text style={styles.balHint}>Balance: {fmtAmount(user?.balance ?? 0)}</Text>
            <View style={styles.quickAmounts}>
              {['50', '100', '200', '500'].map(a => (
                <TouchableOpacity key={a} style={styles.quickAmt} onPress={() => setAmount(a)}>
                  <Text style={styles.quickAmtText}>₵{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Add a note (optional)" value={note} onChangeText={setNote} />
            <TouchableOpacity style={styles.btn} onPress={handleAmountNext}>
              <LinearGradient colors={['#4338ca', '#0d9488']} style={styles.btnGrad}>
                <Text style={styles.btnText}>Analyse with AI →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Step 2: AI analysis result */}
        {step === 2 && (
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>🤖 AI Risk Analysis</Text>
            {analyzing ? (
              <View style={styles.aiLoading}>
                <Text style={styles.aiLoadingIcon}>⏳</Text>
                <Text style={styles.aiLoadingText}>Analysing transaction pattern…</Text>
                <Text style={styles.aiLoadingSub}>Checking time · recipient · amount · history</Text>
              </View>
            ) : preview && (
              <>
                <View style={[styles.riskBadge, { backgroundColor: risk.bg }]}>
                  <Text style={[styles.riskScore, { color: risk.color }]}>{preview.score}%</Text>
                  <Text style={[styles.riskLabel, { color: risk.color }]}>Risk Score — {risk.label}</Text>
                </View>
                {preview.reasons.length > 0 ? (
                  <>
                    <Text style={styles.flagsTitle}>⚠️ Risk Factors Detected</Text>
                    {preview.reasons.map(r => (
                      <Text key={r} style={styles.flagItem}>• {REASON_LABELS[r] ?? r}</Text>
                    ))}
                  </>
                ) : (
                  <Text style={styles.clearText}>✅ No suspicious patterns detected</Text>
                )}
                <TouchableOpacity style={styles.btn} onPress={() => setStep(3)}>
                  <LinearGradient
                    colors={preview.score >= 70 ? ['#dc2626', '#b91c1c'] : ['#4338ca', '#0d9488']}
                    style={styles.btnGrad}
                  >
                    <Text style={styles.btnText}>
                      {preview.score >= 70 ? 'Proceed Anyway (Risky)' : 'Confirm Transaction →'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Step 3: PIN confirm */}
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Confirm &amp; Authorise</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}><Text style={styles.sumKey}>To</Text><Text style={styles.sumVal}>{recipient?.name ?? phone}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.sumKey}>Amount</Text><Text style={[styles.sumVal, { color: '#dc2626' }]}>{fmtAmount(parseFloat(amount))}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.sumKey}>Network</Text><Text style={styles.sumVal}>{recipient?.network ?? 'Telecel Cash'}</Text></View>
              {note ? <View style={styles.summaryRow}><Text style={styles.sumKey}>Note</Text><Text style={styles.sumVal}>{note}</Text></View> : null}
              <View style={styles.summaryRow}>
                <Text style={styles.sumKey}>Risk</Text>
                <Text style={[styles.sumVal, { color: risk?.color }]}>{preview?.score ?? 0}% — {risk?.label}</Text>
              </View>
            </View>
            <Text style={styles.pinLabel}>Enter PIN to authorise</Text>
            <View style={styles.pinDots}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={[styles.dot, pinInput.length > i && styles.dotFilled]} />
              ))}
            </View>
            <View style={styles.numpad}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.key, k === '' && { opacity: 0 }]}
                  onPress={() => k === '⌫' ? setPinInput(p => p.slice(0,-1)) : k && pinInput.length < 4 && setPinInput(p => p + k)}
                  disabled={k === ''}
                >
                  <Text style={styles.keyText}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.btn, (pinInput.length < 4 || submitting) && { opacity: 0.5 }]}
              onPress={handleConfirm}
              disabled={pinInput.length < 4 || submitting}
            >
              <LinearGradient colors={['#4338ca', '#0d9488']} style={styles.btnGrad}>
                <Text style={styles.btnText}>{submitting ? 'Sending…' : `Send ${fmtAmount(parseFloat(amount))}`}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Step 4: Result */}
        {step === 4 && result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultIcon}>
              {result.status === 'blocked' ? '🚫' : result.status === 'review' ? '⏳' : '✅'}
            </Text>
            <Text style={styles.resultTitle}>
              {result.status === 'blocked' ? 'Transaction Blocked'
                : result.status === 'review' ? 'Transaction Under Review'
                : 'Transaction Successful!'}
            </Text>
            <Text style={styles.resultSub}>
              {result.status === 'blocked'
                ? 'AI detected high fraud risk and blocked this transaction for your protection.'
                : result.status === 'review'
                ? 'This transaction has been flagged for manual review by our team.'
                : `${fmtAmount(result.amount)} sent to ${result.recipient_phone}`}
            </Text>

            {/* Real transaction ID + blockchain hash */}
            <View style={styles.txIdCard}>
              <Text style={styles.txIdLabel}>Transaction Reference</Text>
              <Text style={styles.txId}>{result.reference}</Text>
              {result.blockchain_hash && (
                <>
                  <Text style={styles.txIdLabel}>Blockchain Hash</Text>
                  <Text style={[styles.txId, { fontSize: 11, fontFamily: 'monospace', color: '#059669' }]}>
                    {result.blockchain_hash.slice(0, 16)}…{result.blockchain_hash.slice(-8)}
                  </Text>
                  <Text style={styles.txIdLabel}>🔗 Immutable record created on ledger</Text>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.btn} onPress={() => { reset(); navigation.goBack(); }}>
              <LinearGradient colors={['#4338ca', '#0d9488']} style={styles.btnGrad}>
                <Text style={styles.btnText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#f8fafc' },
  header:        { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, gap: 8 },
  back:          { alignSelf: 'flex-start' },
  backText:      { color: '#a5b4fc', fontSize: 14 },
  headerTitle:   { fontSize: 20, fontWeight: '800', color: '#fff' },
  stepDots:      { flexDirection: 'row', gap: 6 },
  stepDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  stepDotActive: { backgroundColor: '#fff' },
  body:          { flex: 1 },
  stepTitle:     { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  label:         { fontSize: 13, fontWeight: '600', color: '#475569' },
  input:         { backgroundColor: '#fff', borderRadius: 14, padding: 16, fontSize: 15, borderWidth: 1.5, borderColor: '#e2e8f0', color: '#0f172a' },
  contactRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0' },
  contactSelected:{ borderColor: '#4338ca', backgroundColor: '#eff6ff' },
  avatar:        { width: 42, height: 42, borderRadius: 21, backgroundColor: '#4338ca', alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  contactInfo:   { flex: 1 },
  contactName:   { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  contactPhone:  { fontSize: 12, color: '#64748b', marginTop: 2 },
  btn:           { borderRadius: 14, overflow: 'hidden' },
  btnGrad:       { paddingVertical: 16, alignItems: 'center' },
  btnText:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  recipientPill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#eff6ff', padding: 12, borderRadius: 14 },
  pillAvatar:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4338ca', alignItems: 'center', justifyContent: 'center' },
  pillName:      { fontSize: 15, fontWeight: '700', color: '#1e3a8a' },
  amountWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#e2e8f0', gap: 8 },
  cedi:          { fontSize: 28, fontWeight: '800', color: '#4338ca' },
  amountInput:   { flex: 1, fontSize: 32, fontWeight: '800', color: '#0f172a' },
  balHint:       { fontSize: 12, color: '#64748b' },
  quickAmounts:  { flexDirection: 'row', gap: 8 },
  quickAmt:      { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  quickAmtText:  { fontSize: 13, fontWeight: '700', color: '#4338ca' },
  aiCard:        { backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  aiTitle:       { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  aiLoading:     { alignItems: 'center', gap: 10, paddingVertical: 20 },
  aiLoadingIcon: { fontSize: 36 },
  aiLoadingText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  aiLoadingSub:  { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
  riskBadge:     { borderRadius: 14, padding: 16, alignItems: 'center', gap: 4 },
  riskScore:     { fontSize: 36, fontWeight: '800' },
  riskLabel:     { fontSize: 14, fontWeight: '600' },
  flagsTitle:    { fontSize: 14, fontWeight: '700', color: '#d97706' },
  flagItem:      { fontSize: 13, color: '#92400e', paddingLeft: 4 },
  clearText:     { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  summaryCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  sumKey:        { fontSize: 13, color: '#64748b' },
  sumVal:        { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  pinLabel:      { fontSize: 14, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  pinDots:       { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  dot:           { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#cbd5e1' },
  dotFilled:     { backgroundColor: '#4338ca', borderColor: '#4338ca' },
  numpad:        { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  key:           { width: 68, height: 68, borderRadius: 34, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  keyText:       { fontSize: 22, fontWeight: '600', color: '#0f172a' },
  resultCard:    { alignItems: 'center', gap: 16, paddingVertical: 20 },
  resultIcon:    { fontSize: 64 },
  resultTitle:   { fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  resultSub:     { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21 },
  txIdCard:      { backgroundColor: '#f0fdf4', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#bbf7d0' },
  txIdLabel:     { fontSize: 11, color: '#64748b' },
  txId:          { fontSize: 15, fontWeight: '800', color: '#0f172a' },
});
