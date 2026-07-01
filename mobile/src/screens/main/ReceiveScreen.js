import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Share, Clipboard, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const C = {
  primary:      '#1652F0',
  primaryLight: '#EBF0FE',
  success:      '#00875A',
  successLight: '#E3F5F0',
  text:         '#0D1421',
  textSub:      '#6B7280',
  textMuted:    '#9CA3AF',
  bg:           '#F5F7FA',
  surface:      '#FFFFFF',
  border:       '#E8ECEF',
};

export default function ReceiveScreen({ navigation }) {
  const { user } = useAuth();
  const phone = user?.phone ?? '';

  function formatDisplay(p) {
    // +233244100001 → 0244 100 001
    if (p.startsWith('+233')) {
      const local = '0' + p.slice(4);
      return local.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return p;
  }

  async function handleCopy() {
    Clipboard.setString(phone);
    Alert.alert('Copied!', 'Your number has been copied to clipboard.');
  }

  async function handleShare() {
    await Share.share({
      message: `Send me money on Telecel Cash: ${formatDisplay(phone)}`,
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive Money</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="arrow-down-outline" size={36} color={C.primary} />
        </View>

        <Text style={styles.label}>Your Telecel Cash Number</Text>

        {/* Phone number display */}
        <View style={styles.phoneBox}>
          <Text style={styles.phoneText}>{formatDisplay(phone)}</Text>
        </View>

        <Text style={styles.hint}>
          Share this number with anyone who wants to send you money. They'll enter it in their FraudShield or Telecel Cash app.
        </Text>

        {/* Action buttons */}
        <TouchableOpacity style={styles.btnPrimary} onPress={handleShare} activeOpacity={0.85}>
          <Ionicons name="share-social-outline" size={20} color="#fff" />
          <Text style={styles.btnPrimaryText}>Share My Number</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={handleCopy} activeOpacity={0.85}>
          <Ionicons name="copy-outline" size={20} color={C.primary} />
          <Text style={styles.btnSecondaryText}>Copy Number</Text>
        </TouchableOpacity>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={16} color={C.success} />
          <Text style={styles.infoText}>
            All incoming transfers are verified by the FraudShield AI before they reach your wallet.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.primary },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:           { padding: 4 },
  headerTitle:       { color: '#fff', fontSize: 17, fontWeight: '700' },
  body:              { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' },
  iconCircle:        { width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  label:             { fontSize: 14, color: C.textSub, fontWeight: '500', marginBottom: 12 },
  phoneBox:          { backgroundColor: C.surface, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 32, borderWidth: 2, borderColor: C.primary, marginBottom: 16, width: '100%', alignItems: 'center' },
  phoneText:         { fontSize: 28, fontWeight: '800', color: C.primary, letterSpacing: 1 },
  hint:              { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  btnPrimary:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, width: '100%', marginBottom: 12 },
  btnPrimaryText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSecondary:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 14, paddingVertical: 16, width: '100%', borderWidth: 1.5, borderColor: C.primary, marginBottom: 24 },
  btnSecondaryText:  { color: C.primary, fontSize: 16, fontWeight: '700' },
  infoCard:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.successLight, borderRadius: 12, padding: 14, width: '100%' },
  infoText:          { flex: 1, fontSize: 12, color: C.success, lineHeight: 18 },
});
