import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SurveyScreen() {
  const { t } = useLanguage();
  const QUESTIONS = [
    { q: t('legacySurveyQ1', undefined, "Qu'est-ce qui vous amène sur l'app ?"), a: [t('legacySurveyQ1A1', undefined, 'Je veux mieux m\'organiser'), t('legacySurveyQ1A2', undefined, 'Je me sens débordé'), t('legacySurveyQ1A3', undefined, 'Je veux mieux suivre mon temps')] },
    { q: t('legacySurveyQ2', undefined, 'Depuis combien de temps remettez-vous vos tâches ?'), a: [t('legacySurveyQ2A1', undefined, 'Je débute'), t('legacySurveyQ2A2', undefined, '1-3 mois'), t('legacySurveyQ2A3', undefined, '6+ mois'), t('legacySurveyQ2A4', undefined, "Plus d'1 an")] },
    { q: t('legacySurveyQ3', undefined, 'À quelle fréquence perdez-vous votre focus ?'), a: [t('legacySurveyQ3A1', undefined, 'Rarement'), t('legacySurveyQ3A2', undefined, 'Parfois'), t('legacySurveyQ3A3', undefined, 'Souvent'), t('legacySurveyQ3A4', undefined, 'Très souvent')] },
    { q: t('legacySurveyQ4', undefined, 'Avez-vous un système clair chaque jour ?'), a: [t('legacySurveyQ4A1', undefined, 'Oui'), t('legacySurveyQ4A2', undefined, 'Plus ou moins'), t('legacySurveyQ4A3', undefined, 'Non')] },
    { q: t('legacySurveyQ5', undefined, "Combien d'heures par semaine perdez-vous en distractions ?"), a: [t('legacySurveyQ5A1', undefined, '< 2h'), t('legacySurveyQ5A2', undefined, '2-5h'), t('legacySurveyQ5A3', undefined, '5-10h'), t('legacySurveyQ5A4', undefined, '10h+')] },
    { q: t('legacySurveyQ6', undefined, 'Si rien ne change, quelles conséquences dans 3 mois ?'), a: [t('legacySurveyQ6A1', undefined, 'Je stagne'), t('legacySurveyQ6A2', undefined, 'J’accumule du retard'), t('legacySurveyQ6A3', undefined, 'Je me démotive'), t('legacySurveyQ6A4', undefined, 'Je perds des opportunités')] },
  ];
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
          <Text style={styles.introTitle}>{t('legacySurveyIntroTitle', undefined, 'Réponds au questionnaire pour obtenir ton plan personnalisé pour arrêter de procrastiner.')}</Text>

          <View style={styles.spacerLarge} />

          <View style={styles.bubbleCol}>
            <View style={styles.logoShadowBig}>
              <View style={styles.logoWrapperBig}>
                <Image source={require('../../assets/images/productif-logo.png')} style={styles.logoImgBig} />
              </View>
              </View>
              <Text style={styles.bubbleTitleCenter}>{t('legacySurveyBubbleTitle', undefined, 'Quelques questions rapides pour comprendre tes habitudes')}</Text>
              <View style={styles.metaRowCenterInside}>
                <Ionicons name="time-outline" size={18} color="#10B981" />
                <Text style={styles.metaText}>{t('legacySurveyBubbleMeta', undefined, 'Temps estimé: 1 minute')}</Text>
              </View>
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity style={styles.cta} onPress={startSurvey}>
              <Text style={styles.ctaText}>{t('legacySurveyStart', undefined, 'Commencer le test')}</Text>
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
          <Text style={styles.step}>{t('legacySurveyStep', { current: index + 1, total: QUESTIONS.length }, `Étape ${index + 1}/${QUESTIONS.length}`)}</Text>
          <Text style={styles.title}>{current.q}</Text>
          <View style={{ width: '100%', marginTop: 12 }}>
            {current.a.map((label, i) => (
              <TouchableOpacity key={i} style={styles.option} onPress={() => choose(i)}>
                <Text style={styles.optionText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helper}>{t('legacySurveyHelper', undefined, 'Ce questionnaire va te permettre d’identifier où tu perds le plus de temps et comment Productif.io peut t’aider à reprendre le contrôle.')}</Text>
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
