import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  primary:      '#1652F0',
  primaryLight: '#EBF0FE',
  text:         '#0D1421',
  textSub:      '#6B7280',
  bg:           '#FFFFFF',
};

export default function SplashScreen({ navigation, static: isStatic }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5,   useNativeDriver: true }),
    ]).start();

    if (!isStatic) {
      const t = setTimeout(() => navigation?.replace?.('SignIn'), 2200);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconBox}>
          <Ionicons name="shield-checkmark" size={44} color={C.primary} />
        </View>
        <Text style={styles.name}>FraudShield</Text>
        <Text style={styles.tag}>Secure Mobile Money</Text>
      </Animated.View>
      <Text style={styles.footer}>Powered by AI &amp; Blockchain</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', gap: 12 },
  iconBox: { width: 96, height: 96, borderRadius: 28, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  name:    { fontSize: 28, fontWeight: '800', color: C.text },
  tag:     { fontSize: 14, color: C.textSub },
  footer:  { position: 'absolute', bottom: 40, fontSize: 12, color: '#C4C9D4' },
});
