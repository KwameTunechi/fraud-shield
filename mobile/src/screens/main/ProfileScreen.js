import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';

function fmtAmount(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { data: txData  } = useApi('/api/transactions?limit=100');
  const { data: alertData } = useApi('/api/alerts?limit=100');

  const txCount    = txData?.transactions?.length    ?? 0;
  const alertCount = alertData?.alerts?.length        ?? 0;
  const trustScore = user?.trustScore ?? 0;
  const scoreColor = trustScore >= 80 ? '#16a34a' : '#d97706';

  function confirmSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  const initials = (user?.fullName ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1e3a8a', '#4338ca', '#0d9488']} style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <Text style={styles.name}>{user?.fullName ?? 'Customer'}</Text>
        <Text style={styles.phone}>{user?.phone ?? ''}</Text>
        <View style={styles.verifiedPill}>
          <Text style={styles.verifiedText}>✅ KYC Verified</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: scoreColor }]}>{trustScore}%</Text>
            <Text style={styles.statLabel}>Trust Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{txCount}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{alertCount}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>

        {/* Account info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          {[
            { label: 'Phone Number', value: user?.phone ?? '—' },
            { label: 'Balance',      value: fmtAmount(user?.balance ?? 0) },
            { label: 'Network',      value: 'Telecel Cash' },
          ].map(({ label, value }) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowKey}>{label}</Text>
              <Text style={styles.rowVal}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Security settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Settings</Text>
          {[
            { label: '🔒 PIN Authentication', value: 'Enabled',   color: '#16a34a' },
            { label: '📲 OTP Verification',   value: 'Enabled',   color: '#16a34a' },
            { label: '👆 Biometric Auth',      value: 'Enabled',   color: '#16a34a' },
            { label: '🤖 AI Monitoring',       value: 'Active',    color: '#7c3aed' },
            { label: '🔗 Blockchain Audit',    value: 'Active',    color: '#059669' },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowKey}>{label}</Text>
              <Text style={[styles.rowVal, { color }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Research context */}
        <View style={styles.researchCard}>
          <Text style={styles.researchTitle}>📋 Research Simulation</Text>
          <Text style={styles.researchText}>
            This mobile app is part of a research project investigating AI, blockchain, and MFA-based fraud prevention for Ghana's mobile money ecosystem (Telecel Cash). All transactions are recorded on a real blockchain ledger for demonstration purposes.
          </Text>
          <View style={styles.researchTags}>
            {['University of Ghana', 'Telecel Cash', 'CSIT 621'].map(t => (
              <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f8fafc' },
  header:       { paddingTop: 50, paddingBottom: 28, alignItems: 'center', gap: 8 },
  avatar:       { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(99,102,241,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText:   { color: '#fff', fontSize: 26, fontWeight: '800' },
  name:         { fontSize: 20, fontWeight: '800', color: '#fff' },
  phone:        { fontSize: 13, color: '#a5b4fc' },
  verifiedPill: { backgroundColor: 'rgba(34,197,94,0.2)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)' },
  verifiedText: { color: '#4ade80', fontSize: 12, fontWeight: '700' },
  stats:        { backgroundColor: '#fff', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  stat:         { flex: 1, alignItems: 'center', gap: 4 },
  statVal:      { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  statLabel:    { fontSize: 11, color: '#64748b', fontWeight: '600' },
  statDivider:  { width: 1, height: 40, backgroundColor: '#f1f5f9' },
  section:      { backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  rowKey:       { fontSize: 13, color: '#64748b' },
  rowVal:       { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  researchCard: { backgroundColor: '#eff6ff', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  researchTitle:{ fontSize: 14, fontWeight: '700', color: '#1d4ed8' },
  researchText: { fontSize: 12, color: '#1e40af', lineHeight: 18 },
  researchTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag:          { backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagText:      { fontSize: 11, color: '#2563eb', fontWeight: '600' },
  signOutBtn:   { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#fecaca', marginBottom: 8 },
  signOutText:  { fontSize: 15, fontWeight: '700', color: '#dc2626' },
});
