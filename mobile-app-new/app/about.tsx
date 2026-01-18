import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';

const APP_VERSION = '1.0.0';

export default function AboutScreen() {
  const { t } = useLanguage();
  const openTerms = async () => {
    try { await Linking.openURL('https://www.productif.io/terms'); } catch { Alert.alert(t('legacyOpenPageErrorTitle'), t('legacyOpenPageErrorMessage')); }
  };
  const openPrivacy = async () => {
    try { await Linking.openURL('https://www.productif.io/privacy-policy'); } catch { Alert.alert(t('legacyOpenPageErrorTitle'), t('legacyOpenPageErrorMessage')); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('legacyAboutTitle')}</Text>
        <Text style={styles.subtitle}>{t('legacyAboutSubtitle')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Productif.io</Text>
          <Text style={styles.cardSubtitle}>{t('legacyVersionLabel', { version: APP_VERSION })}</Text>
          <Text style={styles.paragraph}>{t('legacyAboutDescription')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('legacyUsefulLinks')}</Text>
          <TouchableOpacity style={styles.linkRow} onPress={openTerms}>
            <Ionicons name="document-text" size={18} color="#6b7280" />
            <Text style={styles.linkText}>{t('legacyTerms')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={openPrivacy}>
            <Ionicons name="shield-checkmark" size={18} color="#6b7280" />
            <Text style={styles.linkText}>{t('legacyPrivacy')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  content: { flex: 1 },
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16, borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2, marginBottom: 8 },
  paragraph: { color: '#374151', lineHeight: 20 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  linkText: { color: '#111827', fontWeight: '500' },
});
