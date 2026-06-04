import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApi } from '../../hooks/useApi';

const FILTERS = [
  { label: 'All',      value: '' },
  { label: 'Completed', value: 'completed' },
  { label: 'Review',   value: 'review' },
  { label: 'Blocked',  value: 'blocked' },
];

function fmtAmount(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
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

function riskStyle(score) {
  if (score < 30) return { color: '#16a34a', bg: '#f0fdf4' };
  if (score < 70) return { color: '#d97706', bg: '#fffbeb' };
  return { color: '#dc2626', bg: '#fef2f2' };
}

function statusStyle(s) {
  if (s === 'completed') return { color: '#16a34a', bg: '#f0fdf4', label: 'Completed' };
  if (s === 'review')    return { color: '#d97706', bg: '#fffbeb', label: 'Review' };
  return                        { color: '#dc2626', bg: '#fef2f2', label: 'Blocked' };
}

function txEmoji(cat) {
  return cat === 'MERCHANT' ? '🛍️' : cat === 'AGENT' ? '🏦' : '💸';
}

export default function TransactionsScreen({ navigation }) {
  const [filter, setFilter] = useState('');

  const query    = filter ? `?status=${filter}&limit=50` : '?limit=50';
  const { data, loading, reload } = useApi(`/api/transactions${query}`);
  const transactions = data?.transactions ?? [];

  function renderItem({ item: txn }) {
    const risk   = riskStyle(txn.risk_score);
    const status = statusStyle(txn.status);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TxDetail', { id: txn.id })}
      >
        <View style={styles.cardLeft}>
          <View style={styles.emojiBox}>
            <Text style={{ fontSize: 22 }}>{txEmoji(txn.category)}</Text>
          </View>
          <View style={styles.info}>
            <View style={styles.infoTop}>
              <Text style={styles.name}>{txn.recipient_phone}</Text>
              {txn.ai_flagged && (
                <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>🤖 AI Flagged</Text></View>
              )}
            </View>
            <Text style={styles.meta}>{txn.category} · {fmtRelative(txn.created_at)}</Text>
            <Text style={styles.ref}>{txn.reference}</Text>
            <View style={styles.tags}>
              <View style={[styles.tag, { backgroundColor: risk.bg }]}>
                <Text style={[styles.tagText, { color: risk.color }]}>Risk {txn.risk_score}%</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: status.bg }]}>
                <Text style={[styles.tagText, { color: status.color }]}>{status.label}</Text>
              </View>
              {txn.blockchain_hash && (
                <View style={styles.chainBadge}>
                  <Text style={styles.chainText}>🔗 Verified</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <Text style={styles.amount}>−{fmtAmount(txn.amount)}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerSub}>Blockchain-verified audit trail</Text>
      </LinearGradient>

      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filter, filter === f.value && styles.filterActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.empty}>
              {filter ? `No ${filter} transactions.` : 'No transactions yet.'}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#f8fafc' },
  header:        { paddingTop: 54, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle:   { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub:     { fontSize: 12, color: '#a5b4fc', marginTop: 3 },
  filters:       { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  filter:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f1f5f9' },
  filterActive:  { backgroundColor: '#4338ca' },
  filterText:    { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterTextActive:{ color: '#fff' },
  empty:         { textAlign: 'center', color: '#94a3b8', fontSize: 14, paddingTop: 40 },
  card:          { backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardLeft:      { flexDirection: 'row', gap: 12, flex: 1 },
  emojiBox:      { width: 44, height: 44, borderRadius: 13, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info:          { flex: 1, gap: 3 },
  infoTop:       { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name:          { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  aiBadge:       { backgroundColor: '#faf5ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#e9d5ff' },
  aiBadgeText:   { fontSize: 10, color: '#7c3aed', fontWeight: '700' },
  meta:          { fontSize: 11, color: '#94a3b8' },
  ref:           { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },
  tags:          { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  tag:           { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  tagText:       { fontSize: 11, fontWeight: '700' },
  chainBadge:    { backgroundColor: '#f0fdf4', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  chainText:     { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  amount:        { fontSize: 14, fontWeight: '700', color: '#0f172a', flexShrink: 0 },
});
