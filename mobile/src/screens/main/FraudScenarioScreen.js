import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

const DETECTION_STEPS = {
  sim_swap: [
    { icon: 'alert-circle', color: C.danger,  label: 'SIM change detected on carrier network' },
    { icon: 'shield',       color: C.warning, label: 'Account access suspended automatically' },
    { icon: 'lock-closed',  color: C.warning, label: 'Active sessions revoked' },
    { icon: 'mail',         color: C.primary, label: 'Re-verification SMS sent to registered contact' },
    { icon: 'checkmark-circle', color: C.success, label: 'Fraud attempt blocked — account secured' },
  ],
  phishing: [
    { icon: 'alert-circle', color: C.warning, label: 'Suspicious link clicked via external message' },
    { icon: 'shield',       color: C.danger,  label: 'Credential harvest attempt detected by AI' },
    { icon: 'notifications', color: C.warning, label: 'User alerted via in-app push notification' },
    { icon: 'lock-closed',  color: C.primary, label: 'Session invalidated, forced re-authentication' },
    { icon: 'checkmark-circle', color: C.success, label: 'Incident logged to blockchain audit trail' },
  ],
  account_takeover: [
    { icon: 'alert-circle', color: C.warning, label: '3 consecutive failed PIN attempts flagged' },
    { icon: 'lock-closed',  color: C.danger,  label: 'Account locked after 5 failures' },
    { icon: 'analytics',    color: C.primary, label: 'AI risk engine raised user risk score' },
    { icon: 'mail',         color: C.warning, label: 'Unlock OTP sent to verified phone number' },
    { icon: 'checkmark-circle', color: C.success, label: 'Attack mitigated — admin alerted via dashboard' },
  ],
  unusual_amount: [
    { icon: 'trending-up',  color: C.warning, label: 'Transaction amount 10× rolling 30-day average' },
    { icon: 'analytics',    color: C.primary, label: 'AI risk engine scored transaction 87/100' },
    { icon: 'time',         color: C.warning, label: 'Transaction queued for manual review' },
    { icon: 'notifications', color: C.primary, label: 'Customer notified — confirm or cancel' },
    { icon: 'checkmark-circle', color: C.success, label: 'Transaction approved after confirmation' },
  ],
};

export default function FraudScenarioScreen({ route, navigation }) {
  const { scenario } = route.params;
  const steps = DETECTION_STEPS[scenario.id] ?? [];
  const [visibleCount, setVisibleCount] = useState(0);
  const [done,         setDone]         = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const colorMap = { C: C.danger, H: C.warning, M: C.primary, L: C.success };
  const sevColor = scenario.severity === 'critical' ? C.danger
                 : scenario.severity === 'high'     ? C.warning
                 : C.primary;
  const sevBg    = scenario.severity === 'critical' ? C.dangerLight
                 : scenario.severity === 'high'     ? C.warningLight
                 : C.primaryLight;

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= steps.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, 900);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scenario Simulation</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Scenario header */}
        <View style={styles.scenarioHeader}>
          <View style={[styles.scenarioIcon, { backgroundColor: scenario.bg ?? sevBg }]}>
            <Ionicons name={scenario.icon} size={28} color={scenario.color ?? sevColor} />
          </View>
          <Text style={styles.scenarioTitle}>{scenario.title}</Text>
          <View style={[styles.severityBadge, { backgroundColor: sevBg }]}>
            <Text style={[styles.severityText, { color: sevColor }]}>{scenario.severity?.toUpperCase()}</Text>
          </View>
          <Text style={styles.scenarioDesc}>{scenario.description}</Text>
        </View>

        {/* Detection timeline */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="shield-checkmark" size={16} color={C.primary} />
            <Text style={styles.cardTitle}>FraudShield Response</Text>
          </View>
          <Text style={styles.cardSub}>AI detection + automated response in real time</Text>

          <View style={styles.timeline}>
            {steps.map((step, i) => (
              <View key={i} style={[styles.step, i >= visibleCount && { opacity: 0.15 }]}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepDot, { backgroundColor: step.color }]}>
                    <Ionicons name={step.icon} size={14} color="#fff" />
                  </View>
                  {i < steps.length - 1 && <View style={styles.stepLine} />}
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                  {i < visibleCount && (
                    <View style={[styles.stepDone, { backgroundColor: step.color + '18' }]}>
                      <Text style={[styles.stepDoneText, { color: step.color }]}>
                        {i === steps.length - 1 ? 'Resolved' : 'Detected'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Outcome card */}
        {done && (
          <View style={styles.outcomeCard}>
            <View style={styles.outcomeIcon}>
              <Ionicons name="shield-checkmark" size={28} color={C.success} />
            </View>
            <Text style={styles.outcomeTitle}>Threat Neutralised</Text>
            <Text style={styles.outcomeSub}>
              The system detected and blocked this fraud attempt automatically.
              All events are permanently recorded on the blockchain audit trail.
            </Text>
          </View>
        )}

        {/* System info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How FraudShield Protects You</Text>
          {[
            { icon: 'analytics-outline', label: 'AI Risk Engine',    desc: 'Scores every transaction 0–100 in milliseconds' },
            { icon: 'link-outline',      label: 'Blockchain Ledger', desc: 'Immutable audit trail — every event recorded' },
            { icon: 'lock-closed-outline', label: 'Multi-factor Auth', desc: 'PIN + OTP ensures only you access your account' },
          ].map((item, i, arr) => (
            <React.Fragment key={item.label}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name={item.icon} size={18} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoDesc}>{item.desc}</Text>
                </View>
              </View>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:       { width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: 16, fontWeight: '700', color: C.text },
  scroll:        { padding: 16, gap: 12 },
  scenarioHeader:{ backgroundColor: C.surface, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  scenarioIcon:  { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  scenarioTitle: { fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center' },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  severityText:  { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  scenarioDesc:  { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20, marginTop: 4 },
  card:          { backgroundColor: C.surface, borderRadius: 16, padding: 18, gap: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:     { fontSize: 15, fontWeight: '700', color: C.text },
  cardSub:       { fontSize: 12, color: C.textSub, marginTop: -8 },
  timeline:      { gap: 0 },
  step:          { flexDirection: 'row', gap: 14 },
  stepLeft:      { alignItems: 'center', width: 32 },
  stepDot:       { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepLine:      { width: 2, flex: 1, backgroundColor: C.border, marginVertical: 4 },
  stepBody:      { flex: 1, paddingBottom: 18, paddingTop: 4, gap: 6 },
  stepLabel:     { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 18 },
  stepDone:      { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stepDoneText:  { fontSize: 11, fontWeight: '700' },
  outcomeCard:   { backgroundColor: C.successLight, borderRadius: 16, padding: 24, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#BBF7D0' },
  outcomeIcon:   { width: 56, height: 56, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: C.success, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  outcomeTitle:  { fontSize: 18, fontWeight: '800', color: C.success },
  outcomeSub:    { fontSize: 13, color: '#166534', textAlign: 'center', lineHeight: 20 },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon:      { width: 38, height: 38, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoLabel:     { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  infoDesc:      { fontSize: 12, color: C.textSub },
  divider:       { height: 1, backgroundColor: C.border },
});
