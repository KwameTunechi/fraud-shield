import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { transactions } from '../../data/mockData';
import { formatCurrency, getRiskLabel, getStatusStyle } from '../../utils/fraudSimulator';

const FILTERS = ['All', 'Completed', 'Review', 'Blocked'];

export default function TransactionsScreen({ navigation }) {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? transactions : transactions.filter(t => t.status === filter.toLowerCase());

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerSub}>Blockchain-verified audit trail</Text>
      </LinearGradient>

      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filter, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        {filtered.map(txn => {
          const risk = getRiskLabel(txn.risk);
          const status = getStatusStyle(txn.status);
          const isPositive = txn.amount > 0;
          return (
            <TouchableOpacity key={txn.id} style={styles.card}
              onPress={() => navigation.navigate('TxDetail', { txn })}>
              <View style={styles.cardLeft}>
                <View style={styles.emojiBox}><Text style={{ fontSize: 22 }}>{txn.emoji}</Text></View>
                <View style={styles.info}>
                  <View style={styles.infoTop}>
                    <Text style={styles.name}>{txn.name}</Text>
                    {txn.aiFlag && <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>🤖 AI Flagged</Text></View>}
                  </View>
                  <Text style={styles.meta}>{txn.category} · {txn.displayTime}</Text>
                  <Text style={styles.location}>📍 {txn.location}</Text>
                  <View style={styles.tags}>
                    <View style={[styles.tag, { backgroundColor: risk.bg }]}>
                      <Text style={[styles.tagText, { color: risk.color }]}>Risk {txn.risk}%</Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: status.bg }]}>
                      <Text style={[styles.tagText, { color: status.color }]}>{status.label}</Text>
                    </View>
                    {txn.blockchainVerified && (
                      <View style={styles.chainBadge}>
                        <Text style={styles.chainText}>🔗 Verified</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <Text style={[styles.amount, { color: isPositive ? '#16a34a' : '#0f172a' }]}>
                {isPositive ? '+' : ''}{formatCurrency(txn.amount)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 54, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#a5b4fc', marginTop: 3 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  filter: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f1f5f9' },
  filterActive: { backgroundColor: '#4338ca' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterTextActive: { color: '#fff' },
  list: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  emojiBox: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1, gap: 3 },
  infoTop: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  aiBadge: { backgroundColor: '#faf5ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#e9d5ff' },
  aiBadgeText: { fontSize: 10, color: '#7c3aed', fontWeight: '700' },
  meta: { fontSize: 11, color: '#94a3b8' },
  location: { fontSize: 11, color: '#94a3b8' },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  tag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: '700' },
  chainBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  chainText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  amount: { fontSize: 14, fontWeight: '700', flexShrink: 0 },
});
