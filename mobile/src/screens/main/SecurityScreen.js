import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, StatusBar,
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

const SCENARIOS = [
  {
    id: 'sim_swap',
    title: 'SIM Swap Attack',
    description: 'Attacker ports your number to a new SIM card to intercept OTP codes.',
    severity: 'critical',
    icon: 'phone-portrait',
    color: C.danger,
    bg: C.dangerLight,
  },
  {
    id: 'phishing',
    title: 'Phishing Attempt',
    description: 'Fraudulent SMS mimicking FraudShield prompts you to share your PIN.',
    severity: 'high',
    icon: 'mail',
    color: C.warning,
    bg: C.warningLight,
  },
  {
    id: 'account_takeover',
    title: 'Account Takeover',
    description: 'Repeated failed PIN attempts trigger an account lockout.',
    severity: 'high',
    icon: 'lock-closed',
    color: C.warning,
    bg: C.warningLight,
  },
  {
    id: 'unusual_amount',
    title: 'Unusual Large Transfer',
    description: 'AI flags a transfer 10× your rolling average as anomalous.',
    severity: 'medium',
    icon: 'trending-up',
    color: C.primary,
    bg: C.primaryLight,
  },
];

function trustColor(score) {
  if (score >= 80) return C.success;
  if (score >= 60) return C.warning;
  return C.danger;
}

export default function SecurityScreen({ navigation }) {
  const { user } = useAuth();
  const { data: aiData    } = useApi('/api/ai-config');
  const { data: chainData } = useApi('/api/blockchain/verify');

  const trust  = user?.trustScore ?? 0;
  const tColor = trustColor(trust);

  const LAYERS = [
    {
      icon: 'analytics-outline',
      title: 'AI Anomaly Detection',
      desc:  'Real-time scoring on every transaction',
      active: aiData ? Object.values(aiData).some(Boolean) : true,
      color: '#7C3AED',
    },
    {
      icon: 'link-outline',
      title: 'Blockchain Ledger',
      desc:  'Immutable permissioned audit trail',
      active: chainData?.ok ?? true,
      color: C.success,
    },
    {
      icon: 'finger-print-outline',
      title: 'Multi-Factor Auth',
      desc:  'PIN + OTP + Biometric',
      active: user?.mfaEnabled ?? false,
      color: C.primary,
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Security</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Trust score card */}
        <View style={styles.trustCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.trustLabel}>Your Trust Score</Text>
            <Text style={[styles.trustScore, { color: tColor }]}>{trust}%</Text>
            <Text style={styles.trustSub}>Based on transaction history, MFA usage, and AI behaviour profile</Text>
          </View>
          <View style={styles.gauge}>
            <View style={[styles.gaugeFill, { height: `${trust}%`, backgroundColor: tColor }]} />
          </View>
        </View>

        {/* Security layers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Protection Layers</Text>
          {LAYERS.map((l, i) => (
            <React.Fragment key={l.title}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.layer}>
                <View style={[styles.layerIcon, { backgroundColor: l.color + '18' }]}>
                  <Ionicons name={l.icon} size={18} color={l.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.layerTitle}>{l.title}</Text>
                  <Text style={styles.layerDesc}>{l.desc}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: l.active ? C.successLight : C.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: l.active ? C.success : C.textMuted }]} />
                  <Text style={[styles.statusText, { color: l.active ? C.success : C.textMuted }]}>
                    {l.active ? 'Active' : 'Off'}
                  </Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Fraud simulator */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Fraud Scenario Simulator</Text>
            <View style={styles.labBadge}>
              <Ionicons name="flask-outline" size={12} color={C.primary} />
              <Text style={styles.labText}>Lab</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>Tap a scenario to see how the system responds</Text>

          {SCENARIOS.map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.scenario}
                onPress={() => navigation.navigate('FraudScenario', { scenario: s })}
                activeOpacity={0.7}
              >
                <View style={[styles.scenarioIcon, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.scenarioTop}>
                    <Text style={styles.scenarioTitle}>{s.title}</Text>
                    <View style={[styles.severityBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.severityText, { color: s.color }]}>{s.severity.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.scenarioDesc} numberOfLines={2}>{s.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  header:       { backgroundColor: C.surface, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle:  { fontSize: 20, fontWeight: '800', color: C.text },
  scroll:       { padding: 16, gap: 12 },
  trustCard:    { backgroundColor: C.surface, borderRadius: 16, padding: 20, flexDirection: 'row', gap: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  trustLabel:   { fontSize: 13, color: C.textSub, fontWeight: '600' },
  trustScore:   { fontSize: 40, fontWeight: '800', marginTop: 2 },
  trustSub:     { fontSize: 12, color: C.textMuted, marginTop: 6, lineHeight: 17, maxWidth: 220 },
  gauge:        { width: 20, height: 80, backgroundColor: C.bg, borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end', borderWidth: 1, borderColor: C.border },
  gaugeFill:    { width: '100%', borderRadius: 10, minHeight: 4 },
  card:         { backgroundColor: C.surface, borderRadius: 16, padding: 18, gap: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: C.text },
  cardSub:      { fontSize: 12, color: C.textSub, marginTop: -8 },
  labBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  labText:      { fontSize: 11, fontWeight: '700', color: C.primary },
  divider:      { height: 1, backgroundColor: C.border },
  layer:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  layerIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  layerTitle:   { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  layerDesc:    { fontSize: 12, color: C.textSub },
  statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, flexShrink: 0 },
  statusDot:    { width: 6, height: 6, borderRadius: 3 },
  statusText:   { fontSize: 12, fontWeight: '700' },
  scenario:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scenarioIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  scenarioTop:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  scenarioTitle:{ fontSize: 13, fontWeight: '700', color: C.text },
  scenarioDesc: { fontSize: 12, color: C.textSub, lineHeight: 17 },
  severityBadge:{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexShrink: 0 },
  severityText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});
