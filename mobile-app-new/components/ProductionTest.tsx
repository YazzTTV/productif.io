import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export default function ProductionTest() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Productif.io 🚀
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Application mobile native
      </ThemedText>
      <View style={styles.content}>
        <ThemedText style={styles.description}>
          Bienvenue dans votre application de productivité !
        </ThemedText>
        <ThemedText style={styles.features}>
          ✅ Gestion des tâches{'\n'}
          ⏰ Suivi du temps{'\n'}
          🎯 Objectifs{'\n'}
          📊 Analytiques{'\n'}
          🏆 Gamification
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#22c55e', // Couleur verte de la marque
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    opacity: 0.8,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  features: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'left',
  },
});
