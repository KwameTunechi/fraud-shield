import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { currentUser, transactions, alerts } from '../../data/mockData';
import { formatCurrency } from '../../utils/fraudSimulator';

export default function HomeScreen({ navigation }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const unread = alerts.filter(a => !a.read).length;
  const recent = transactions.slice(0, 4);

  function alertStyle(type) {
    const map = {
      warning: { bg: '#fffbeb', border: '#fde68a', icon: '⚠️', color: '#d97706' },
      success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '✅', color: '#16a34a' },
      danger:  { bg: '#fef2f2', border: '#fecaca', icon: '🚨', color: '#dc2626' },
      info:    { bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ️', color: '#2563eb' },
    };
    return map[type] || map.info;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#1e3a8a', '#4338ca', '#0d9488']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good morning 👋</Text>
              <Text style={styles.userName}>{currentUser.name}</Text>
            </View>
            <TouchableOpacity style={styles.bellWrap} onPress={() => {}}>
              <Text style={styles.bell}>🔔</Text>
              {unread > 0 && <View style={styles.badge}><Text style={styles.badgeNum}>{unread}</Text></View>}
            </TouchableOpacity>
          </View>

          {/* Balance card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceTop}>
              <View>
                <Text style={styles.balLabel}>Available Balance</Text>
                <Text style={styles.balance}>
                  {balanceVisible ? formatCurrency(currentUser.balance) : '₵ ••••••'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setBalanceVisible(v => !v)}>
                <Text style={styles.eye}>{balanceVisible ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.balanceFooter}>
              <Text style={styles.network}>📱 {currentUser.network}</Text>
              <View style={styles.trustPill}>
                <Text style={styles.trustText}>🛡️ Trust: {currentUser.trustScore}%</Text>
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
            <TouchableOpacity style={styles.action}>
              <LinearGradient colors={['#0d9488', '#059669']} style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>↙️</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>Receive</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action}>
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>📱</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>Airtime</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action}>
              <LinearGradient colors={['#ec4899', '#db2777']} style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>💸</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>Pay Bill</Text>
            </TouchableOpacity>
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
            {alerts.slice(0, 3).map(a => {
              const s = alertStyle(a.type);
              return (
                <View key={a.id} style={[styles.alertCard, { backgroundColor: s.bg, borderColor: s.border }]}>
                  <Text style={styles.alertIcon}>{s.icon}</Text>
                  <View style={styles.alertBody}>
                    <Text style={[styles.alertTitle, { color: s.color }]}>{a.title}</Text>
                    <Text style={styles.alertDesc}>{a.desc}</Text>
                  </View>
                  <Text style={styles.alertTime}>{a.time}</Text>
                </View>
              );
            })}
          </View>

          {/* Recent transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity><Text style={styles.viewAll}>View all →</Text></TouchableOpacity>
            </View>
            {recent.map(txn => {
              const isPositive = txn.amount > 0;
              const riskColors = { low: '#16a34a', medium: '#d97706', high: '#dc2626' };
              const statusColors = { completed: '#16a34a', review: '#d97706', blocked: '#dc2626' };
              return (
                <View key={txn.id} style={styles.txRow}>
                  <View style={styles.txEmoji}>
                    <Text style={{ fontSize: 20 }}>{txn.emoji}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txName}>{txn.name}</Text>
                    <Text style={styles.txMeta}>{txn.category} · {txn.displayTime}</Text>
                    <View style={styles.txTags}>
                      <Text style={[styles.txRisk, { color: riskColors[txn.riskLevel] }]}>Risk: {txn.risk}%</Text>
                      <Text style={[styles.txStatus, { color: statusColors[txn.status] }]}>● {txn.status}</Text>
                      {txn.blockchainVerified && <Text style={styles.txChain}>🔗</Text>}
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: isPositive ? '#16a34a' : '#0f172a' }]}>
                    {isPositive ? '+' : ''}{formatCurrency(txn.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 20, gap: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: '#a5b4fc' },
  userName: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 2 },
  bellWrap: { position: 'relative', padding: 4 },
  bell: { fontSize: 22 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ef4444', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeNum: { color: '#fff', fontSize: 10, fontWeight: '700' },
  balanceCard: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', gap: 12 },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balLabel: { fontSize: 12, color: '#a5b4fc' },
  balance: { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 2 },
  eye: { fontSize: 22 },
  balanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  network: { fontSize: 12, color: '#c7d2fe' },
  trustPill: { backgroundColor: 'rgba(34,197,94,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)' },
  trustText: { fontSize: 12, color: '#4ade80', fontWeight: '600' },
  body: { padding: 16, gap: 20 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { alignItems: 'center', gap: 8, flex: 1 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionEmoji: { fontSize: 24 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  liveText: { fontSize: 10, fontWeight: '700', color: '#16a34a' },
  viewAll: { fontSize: 13, color: '#4338ca', fontWeight: '600' },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  alertIcon: { fontSize: 20 },
  alertBody: { flex: 1, gap: 2 },
  alertTitle: { fontSize: 13, fontWeight: '700' },
  alertDesc: { fontSize: 12, color: '#64748b' },
  alertTime: { fontSize: 11, color: '#94a3b8' },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 14, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  txEmoji: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, gap: 2 },
  txName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  txMeta: { fontSize: 11, color: '#94a3b8' },
  txTags: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 2 },
  txRisk: { fontSize: 11, fontWeight: '600' },
  txStatus: { fontSize: 11, fontWeight: '600' },
  txChain: { fontSize: 11 },
  txAmount: { fontSize: 14, fontWeight: '700' },
});
