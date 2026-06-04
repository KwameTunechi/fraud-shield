import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Alert, Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../hooks/useApi';
import Loading from '../../components/Loading';

function fmtAmount(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function fmtDate(ts) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function riskStyle(score) {
  if (score < 30) return { label: 'Low',    color: '#16a34a', bg: '#f0fdf4', dot: '#22c55e' };
  if (score < 70) return { label: 'Medium', color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' };
  return              { label: 'High',   color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' };
}

function statusStyle(s) {
  if (s === 'completed') return { label: 'Completed', color: '#16a34a', bg: '#dcfce7' };
  if (s === 'review')    return { label: 'Under Review', color: '#d97706', bg: '#fef3c7' };
  return                        { label: 'Blocked',   color: '#dc2626', bg: '#fee2e2' };
}

function txEmoji(cat) {
  return cat === 'MERCHANT' ? '🛍️' : cat === 'AGENT' ? '🏦' : '💸';
}

const REASON_LABELS = {
  late_night:            'Late-night transaction (22:00–05:00)',
  amount_above_2000_ghs: 'Amount above GHS 2,000',
  new_recipient:         'New recipient — no prior transactions',
  amount_3x_avg:         'Amount 3× rolling average',
  rapid_succession:      'Multiple transactions in quick succession',
  recipient_flagged:     'Recipient flagged in recent alerts',
};

export default function TransactionDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { data: txn, loading } = useApi(`/api/transactions/${id}`);

  function copyHash() {
    if (!txn?.blockchain_hash) return;
    Clipboard.setString(txn.blockchain_hash);
    Alert.alert('Copied', 'Blockchain hash copied to clipboard.');
  }

  if (loading || !txn) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Detail</Text>
        </LinearGradient>
        <Loading />
      </SafeAreaView>
    );
  }

  const risk   = riskStyle(txn.risk_score);
  const status = statusStyle(txn.status);
  const reasons = txn.metadata?.reasons ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Detail</Text>
        <Text style={styles.txRef}>{txn.reference}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Amount card */}
        <View style={styles.amountCard}>
          <Text style={styles.emojiLarge}>{txEmoji(txn.category)}</Text>
          <Text style={styles.amount}>−{fmtAmount(txn.amount)}</Text>
          <Text style={styles.name}>{txn.recipient_phone}</Text>
          <Text style={styles.time}>{fmtDate(txn.created_at)}</Text>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* AI analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Risk Analysis</Text>
          <View style={[styles.riskRow, { backgroundColor: risk.bg }]}>
            <View style={[styles.dot, { backgroundColor: risk.dot }]} />
            <Text style={[styles.riskScore, { color: risk.color }]}>
              Risk Score: {txn.risk_score}% — {risk.label}
            </Text>
          </View>
          {reasons.length > 0 ? (
            <View style={styles.flagCard}>
              <Text style={styles.flagTitle}>⚠️ Risk Factors</Text>
              {reasons.map(r => (
                <Text key={r} style={styles.flagReason}>• {REASON_LABELS[r] ?? r}</Text>
              ))}
            </View>
          ) : (
            <Text style={styles.clearText}>✅ No anomalies detected by AI model</Text>
          )}
        </View>

        {/* Transaction details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          <View style={styles.detailTable}>
            {[
              { k: 'Category',  v: txn.category },
              { k: 'Status',    v: status.label },
              { k: 'Recipient', v: txn.recipient_phone },
              { k: 'Date',      v: fmtDate(txn.created_at) },
            ].map(({ k, v }) => (
              <View key={k} style={styles.detailRow}>
                <Text style={styles.detailKey}>{k}</Text>
                <Text style={styles.detailVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Blockchain */}
        <View style={[styles.section, styles.blockchainCard]}>
          <View style={styles.blockchainHeader}>
            <Text style={styles.sectionTitle}>🔗 Blockchain Audit Trail</Text>
            {txn.blockchain_hash && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>

          {txn.blockchain_hash ? (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Hash</Text>
                <Text style={[styles.detailVal, { fontFamily: 'monospace', color: '#4338ca', fontSize: 11 }]}>
                  {txn.blockchain_hash.slice(0, 16)}…{txn.blockchain_hash.slice(-8)}
                </Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={copyHash}>
                <Text style={styles.copyBtnText}>📋 Copy Full Hash</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.hashPending}>Blockchain entry pending…</Text>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Immutable</Text>
            <Text style={styles.detailVal}>Yes — cannot be altered</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Network</Text>
            <Text style={styles.detailVal}>Telecel Permissioned Chain</Text>
          </View>
          <Text style={styles.blockchainNote}>
            This transaction is permanently recorded on an immutable blockchain ledger for dispute resolution and fraud forensics.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#f8fafc' },
  header:           { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, gap: 4 },
  back:             { alignSelf: 'flex-start', marginBottom: 6 },
  backText:         { color: '#a5b4fc', fontSize: 14 },
  headerTitle:      { fontSize: 20, fontWeight: '800', color: '#fff' },
  txRef:            { fontSize: 12, color: '#a5b4fc', fontFamily: 'monospace' },
  amountCard:       { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  emojiLarge:       { fontSize: 44 },
  amount:           { fontSize: 34, fontWeight: '800', color: '#0f172a' },
  name:             { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  time:             { fontSize: 12, color: '#94a3b8' },
  statusPill:       { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, marginTop: 4 },
  statusText:       { fontSize: 13, fontWeight: '700' },
  section:          { backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionTitle:     { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  riskRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
  dot:              { width: 10, height: 10, borderRadius: 5 },
  riskScore:        { fontSize: 14, fontWeight: '700' },
  flagCard:         { backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, gap: 4, borderWidth: 1, borderColor: '#fde68a' },
  flagTitle:        { fontSize: 13, fontWeight: '700', color: '#d97706' },
  flagReason:       { fontSize: 12, color: '#92400e', lineHeight: 18 },
  clearText:        { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  detailTable:      { gap: 8 },
  detailRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  detailKey:        { fontSize: 13, color: '#64748b' },
  detailVal:        { fontSize: 13, fontWeight: '600', color: '#0f172a', textAlign: 'right', flex: 1, marginLeft: 12 },
  blockchainCard:   { borderWidth: 1, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' },
  blockchainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verifiedBadge:    { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  verifiedText:     { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  copyBtn:          { backgroundColor: '#fff', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  copyBtnText:      { fontSize: 13, fontWeight: '600', color: '#059669' },
  hashPending:      { fontSize: 12, color: '#94a3b8' },
  blockchainNote:   { fontSize: 12, color: '#166534', lineHeight: 18, marginTop: 4 },
});
