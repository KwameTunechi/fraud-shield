import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function FraudScenarioScreen({ route, navigation }) {
  const { scenario } = route.params;
  const [runningStep, setRunningStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!started) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 600, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
      ])
    ).start();

    let step = 0;
    const interval = setInterval(() => {
      if (step < scenario.steps.length) {
        setRunningStep(step);
        step++;
      } else {
        clearInterval(interval);
        setDone(true);
        pulseAnim.stopAnimation();
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [started]);

  const isBlocked = scenario.outcome === 'blocked';
  const outcomeColor = isBlocked ? '#dc2626' : '#d97706';
  const outcomeBg = isBlocked ? '#fef2f2' : '#fffbeb';

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1e3a8a', '#4338ca']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.icon}>{scenario.icon}</Text>
        <Text style={styles.headerTitle}>{scenario.title}</Text>
        <View style={[styles.severityBadge, { backgroundColor: scenario.color + '33' }]}>
          <Text style={[styles.severityText, { color: scenario.color }]}>{scenario.severity.toUpperCase()} SEVERITY</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.descCard, { backgroundColor: scenario.bgColor, borderColor: scenario.borderColor }]}>
          <Text style={styles.descText}>{scenario.description}</Text>
        </View>

        {!started && (
          <TouchableOpacity onPress={() => setStarted(true)}>
            <LinearGradient colors={[scenario.color, scenario.color + 'cc']} style={styles.startBtn}>
              <Text style={styles.startBtnText}>▶  Run Simulation</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {started && (
          <View style={styles.stepsSection}>
            <Text style={styles.stepsTitle}>🔁 Simulation in Progress</Text>
            {scenario.steps.map((s, i) => {
              const revealed = i <= runningStep;
              const active = i === runningStep && !done;
              return (
                <Animated.View key={i} style={[styles.step, revealed && styles.stepRevealed, { transform: active ? [{ scale: pulseAnim }] : [] }]}>
                  <View style={[styles.stepNum, revealed && styles.stepNumActive]}>
                    <Text style={[styles.stepNumText, revealed && styles.stepNumTextActive]}>
                      {revealed ? (i < runningStep || done ? '✓' : '…') : i + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepText, revealed && styles.stepTextActive]}>{s}</Text>
                </Animated.View>
              );
            })}
          </View>
        )}

        {done && (
          <View style={[styles.outcomeCard, { backgroundColor: outcomeBg, borderColor: scenario.borderColor }]}>
            <Text style={styles.outcomeIcon}>{isBlocked ? '🛡️' : '🔍'}</Text>
            <Text style={[styles.outcomeTitle, { color: outcomeColor }]}>{scenario.outcome_text}</Text>
            <Text style={styles.outcomeDesc}>
              {isBlocked
                ? 'The FraudShield AI + MFA system detected and blocked this attack before any funds were compromised. An incident report has been logged to the blockchain ledger.'
                : 'The AI model flagged this as a high-probability fraud attempt. The user was warned and the suspicious activity was logged to the immutable blockchain audit trail.'}
            </Text>
            <View style={styles.outcomeStats}>
              <View style={styles.stat}>
                <Text style={styles.statVal}>🤖</Text>
                <Text style={styles.statLabel}>AI Detected</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statVal}>🔗</Text>
                <Text style={styles.statLabel}>Blockchain Logged</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statVal}>📊</Text>
                <Text style={styles.statLabel}>Admin Alerted</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <LinearGradient colors={['#4338ca', '#0d9488']} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>Back to Security Centre</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center', gap: 8 },
  back: { alignSelf: 'flex-start', marginBottom: 4 },
  backText: { color: '#a5b4fc', fontSize: 14 },
  icon: { fontSize: 48 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  severityBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  severityText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  descCard: { borderRadius: 14, padding: 16, borderWidth: 1.5 },
  descText: { fontSize: 14, color: '#374151', lineHeight: 21 },
  startBtn: { borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  stepsSection: { gap: 10 },
  stepsTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', opacity: 0.4 },
  stepRevealed: { opacity: 1, borderColor: '#4338ca', backgroundColor: '#eff6ff' },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepNumActive: { backgroundColor: '#4338ca' },
  stepNumText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  stepNumTextActive: { color: '#fff' },
  stepText: { flex: 1, fontSize: 13, color: '#94a3b8', lineHeight: 19 },
  stepTextActive: { color: '#1e3a8a', fontWeight: '600' },
  outcomeCard: { borderRadius: 18, padding: 20, alignItems: 'center', gap: 14, borderWidth: 1.5 },
  outcomeIcon: { fontSize: 52 },
  outcomeTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  outcomeDesc: { fontSize: 13, color: '#374151', textAlign: 'center', lineHeight: 20 },
  outcomeStats: { flexDirection: 'row', gap: 20 },
  stat: { alignItems: 'center', gap: 4 },
  statVal: { fontSize: 24 },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textAlign: 'center' },
  doneBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
