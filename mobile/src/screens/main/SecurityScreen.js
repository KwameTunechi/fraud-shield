import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fraudScenarios } from '../../data/mockData';
import { currentUser } from '../../data/mockData';

export default function SecurityScreen({ navigation }) {
  const scoreColor = currentUser.trustScore >= 80 ? '#16a34a' : currentUser.trustScore >= 60 ? '#d97706' : '#dc2626';

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.header}>
        <Text style={styles.headerTitle}>Security Centre</Text>
        <Text style={styles.headerSub}>AI · Blockchain · MFA Simulation</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Trust score */}
        <View style={styles.trustCard}>
          <View>
            <Text style={styles.trustLabel}>Your Trust Score</Text>
            <Text style={[styles.trustScore, { color: scoreColor }]}>{currentUser.trustScore}%</Text>
            <Text style={styles.trustSub}>Based on your transaction history, MFA usage, and AI behaviour profile</Text>
          </View>
          <View style={styles.trustGauge}>
            <View style={[styles.gaugeFill, { height: `${currentUser.trustScore}%`, backgroundColor: scoreColor }]} />
          </View>
        </View>

        {/* Security layers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Security Layers</Text>
          <View style={styles.layers}>
            {[
              { icon: '🤖', title: 'AI Anomaly Detection', desc: 'Real-time unsupervised ML on every transaction', active: true, color: '#7c3aed' },
              { icon: '🔗', title: 'Blockchain Ledger', desc: 'Immutable permissioned audit trail on Telecel chain', active: true, color: '#059669' },
              { icon: '🔒', title: 'Multi-Factor Auth', desc: 'PIN + OTP + Biometric adaptive authentication', active: currentUser.mfaEnabled, color: '#2563eb' },
              { icon: '👆', title: 'Biometric Auth', desc: 'Fingerprint / Face ID verification layer', active: currentUser.biometricEnabled, color: '#d97706' },
            ].map(l => (
              <View key={l.title} style={styles.layer}>
                <Text style={styles.layerIcon}>{l.icon}</Text>
                <View style={styles.layerInfo}>
                  <Text style={styles.layerTitle}>{l.title}</Text>
                  <Text style={styles.layerDesc}>{l.desc}</Text>
                </View>
                <View style={[styles.layerStatus, { backgroundColor: l.active ? '#dcfce7' : '#f1f5f9' }]}>
                  <Text style={[styles.layerStatusText, { color: l.active ? '#16a34a' : '#94a3b8' }]}>
                    {l.active ? 'Active' : 'Off'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Fraud scenario simulator */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Fraud Scenario Simulator</Text>
          <Text style={styles.sectionSub}>Tap a scenario to see how the system responds in real time</Text>
          {fraudScenarios.map(s => (
            <TouchableOpacity key={s.id} style={[styles.scenarioCard, { backgroundColor: s.bgColor, borderColor: s.borderColor }]}
              onPress={() => navigation.navigate('FraudScenario', { scenario: s })}>
              <View style={styles.scenarioLeft}>
                <Text style={styles.scenarioIcon}>{s.icon}</Text>
                <View style={styles.scenarioInfo}>
                  <Text style={[styles.scenarioTitle, { color: s.color }]}>{s.title}</Text>
                  <Text style={styles.scenarioDesc} numberOfLines={2}>{s.description}</Text>
                  <View style={[styles.severityBadge, { backgroundColor: s.color + '22' }]}>
                    <Text style={[styles.severityText, { color: s.color }]}>{s.severity.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 54, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#a5b4fc', marginTop: 3 },
  trustCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, gap: 16 },
  trustLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  trustScore: { fontSize: 42, fontWeight: '800', marginTop: 2 },
  trustSub: { fontSize: 11, color: '#94a3b8', marginTop: 4, maxWidth: 220, lineHeight: 16 },
  trustGauge: { width: 28, height: 80, backgroundColor: '#f1f5f9', borderRadius: 14, overflow: 'hidden', justifyContent: 'flex-end' },
  gaugeFill: { width: '100%', borderRadius: 14 },
  section: { backgroundColor: '#fff', borderRadius: 18, padding: 18, gap: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  sectionSub: { fontSize: 12, color: '#64748b', marginTop: -6 },
  layers: { gap: 12 },
  layer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  layerIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  layerInfo: { flex: 1 },
  layerTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  layerDesc: { fontSize: 11, color: '#64748b', marginTop: 1 },
  layerStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  layerStatusText: { fontSize: 12, fontWeight: '700' },
  scenarioCard: { borderRadius: 14, padding: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  scenarioLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  scenarioIcon: { fontSize: 28 },
  scenarioInfo: { flex: 1, gap: 4 },
  scenarioTitle: { fontSize: 14, fontWeight: '800' },
  scenarioDesc: { fontSize: 12, color: '#64748b', lineHeight: 17 },
  severityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  arrow: { fontSize: 18, color: '#94a3b8' },
});
