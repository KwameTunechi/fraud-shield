import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, RefreshControl, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';

const C = {
  primary:       '#1652F0',
  primaryLight:  '#EBF0FE',
  success:       '#00875A',
  successLight:  '#E3F5F0',
  warning:       '#FF8B00',
  warningLight:  '#FFF3E0',
  danger:        '#DE350B',
  dangerLight:   '#FFEBE6',
  text:          '#0D1421',
  textSub:       '#6B7280',
  textMuted:     '#9CA3AF',
  bg:            '#F5F7FA',
  surface:       '#FFFFFF',
  border:        '#E8ECEF',
};

function fmtMoney(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function riskColor(score) {
  if (score < 30) return C.success;
  if (score < 70) return C.warning;
  return C.danger;
}

function statusColor(s) {
  if (s === 'completed') return C.success;
  if (s === 'review')    return C.warning;
  return C.danger;
}

function categoryIcon(cat) {
  if (cat === 'MERCHANT') return 'storefront-outline';
  if (cat === 'AGENT')    return 'business-outline';
  return 'swap-horizontal-outline';
}

function AlertBadge({ severity }) {
  const map = {
    critical: { bg: C.dangerLight,  color: C.danger,  icon: 'alert-circle' },
    high:     { bg: '#FFF3E0',       color: C.warning,  icon: 'warning' },
    medium:   { bg: '#FFF3E0',       color: C.warning,  icon: 'information-circle' },
    low:      { bg: C.primaryLight,  color: C.primary,  icon: 'information-circle-outline' },
  };
  const s = map[severity] ?? map.low;
  return (
    <View style={[styles.alertDot, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={14} color={s.color} />
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [balanceHidden, setBalanceHidden] = useState(false);

  const { data: txData,    loading: txLoading,    reload: reloadTx    } = useApi('/api/transactions?limit=5');
  const { data: alertData, loading: alertLoading, reload: reloadAlerts } = useApi('/api/alerts?limit=3');

  const transactions = txData?.transactions ?? [];
  const alerts       = alertData?.alerts    ?? [];
  const unreadCount  = alerts.filter(a => !a.read).length;

  function onRefresh() { reloadTx(); reloadAlerts(); }

  const ACTIONS = [
    { label: 'Send',    icon: 'arrow-up-outline',       onPress: () => navigation.navigate('SendMoney') },
    { label: 'Receive', icon: 'arrow-down-outline',     onPress: () => Alert.alert('Receive Money', `Share your number:\n${user?.phone ?? ''}`) },
    { label: 'Airtime', icon: 'phone-portrait-outline', onPress: () => Alert.alert('Airtime Top-up', 'Coming soon.') },
    { label: 'Pay Bill',icon: 'receipt-outline',        onPress: () => Alert.alert('Pay Bill', 'Coming soon.') },
  ];

  const initials = (user?.fullName ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Good {greeting()}</Text>
            <Text style={styles.userName}>{user?.fullName ?? 'Customer'}</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => Alert.alert('Alerts', alerts.length > 0 ? alerts.map(a => `• ${a.title}`).join('\n') : 'No new alerts.')}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              {balanceHidden ? '₵ ••••••' : fmtMoney(user?.balance ?? 0)}
            </Text>
            <TouchableOpacity onPress={() => setBalanceHidden(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons
                name={balanceHidden ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.balanceMeta}>
            <Text style={styles.balanceMetaText}>Telecel Cash  ·  {user?.phone}</Text>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#4ade80" />
              <Text style={styles.trustText}>Trust {user?.trustScore ?? 0}%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Quick actions — outside ScrollView so refresh gesture never blocks taps ── */}
      <View style={styles.actionsRow}>
        {ACTIONS.map(({ label, icon, onPress }) => (
          <TouchableOpacity key={label} style={styles.action} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.actionIcon}>
              <Ionicons name={icon} size={22} color={C.primary} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={txLoading || alertLoading} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* ── Alerts ──────────────────────────────────────────── */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Alerts</Text>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            {alerts.map(a => (
              <View key={a.id} style={styles.alertCard}>
                <AlertBadge severity={a.severity} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle} numberOfLines={1}>{a.title}</Text>
                  <Text style={styles.alertDesc}  numberOfLines={1}>{a.description}</Text>
                </View>
                <Text style={styles.alertTime}>{timeAgo(a.created_at)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Recent transactions ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Transactions')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {!txLoading && transactions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="swap-horizontal-outline" size={32} color={C.textMuted} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            <View style={styles.txList}>
              {transactions.map((tx, i) => (
                <TouchableOpacity
                  key={tx.id}
                  style={[styles.txRow, i < transactions.length - 1 && styles.txRowBorder]}
                  onPress={() => navigation.getParent()?.navigate('Transactions', { screen: 'TxDetail', params: { id: tx.id } })}
                  activeOpacity={0.7}
                >
                  <View style={styles.txIconBox}>
                    <Ionicons name={categoryIcon(tx.category)} size={18} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txName} numberOfLines={1}>{tx.recipient_phone}</Text>
                    <Text style={styles.txMeta}>{tx.category} · {timeAgo(tx.created_at)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.txAmount}>−{fmtMoney(tx.amount)}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusColor(tx.status) + '18' }]}>
                      <Text style={[styles.statusText, { color: statusColor(tx.status) }]}>
                        {tx.status === 'completed' ? 'Sent' : tx.status === 'review' ? 'Review' : 'Blocked'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: C.primary },
  header:         { backgroundColor: C.primary, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  headerRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  avatar:         { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText:     { color: '#fff', fontSize: 14, fontWeight: '700' },
  greeting:       { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  userName:       { fontSize: 15, fontWeight: '700', color: '#fff' },
  bellBtn:        { position: 'relative', padding: 4 },
  badge:          { position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:      { color: '#fff', fontSize: 9, fontWeight: '800' },
  balanceCard:    { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  balanceLabel:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 },
  balanceRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  balanceAmount:  { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  balanceMeta:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceMetaText:{ fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  trustBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  trustText:      { fontSize: 11, color: '#4ade80', fontWeight: '600' },
  scroll:         { flex: 1, backgroundColor: C.bg },
  actionsRow:     { flexDirection: 'row', backgroundColor: C.surface, paddingVertical: 20, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  action:         { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon:     { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  actionLabel:    { fontSize: 12, fontWeight: '600', color: C.text },
  section:        { backgroundColor: C.surface, marginTop: 8, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  sectionRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:   { fontSize: 15, fontWeight: '700', color: C.text },
  seeAll:         { fontSize: 13, color: C.primary, fontWeight: '600' },
  livePill:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  liveDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  liveText:       { fontSize: 10, fontWeight: '800', color: C.success },
  alertCard:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  alertDot:       { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  alertTitle:     { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 2 },
  alertDesc:      { fontSize: 12, color: C.textSub },
  alertTime:      { fontSize: 11, color: C.textMuted, flexShrink: 0 },
  txList:         { gap: 0 },
  txRow:          { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  txRowBorder:    { borderBottomWidth: 1, borderBottomColor: C.border },
  txIconBox:      { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txName:         { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 3 },
  txMeta:         { fontSize: 12, color: C.textSub },
  txAmount:       { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 },
  statusPill:     { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusText:     { fontSize: 11, fontWeight: '700' },
  emptyBox:       { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText:      { fontSize: 14, color: C.textMuted },
});
