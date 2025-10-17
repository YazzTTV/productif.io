import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const QUESTIONS = [
  { q: "Qu'est-ce qui vous amène sur l'app ?", a: ["Je veux mieux m'organiser", 'Je me sens débordé', "Je veux mieux suivre mon temps"] },
  { q: 'Depuis combien de temps remettez-vous vos tâches ?', a: ["Je débute", '1-3 mois', '6+ mois', "Plus d'1 an"] },
  { q: 'À quelle fréquence perdez-vous votre focus ?', a: ['Rarement', 'Parfois', 'Souvent', 'Très souvent'] },
  { q: 'Avez-vous un système clair chaque jour ?', a: ['Oui', 'Plus ou moins', 'Non'] },
  { q: "Combien d'heures par semaine perdez-vous en distractions ?", a: ['< 2h', '2-5h', '5-10h', '10h+'] },
  { q: 'Si rien ne change, quelles conséquences dans 3 mois ?', a: ['Je stagne', 'J’accumule du retard', 'Je me démotive', 'Je perds des opportunités'] },
];

export default function SurveyScreen() {
  const [intro, setIntro] = useState(true);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const startSurvey = () => setIntro(false);

  const choose = (i: number) => {
    setScore(score + i);
    if (index < QUESTIONS.length - 1) setIndex(index + 1);
    else router.replace('/onboarding/brand');
  };

  const current = QUESTIONS[index];
  const progress = (index + 1) / QUESTIONS.length;

  if (intro) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.introRoot}>
          <Text style={styles.introTitle}>Réponds au questionnaire pour obtenir ton plan personnalisé pour arrêter de procrastiner.</Text>

          <View style={styles.spacerLarge} />

          <View style={styles.bubbleCol}>
            <View style={styles.logoShadowBig}>
              <View style={styles.logoWrapperBig}>
                <Image source={require('../../assets/images/productif-logo.png')} style={styles.logoImgBig} />
              </View>
            </View>
            <Text style={styles.bubbleTitleCenter}>Quelques questions rapides pour comprendre tes habitudes</Text>
            <View style={styles.metaRowCenterInside}>
              <Ionicons name="time-outline" size={18} color="#10B981" />
              <Text style={styles.metaText}>Temps estimé: 1 minute</Text>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          <TouchableOpacity style={styles.cta} onPress={startSurvey}>
            <Text style={styles.ctaText}>Commencer le test</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.inner}>
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <View style={styles.cardCenter}>
          <Text style={styles.step}>Étape {index + 1}/{QUESTIONS.length}</Text>
          <Text style={styles.title}>{current.q}</Text>
          <View style={{ width: '100%', marginTop: 12 }}>
            {current.a.map((label, i) => (
              <TouchableOpacity key={i} style={styles.option} onPress={() => choose(i)}>
                <Text style={styles.optionText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helper}>Ce questionnaire va te permettre d’identifier où tu perds le plus de temps et comment Productif.io peut t’aider à reprendre le contrôle.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  inner: { flex: 1, padding: 24 },
  introRoot: { flex: 1, padding: 24 },
  cardCenter: { backgroundColor: '#fff', padding: 24, borderRadius: 20, width: '100%', alignItems: 'center', justifyContent: 'center' },
  introTitle: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center', marginTop: 8 },
  spacerLarge: { height: 36 },
  bubbleCol: { marginTop: 0, backgroundColor: '#ECFEF5', borderWidth: 1, borderColor: '#10B981', borderRadius: 16, padding: 20, alignItems: 'center', gap: 10 },
  bubbleTitleCenter: { color: '#065F46', fontWeight: '700', textAlign: 'center' },
  logoShadowBig: { width: 112, height: 112, borderRadius: 56, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  logoWrapperBig: { width: '100%', height: '100%', borderRadius: 56, backgroundColor: '#ffffff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  logoImgBig: { width: 84, height: 84, resizeMode: 'contain' },
  metaRowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaRowCenterInside: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: '#374151' },
  progressBarWrap: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 999, overflow: 'hidden', marginBottom: 16 },
  progressBarFill: { height: '100%', backgroundColor: '#10B981' },
  step: { color: '#6B7280', alignSelf: 'flex-start' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 6, textAlign: 'center' },
  option: { backgroundColor: '#ECFEF5', borderWidth: 1, borderColor: '#10B981', borderRadius: 12, padding: 14, marginTop: 10 },
  optionText: { color: '#065F46', textAlign: 'center', fontWeight: '600' },
  helper: { color: '#374151', marginTop: 12, textAlign: 'center' },
  cta: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 14, alignItems: 'center', alignSelf: 'stretch' },
  ctaText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
