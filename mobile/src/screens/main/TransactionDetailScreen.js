import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Alert, StatusBar,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import Loading from '../../components/Loading';

const C = {
  primary:      '#1652F0',
  primaryLight: '#EBF0FE',
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
  late_night:                  'Late-night transaction (22:00–05:00)',
  amount_above_2000_ghs:       'Amount above GHS 2,000',
  new_recipient:               'New recipient — no prior transactions',
  amount_3x_avg:               'Amount 3× your rolling average',
  amount_3x_rolling_avg:       'Amount exceeds 3× rolling average',
  rapid_succession:            'Multiple transactions in quick succession',
  recipient_flagged:           'Recipient flagged in recent alerts',
  recipient_flagged_in_alerts: 'Recipient flagged in recent alerts',
};

function fmtMoney(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function fmtDateTime(ts) {
  return new Date(ts).toLocaleString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function riskStyle(score) {
  if (score < 30) return { label: 'Low',    color: C.success, bg: C.successLight };
  if (score < 70) return { label: 'Medium', color: C.warning, bg: C.warningLight };
  return              { label: 'High',   color: C.danger,  bg: C.dangerLight  };
}

function statusStyle(s) {
  if (s === 'completed') return { label: 'Completed',    color: C.success, bg: C.successLight, icon: 'checkmark-circle' };
  if (s === 'review')    return { label: 'Under Review', color: C.warning, bg: C.warningLight, icon: 'time' };
  return                        { label: 'Blocked',      color: C.danger,  bg: C.dangerLight,  icon: 'close-circle' };
}

function categoryIcon(cat) {
  if (cat === 'MERCHANT') return 'storefront-outline';
  if (cat === 'AGENT')    return 'business-outline';
  return 'swap-horizontal-outline';
}

function Row({ label, value, mono, valueColor }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowKey}>{label}</Text>
      <Text style={[styles.rowVal, mono && styles.rowMono, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

export default function TransactionDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { data: txn, loading } = useApi(`/api/transactions/${id}`);

  async function copyHash() {
    if (!txn?.blockchain_hash) return;
    await Clipboard.setStringAsync(txn.blockchain_hash);
    Alert.alert('Copied', 'Blockchain hash copied to clipboard.');
  }

  if (loading || !txn) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Detail</Text>
        </View>
        <Loading />
      </SafeAreaView>
    );
  }

  const risk   = riskStyle(txn.risk_score);
  const status = statusStyle(txn.status);
  const reasons = txn.metadata?.reasons ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Detail</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Amount hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name={categoryIcon(txn.category)} size={28} color={C.primary} />
          </View>
          <Text style={styles.heroAmount}>−{fmtMoney(txn.amount)}</Text>

          {/* From → To */}
          <View style={styles.transferRow}>
            <View style={styles.transferParty}>
              <Text style={styles.transferLabel}>From</Text>
              <Text style={styles.transferName} numberOfLines={1}>{txn.sender_name ?? 'You'}</Text>
              <Text style={styles.transferPhone}>{txn.sender_phone ?? ''}</Text>
            </View>
            <View style={styles.transferArrow}>
              <Ionicons name="arrow-forward" size={18} color={C.primary} />
            </View>
            <View style={styles.transferParty}>
              <Text style={styles.transferLabel}>To</Text>
              <Text style={styles.transferName} numberOfLines={1}>{txn.recipient_name ?? txn.recipient_phone}</Text>
              <Text style={styles.transferPhone}>{txn.recipient_phone}</Text>
            </View>
          </View>

          <Text style={styles.heroDate}>{fmtDateTime(txn.created_at)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Risk analysis */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Risk Analysis</Text>
          <View style={[styles.riskRow, { backgroundColor: risk.bg }]}>
            <View style={styles.riskLeft}>
              <Text style={[styles.riskScore, { color: risk.color }]}>{txn.risk_score}%</Text>
              <Text style={[styles.riskLabel, { color: risk.color }]}>{risk.label} Risk</Text>
            </View>
            <View style={styles.riskBar}>
              <View style={[styles.riskFill, { width: `${txn.risk_score}%`, backgroundColor: risk.color }]} />
            </View>
          </View>
          {reasons.length > 0 ? (
            <View style={styles.flagBox}>
              <View style={styles.flagHeader}>
                <Ionicons name="warning" size={14} color={C.warning} />
                <Text style={styles.flagTitle}>Risk factors detected</Text>
              </View>
              {reasons.map(r => (
                <View key={r} style={styles.flagItem}>
                  <View style={styles.flagDot} />
                  <Text style={styles.flagText}>{REASON_LABELS[r] ?? r}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.clearRow}>
              <Ionicons name="checkmark-circle" size={16} color={C.success} />
              <Text style={styles.clearText}>No anomalies detected</Text>
            </View>
          )}
        </View>

        {/* Transaction details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          <View style={styles.table}>
            <Row label="Reference"  value={txn.reference}          mono />
            <Row label="Category"   value={txn.category} />
            <Row label="Status"     value={status.label}           valueColor={status.color} />
            <Row label="Sender"     value={txn.sender_name ?? 'You'} />
            <Row label="From"       value={txn.sender_phone ?? ''} />
            <Row label="Recipient"  value={txn.recipient_name ?? txn.recipient_phone} />
            <Row label="To"         value={txn.recipient_phone} />
            <Row label="Date"       value={fmtDateTime(txn.created_at)} />
            <Row label="AI Flagged" value={txn.ai_flagged ? 'Yes' : 'No'} valueColor={txn.ai_flagged ? C.danger : C.success} />
          </View>
        </View>

        {/* Blockchain */}
        <View style={[styles.card, styles.chainCard]}>
          <View style={styles.chainHeader}>
            <View style={styles.chainTitleRow}>
              <Ionicons name="link" size={16} color={C.success} />
              <Text style={styles.cardTitle}>Blockchain Record</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={12} color={C.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          {txn.blockchain_hash ? (
            <>
              <View style={styles.hashBox}>
                <Text style={styles.hashLabel}>SHA-256 Hash</Text>
                <Text style={styles.hashValue} numberOfLines={2}>{txn.blockchain_hash}</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={copyHash} activeOpacity={0.7}>
                <Ionicons name="copy-outline" size={16} color={C.success} />
                <Text style={styles.copyBtnText}>Copy Hash</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.hashPending}>Blockchain entry pending</Text>
          )}

          <Text style={styles.chainNote}>
            This transaction is permanently recorded and cannot be altered.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:      { width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: C.text },
  scroll:       { padding: 16, gap: 12 },
  hero:         { backgroundColor: C.surface, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  heroIcon:     { width: 60, height: 60, borderRadius: 18, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroAmount:   { fontSize: 30, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  heroRecipient:{ fontSize: 15, fontWeight: '600', color: C.text },
  heroDate:     { fontSize: 13, color: C.textSub },
  transferRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.bg, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, marginTop: 4 },
  transferParty:{ flex: 1, alignItems: 'center' },
  transferLabel:{ fontSize: 11, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 },
  transferName: { fontSize: 13, fontWeight: '700', color: C.text, textAlign: 'center' },
  transferPhone:{ fontSize: 11, color: C.textSub, textAlign: 'center', marginTop: 1 },
  transferArrow:{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, marginTop: 4 },
  statusText:   { fontSize: 13, fontWeight: '700' },
  card:         { backgroundColor: C.surface, borderRadius: 16, padding: 18, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: C.text },
  riskRow:      { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, gap: 14 },
  riskLeft:     { alignItems: 'center', gap: 2, minWidth: 48 },
  riskScore:    { fontSize: 22, fontWeight: '800' },
  riskLabel:    { fontSize: 11, fontWeight: '700' },
  riskBar:      { flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' },
  riskFill:     { height: 6, borderRadius: 3 },
  flagBox:      { backgroundColor: C.warningLight, borderRadius: 12, padding: 12, gap: 8 },
  flagHeader:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flagTitle:    { fontSize: 13, fontWeight: '700', color: C.warning },
  flagItem:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  flagDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: C.warning, marginTop: 5, flexShrink: 0 },
  flagText:     { fontSize: 12, color: '#92400E', flex: 1, lineHeight: 18 },
  clearRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearText:    { fontSize: 13, fontWeight: '600', color: C.success },
  table:        { gap: 2 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  rowKey:       { fontSize: 13, color: C.textSub },
  rowVal:       { fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'right', flex: 1, marginLeft: 16 },
  rowMono:      { fontFamily: 'monospace', fontSize: 12 },
  chainCard:    { borderWidth: 1, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  chainHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chainTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  verifiedText: { fontSize: 12, fontWeight: '700', color: C.success },
  hashBox:      { backgroundColor: '#fff', borderRadius: 10, padding: 12, gap: 4 },
  hashLabel:    { fontSize: 11, color: C.textSub, fontWeight: '600' },
  hashValue:    { fontSize: 11, fontFamily: 'monospace', color: C.primary, lineHeight: 16 },
  copyBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 10, padding: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#BBF7D0' },
  copyBtnText:  { fontSize: 13, fontWeight: '600', color: C.success },
  hashPending:  { fontSize: 13, color: C.textMuted },
  chainNote:    { fontSize: 12, color: '#166534', lineHeight: 18 },
});
