import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtAmount(n) {
  return '₵' + Math.abs(Number(n)).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function fmtRelative(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function riskColor(score) {
  return score < 30 ? '#16a34a' : score < 70 ? '#d97706' : '#dc2626';
}
function statusColor(s) {
  return s === 'completed' ? '#16a34a' : s === 'review' ? '#d97706' : '#dc2626';
}
function txEmoji(cat) {
  return cat === 'MERCHANT' ? '🛍️' : cat === 'AGENT' ? '🏦' : '💸';
}

// ── component ─────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);

  const { data: txData,    loading: txLoading,    reload: reloadTx }    = useApi('/api/transactions?limit=5');
  const { data: alertData, loading: alertLoading, reload: reloadAlerts } = useApi('/api/alerts?limit=3');

  const transactions = txData?.transactions   ?? [];
  const alerts       = alertData?.alerts       ?? [];
  const unread       = alerts.filter(a => !a.read).length;
  const refreshing   = txLoading || alertLoading;

  function onRefresh() { reloadTx(); reloadAlerts(); }

  function alertStyle(severity) {
    const map = {
      critical: { bg: '#fef2f2', border: '#fecaca', icon: '🚨', color: '#dc2626' },
      high:     { bg: '#fff7ed', border: '#fed7aa', icon: '⚠️', color: '#d97706' },
      medium:   { bg: '#fffbeb', border: '#fde68a', icon: '⚠️', color: '#d97706' },
      low:      { bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ️', color: '#2563eb' },
    };
    return map[severity] ?? map.low;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <LinearGradient colors={['#1e3a8a', '#4338ca', '#0d9488']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good morning 👋</Text>
              <Text style={styles.userName}>{user?.fullName ?? 'Customer'}</Text>
            </View>
            <TouchableOpacity style={styles.bellWrap}>
              <Text style={styles.bell}>🔔</Text>
              {unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeNum}>{unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Balance card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceTop}>
              <View>
                <Text style={styles.balLabel}>Available Balance</Text>
                <Text style={styles.balance}>
                  {balanceVisible ? fmtAmount(user?.balance ?? 0) : '₵ ••••••'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setBalanceVisible(v => !v)}>
                <Text style={styles.eye}>{balanceVisible ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.balanceFooter}>
              <Text style={styles.network}>📱 Telecel Cash</Text>
              <View style={styles.trustPill}>
                <Text style={styles.trustText}>🛡️ Trust: {user?.trustScore ?? 0}%</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Status chips */}
          <View style={styles.chips}>
            <View style={[styles.chip, { backgroundColor: '#faf5ff' }]}>
              <Text style={styles.chipText}>🤖 AI Active</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: '#f0fdf4' }]}>
              <Text style={styles.chipText}>🔗 Blockchain ✓</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: '#eff6ff' }]}>
              <Text style={styles.chipText}>🔒 MFA On</Text>
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('SendMoney')}>
              <LinearGradient colors={['#4338ca', '#6366f1']} style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>↗️</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>Send</Text>
            </TouchableOpacity>
            {[
              { label: 'Receive', emoji: '↙️', colors: ['#0d9488', '#059669'] },
              { label: 'Airtime', emoji: '📱', colors: ['#f59e0b', '#d97706'] },
              { label: 'Pay Bill', emoji: '💸', colors: ['#ec4899', '#db2777'] },
            ].map(({ label, emoji, colors }) => (
              <View key={label} style={styles.action}>
                <LinearGradient colors={colors} style={styles.actionIcon}>
                  <Text style={styles.actionEmoji}>{emoji}</Text>
                </LinearGradient>
                <Text style={styles.actionLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Recent alerts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Alerts</Text>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            {!alertLoading && alerts.length === 0 && (
              <Text style={styles.emptyText}>No alerts. System is clean ✅</Text>
            )}
            {alerts.map(a => {
              const s = alertStyle(a.severity);
              return (
                <View key={a.id} style={[styles.alertCard, { backgroundColor: s.bg, borderColor: s.border }]}>
                  <Text style={styles.alertIcon}>{s.icon}</Text>
                  <View style={styles.alertBody}>
                    <Text style={[styles.alertTitle, { color: s.color }]}>{a.title}</Text>
                    <Text style={styles.alertDesc} numberOfLines={1}>{a.description}</Text>
                  </View>
                  <Text style={styles.alertTime}>{fmtRelative(a.created_at)}</Text>
                </View>
              );
            })}
          </View>

          {/* Recent transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Transactions')}>
                <Text style={styles.viewAll}>View all →</Text>
              </TouchableOpacity>
            </View>
            {!txLoading && transactions.length === 0 && (
              <Text style={styles.emptyText}>No transactions yet.</Text>
            )}
            {transactions.map(txn => (
              <View key={txn.id} style={styles.txRow}>
                <View style={styles.txEmoji}>
                  <Text style={{ fontSize: 20 }}>{txEmoji(txn.category)}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txName}>{txn.recipient_phone}</Text>
                  <Text style={styles.txMeta}>{txn.category} · {fmtRelative(txn.created_at)}</Text>
                  <View style={styles.txTags}>
                    <Text style={[styles.txRisk, { color: riskColor(txn.risk_score) }]}>
                      Risk: {txn.risk_score}%
                    </Text>
                    <Text style={[styles.txStatus, { color: statusColor(txn.status) }]}>
                      ● {txn.status}
                    </Text>
                    {txn.blockchain_hash && <Text style={styles.txChain}>🔗</Text>}
                  </View>
                </View>
                <Text style={styles.txAmount}>−{fmtAmount(txn.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#f8fafc' },
  header:        { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 20, gap: 16 },
  headerTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting:      { fontSize: 13, color: '#a5b4fc' },
  userName:      { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 2 },
  bellWrap:      { position: 'relative', padding: 4 },
  bell:          { fontSize: 22 },
  badge:         { position: 'absolute', top: 0, right: 0, backgroundColor: '#ef4444', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeNum:      { color: '#fff', fontSize: 10, fontWeight: '700' },
  balanceCard:   { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', gap: 12 },
  balanceTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balLabel:      { fontSize: 12, color: '#a5b4fc' },
  balance:       { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 2 },
  eye:           { fontSize: 22 },
  balanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  network:       { fontSize: 12, color: '#c7d2fe' },
  trustPill:     { backgroundColor: 'rgba(34,197,94,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)' },
  trustText:     { fontSize: 12, color: '#4ade80', fontWeight: '600' },
  body:          { padding: 16, gap: 20 },
  chips:         { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText:      { fontSize: 12, fontWeight: '600', color: '#374151' },
  actions:       { flexDirection: 'row', justifyContent: 'space-between' },
  action:        { alignItems: 'center', gap: 8, flex: 1 },
  actionIcon:    { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionEmoji:   { fontSize: 24 },
  actionLabel:   { fontSize: 12, fontWeight: '600', color: '#374151' },
  section:       { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  livePill:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  liveDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  liveText:      { fontSize: 10, fontWeight: '700', color: '#16a34a' },
  viewAll:       { fontSize: 13, color: '#4338ca', fontWeight: '600' },
  emptyText:     { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 12 },
  alertCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  alertIcon:     { fontSize: 20 },
  alertBody:     { flex: 1, gap: 2 },
  alertTitle:    { fontSize: 13, fontWeight: '700' },
  alertDesc:     { fontSize: 12, color: '#64748b' },
  alertTime:     { fontSize: 11, color: '#94a3b8' },
  txRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 14, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  txEmoji:       { width: 42, height: 42, borderRadius: 13, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  txInfo:        { flex: 1, gap: 2 },
  txName:        { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  txMeta:        { fontSize: 11, color: '#94a3b8' },
  txTags:        { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 2 },
  txRisk:        { fontSize: 11, fontWeight: '600' },
  txStatus:      { fontSize: 11, fontWeight: '600' },
  txChain:       { fontSize: 11 },
  txAmount:      { fontSize: 14, fontWeight: '700', color: '#0f172a' },
});
