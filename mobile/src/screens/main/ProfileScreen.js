import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';

const C = {
  primary:      '#1652F0',
  primaryLight: '#EBF0FE',
  success:      '#00875A',
  successLight: '#E3F5F0',
  warning:      '#FF8B00',
  danger:       '#DE350B',
  text:         '#0D1421',
  textSub:      '#6B7280',
  textMuted:    '#9CA3AF',
  bg:           '#F5F7FA',
  surface:      '#FFFFFF',
  border:       '#E8ECEF',
};

function fmtMoney(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function MenuItem({ icon, label, sublabel, onPress, destructive, rightIcon }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, destructive && styles.menuIconDanger]}>
        <Ionicons name={icon} size={18} color={destructive ? C.danger : C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, destructive && { color: C.danger }]}>{label}</Text>
        {sublabel && <Text style={styles.menuSub}>{sublabel}</Text>}
      </View>
      <Ionicons name={rightIcon ?? 'chevron-forward'} size={16} color={C.textMuted} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { data: txData    } = useApi('/api/transactions?limit=100');
  const { data: alertData } = useApi('/api/alerts?limit=100');

  const txCount    = txData?.transactions?.length ?? 0;
  const alertCount = alertData?.alerts?.length    ?? 0;
  const trust      = user?.trustScore ?? 0;
  const trustColor = trust >= 80 ? C.success : trust >= 60 ? C.warning : C.danger;

  const initials = (user?.fullName ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  function confirmSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Avatar + name */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{user?.fullName ?? 'Customer'}</Text>
          <Text style={styles.profilePhone}>{user?.phone ?? ''}</Text>
          <View style={styles.kycBadge}>
            <Ionicons name="shield-checkmark" size={13} color={C.success} />
            <Text style={styles.kycText}>KYC Verified</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: trustColor }]}>{trust}%</Text>
            <Text style={styles.statLabel}>Trust Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{txCount}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{fmtMoney(user?.balance ?? 0)}</Text>
            <Text style={styles.statLabel}>Balance</Text>
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="person-outline"          label="Personal Information" sublabel="Name, phone number" onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuItem icon="card-outline"            label="Payment Methods"      sublabel="Linked accounts"   onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuItem icon="document-text-outline"   label="Transaction History"  sublabel={`${txCount} transactions`} onPress={() => {}} />
          </View>
        </View>

        {/* Security section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="keypad-outline"          label="Change PIN"           onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuItem icon="finger-print-outline"    label="Biometric Login"      sublabel={user?.mfaEnabled ? 'Enabled' : 'Disabled'} onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuItem icon="notifications-outline"   label="Notifications"        onPress={() => {}} />
          </View>
        </View>

        {/* Support section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="help-circle-outline"     label="Help & Support"       onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuItem icon="information-circle-outline" label="About FraudShield" sublabel="Version 1.0.0"   onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuItem icon="log-out-outline" label="Sign Out" destructive onPress={confirmSignOut} />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  header:       { backgroundColor: C.surface, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle:  { fontSize: 20, fontWeight: '800', color: C.text },
  scroll:       { padding: 16, gap: 0 },
  profileCard:  { backgroundColor: C.surface, borderRadius: 16, padding: 24, alignItems: 'center', gap: 6, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  avatar:       { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarText:   { color: '#fff', fontSize: 24, fontWeight: '800' },
  profileName:  { fontSize: 18, fontWeight: '800', color: C.text },
  profilePhone: { fontSize: 14, color: C.textSub },
  kycBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.successLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginTop: 4 },
  kycText:      { fontSize: 12, fontWeight: '700', color: C.success },
  statsCard:    { backgroundColor: C.surface, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  stat:         { flex: 1, alignItems: 'center', gap: 4 },
  statValue:    { fontSize: 17, fontWeight: '800', color: C.text },
  statLabel:    { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  statDivider:  { width: 1, height: 36, backgroundColor: C.border },
  section:      { marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, paddingHorizontal: 4 },
  menuCard:     { backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  menuItem:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  menuIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuIconDanger:{ backgroundColor: C.danger + '15' },
  menuLabel:    { fontSize: 14, fontWeight: '600', color: C.text },
  menuSub:      { fontSize: 12, color: C.textMuted, marginTop: 1 },
  menuDivider:  { height: 1, backgroundColor: C.border, marginLeft: 66 },
});
