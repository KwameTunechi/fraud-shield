import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  SafeAreaView, RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';

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

const FILTERS = [
  { label: 'All',      value: '' },
  { label: 'Completed', value: 'completed' },
  { label: 'Review',   value: 'review' },
  { label: 'Blocked',  value: 'blocked' },
];

function fmtMoney(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function statusStyle(s) {
  if (s === 'completed') return { color: C.success,  bg: C.successLight,  label: 'Completed' };
  if (s === 'review')    return { color: C.warning,  bg: C.warningLight,  label: 'Review' };
  return                        { color: C.danger,   bg: C.dangerLight,   label: 'Blocked' };
}

function categoryIcon(cat) {
  if (cat === 'MERCHANT') return 'storefront-outline';
  if (cat === 'AGENT')    return 'business-outline';
  return 'swap-horizontal-outline';
}

function riskBg(score) {
  if (score < 30) return { color: C.success, bg: C.successLight };
  if (score < 70) return { color: C.warning, bg: C.warningLight };
  return                  { color: C.danger,  bg: C.dangerLight  };
}

export default function TransactionsScreen({ navigation }) {
  const [filter, setFilter] = useState('');

  const query = filter ? `?status=${filter}&limit=50` : '?limit=50';
  const { data, loading, reload } = useApi(`/api/transactions${query}`);
  const transactions = data?.transactions ?? [];

  // Group by date
  function groupByDate(txns) {
    const groups = {};
    txns.forEach(tx => {
      const key = new Date(tx.created_at).toDateString();
      if (!groups[key]) groups[key] = { label: fmtDate(tx.created_at), items: [] };
      groups[key].items.push(tx);
    });
    return Object.values(groups);
  }

  const grouped = groupByDate(transactions);

  const listData = grouped.flatMap(g => [
    { type: 'header', key: 'h-' + g.label, label: g.label },
    ...g.items.map(tx => ({ type: 'tx', key: tx.id, tx })),
  ]);

  function renderItem({ item }) {
    if (item.type === 'header') {
      return <Text style={styles.dateHeader}>{item.label}</Text>;
    }

    const { tx } = item;
    const st = statusStyle(tx.status);
    const rs = riskBg(tx.risk_score);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TxDetail', { id: tx.id })}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: C.primaryLight }]}>
          <Ionicons name={categoryIcon(tx.category)} size={18} color={C.primary} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardName} numberOfLines={1}>
              {tx.recipient_name ?? tx.recipient_phone}
            </Text>
            <Text style={styles.cardAmount}>−{fmtMoney(tx.amount)}</Text>
          </View>
          <View style={styles.cardMid}>
            <Text style={styles.cardRef} numberOfLines={1}>
              {tx.sender_name ?? 'You'} → {tx.recipient_phone}
            </Text>
            <Text style={styles.cardTime}>{fmtTime(tx.created_at)}</Text>
          </View>
          <View style={styles.cardTags}>
            <View style={[styles.tag, { backgroundColor: st.bg }]}>
              <Text style={[styles.tagText, { color: st.color }]}>{st.label}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: rs.bg }]}>
              <Text style={[styles.tagText, { color: rs.color }]}>Risk {tx.risk_score}%</Text>
            </View>
            {tx.ai_flagged && (
              <View style={[styles.tag, { backgroundColor: '#FDF4FF' }]}>
                <Ionicons name="alert-circle-outline" size={10} color="#7C3AED" />
                <Text style={[styles.tagText, { color: '#7C3AED' }]}>Flagged</Text>
              </View>
            )}
            {tx.blockchain_hash && (
              <View style={[styles.tag, { backgroundColor: C.successLight }]}>
                <Ionicons name="link-outline" size={10} color={C.success} />
                <Text style={[styles.tagText, { color: C.success }]}>Verified</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerSub}>{transactions.length} record{transactions.length !== 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filter, filter === f.value && styles.filterActive]}
            onPress={() => setFilter(f.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={listData}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={C.primary} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={40} color={C.textMuted} />
              <Text style={styles.emptyTitle}>No transactions</Text>
              <Text style={styles.emptyDesc}>{filter ? `No ${filter} transactions found` : 'Your transactions will appear here'}</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: C.bg },
  header:          { backgroundColor: C.surface, paddingTop: 16, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle:     { fontSize: 20, fontWeight: '800', color: C.text },
  headerSub:       { fontSize: 12, color: C.textSub, marginTop: 2 },
  filters:         { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  filter:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.bg },
  filterActive:    { backgroundColor: C.primary },
  filterText:      { fontSize: 13, fontWeight: '600', color: C.textSub },
  filterTextActive:{ color: '#fff' },
  list:            { padding: 16, paddingBottom: 32, gap: 8 },
  dateHeader:      { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4, paddingHorizontal: 4 },
  card:            { backgroundColor: C.surface, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  iconBox:         { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody:        { flex: 1, gap: 4 },
  cardTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName:        { fontSize: 14, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
  cardAmount:      { fontSize: 14, fontWeight: '700', color: C.text, flexShrink: 0 },
  cardMid:         { flexDirection: 'row', justifyContent: 'space-between' },
  cardRef:         { fontSize: 11, color: C.textMuted, flex: 1, fontFamily: 'monospace' },
  cardTime:        { fontSize: 11, color: C.textMuted },
  cardTags:        { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  tag:             { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  tagText:         { fontSize: 11, fontWeight: '700' },
  emptyBox:        { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle:      { fontSize: 16, fontWeight: '700', color: C.text },
  emptyDesc:       { fontSize: 13, color: C.textSub, textAlign: 'center' },
});
