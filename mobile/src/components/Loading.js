import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export default function Loading({ message = 'Loading…' }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color="#4338ca" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  text: { fontSize: 13, color: '#94a3b8' },
});
