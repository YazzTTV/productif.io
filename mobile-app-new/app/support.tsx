import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ: FaqItem[] = [
  {
    question: "Comment démarrer ?",
    answer: "Créez vos projets et tâches depuis l'onglet Projets/Tâches, puis utilisez le Timer et les Habitudes pour suivre votre progression.",
  },
  {
    question: "Comment récupérer mon API Token ?",
    answer: "Allez dans Plus > Assistant IA et générez un token. Copiez-le pour vos intégrations.",
  },
  {
    question: "Je ne vois pas mes données sur le dashboard",
    answer: "Assurez-vous d'être à la bonne date et que vos actions (tâche terminée, habitude cochée) ont bien été sauvegardées.",
  },
];

export default function SupportScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const openMail = async () => {
    const url = 'mailto:support@productif.io?subject=Support%20Productif.io';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Info', "Impossible d'ouvrir l'e-mail. Écrivez à support@productif.io");
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'ouvrir l'e-mail");
    }
  };

  const openWhatsApp = async () => {
    const url = 'https://wa.me/33783642205?text=Bonjour%20Productif';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Info', "Impossible d'ouvrir WhatsApp. Écrivez-nous sur support@productif.io");
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'ouvrir WhatsApp");
    }
  };

  const openDocs = async () => {
    const url = 'https://www.productif.io';
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'ouvrir le site");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aide & Support</Text>
        <Text style={styles.subtitle}>FAQ et contact</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQ</Text>
          <View style={styles.card}>
            {FAQ.map((item, idx) => (
              <View key={idx} style={styles.faqItem}>
                <TouchableOpacity style={styles.faqHeader} onPress={() => setOpenIndex(openIndex === idx ? null : idx)}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Ionicons name={openIndex === idx ? 'chevron-up' : 'chevron-down'} size={18} color="#6b7280" />
                </TouchableOpacity>
                {openIndex === idx && (
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10b981' }]} onPress={openMail}>
              <Ionicons name="mail" size={18} color="#fff" />
              <Text style={styles.actionText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#25D366' }]} onPress={openWhatsApp}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.actionText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3b82f6' }]} onPress={openDocs}>
              <Ionicons name="globe" size={18} color="#fff" />
              <Text style={styles.actionText}>Site</Text>
            </TouchableOpacity>
          </View>
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
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', paddingHorizontal: 20, marginBottom: 12 },
  card: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 12, overflow: 'hidden', padding: 12 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 8 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQuestion: { fontSize: 15, fontWeight: '600', color: '#111827' },
  faqAnswer: { marginTop: 8, color: '#6b7280', lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, flex: 1, justifyContent: 'center' },
  actionText: { color: '#fff', fontWeight: '600' },
});
