import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatCurrency, getRiskLabel, getStatusStyle, shortenHash } from '../../utils/fraudSimulator';

export default function TransactionDetailScreen({ route, navigation }) {
  const { txn } = route.params;
  const risk = getRiskLabel(txn.risk);
  const status = getStatusStyle(txn.status);
  const isPositive = txn.amount > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Detail</Text>
        <Text style={styles.txId}>{txn.id}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.emojiLarge}>{txn.emoji}</Text>
          <Text style={[styles.amount, { color: isPositive ? '#16a34a' : '#0f172a' }]}>
            {isPositive ? '+' : ''}{formatCurrency(txn.amount)}
          </Text>
          <Text style={styles.name}>{txn.name}</Text>
          <Text style={styles.time}>{txn.displayTime}</Text>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* AI analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Risk Analysis</Text>
          <View style={[styles.riskRow, { backgroundColor: risk.bg }]}>
            <View style={[styles.dot, { backgroundColor: risk.dot }]} />
            <Text style={[styles.riskScore, { color: risk.color }]}>Risk Score: {txn.risk}% — {risk.label}</Text>
          </View>
          {txn.aiFlag && (
            <View style={styles.flagCard}>
              <Text style={styles.flagTitle}>⚠️ AI Flag Raised</Text>
              <Text style={styles.flagReason}>{txn.aiFlagReason}</Text>
            </View>
          )}
          {!txn.aiFlag && (
            <Text style={styles.clearText}>✅ No anomalies detected by AI model</Text>
          )}
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          <View style={styles.detailTable}>
            {[
              { k: 'Category', v: txn.category },
              { k: 'Location', v: txn.location },
              { k: 'Phone', v: txn.phone },
              { k: 'Time', v: txn.displayTime },
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
            {txn.blockchainVerified && (
              <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verified</Text></View>
            )}
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Block Hash</Text>
            <Text style={[styles.detailVal, { fontFamily: 'monospace', color: '#4338ca' }]}>{shortenHash(txn.blockchainHash)}</Text>
          </View>
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
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, gap: 4 },
  back: { alignSelf: 'flex-start', marginBottom: 6 },
  backText: { color: '#a5b4fc', fontSize: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  txId: { fontSize: 12, color: '#a5b4fc' },
  amountCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  emojiLarge: { fontSize: 44 },
  amount: { fontSize: 34, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  time: { fontSize: 12, color: '#94a3b8' },
  statusPill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, marginTop: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  riskScore: { fontSize: 14, fontWeight: '700' },
  flagCard: { backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, gap: 4, borderWidth: 1, borderColor: '#fde68a' },
  flagTitle: { fontSize: 13, fontWeight: '700', color: '#d97706' },
  flagReason: { fontSize: 12, color: '#92400e', lineHeight: 18 },
  clearText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  detailTable: { gap: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  detailKey: { fontSize: 13, color: '#64748b' },
  detailVal: { fontSize: 13, fontWeight: '600', color: '#0f172a', textAlign: 'right', flex: 1, marginLeft: 12 },
  blockchainCard: { borderWidth: 1, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' },
  blockchainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verifiedBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  verifiedText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  blockchainNote: { fontSize: 12, color: '#166534', lineHeight: 18, marginTop: 4 },
});
