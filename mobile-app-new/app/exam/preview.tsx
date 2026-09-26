import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { getExamAccess, freeSessionsLeftLabel } from '@/utils/premium';
import { useSuperwall } from '@/hooks/useSuperwall';
import { SUPERWALL_EVENTS } from '@/lib/superwallEvents';

/**
 * Présentation payante du Mode Examen. Depuis la 1.5, on n'y arrive plus que
 * sans accès : ni premium, ni séance offerte restante.
 *
 * DÉMO DE 5 MIN RETIRÉE (décision du 25 septembre, lot mobile 3). Elle lançait
 * une session SANS blocage, et chaque compte gratuit a désormais de vraies
 * séances offertes AVEC blocage : la démo montrait une version appauvrie de ce
 * que l'étudiant a déjà eu, et elle aurait remplacé le paywall au moment exact
 * où il doit revenir, la 3e séance. Le code des démos reste dans `session.tsx`
 * pour une démo encore en cours au moment de la mise à jour, et `afterDemo`
 * reste géré ici pour la même raison.
 */
export default function ExamPreviewScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<{ afterDemo?: string; reason?: string; at?: string }>();
  const insets = useSafeAreaInsets();
  const { triggerEvent } = useSuperwall();
  const afterDemoTokenHandledRef = useRef<string | null>(null);
  const quotaTokenHandledRef = useRef<string | null>(null);
  // null tant que le serveur n'a pas répondu, ou pour un serveur antérieur à la 1.5.
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);
  const quotaExhausted = params.reason === 'quota_exhausted';

  const openExamSuperwall = useCallback(
    async (source: string) => {
      await triggerEvent(SUPERWALL_EVENTS.FEATURE_LOCKED, {
        params: { source },
        bypassCooldown: true,
      });
    },
    [triggerEvent],
  );
  // `triggerEvent` change à chaque rendu, donc `openExamSuperwall` aussi. En
  // dépendance d'un effet à minuterie, le moindre re-rendu (celui du nombre de
  // séances restantes, par exemple) annulait la minuterie et le paywall ne
  // s'ouvrait jamais. Les effets passent par cette référence.
  const openExamSuperwallRef = useRef(openExamSuperwall);
  openExamSuperwallRef.current = openExamSuperwall;

  /**
   * Un abonné n'a rien à faire sur l'écran de démonstration payante.
   *
   * Sert aussi de rattrapage : `preview` est la première route déclarée du
   * groupe `exam`, et une navigation vers `/exam/setup` qui n'aboutirait pas
   * atterrirait ici. Sans ce test, un abonné se retrouverait devant le paywall
   * sans aucun moyen de lancer sa session. Ne se déclenche pas au retour d'une
   * démo, où l'écran doit rester pour présenter l'offre.
   */
  const accessRedirectRef = useRef(false);
  useEffect(() => {
    // Une seule tentative par montage. `setup` renvoie ici quand l'accès est
    // refusé, et cet effet renvoie là-bas quand il est accordé : les deux
    // conditions sont complémentaires, mais si une réponse d'API incohérente
    // les faisait diverger, on resterait bloqué dans un aller-retour. Au pire
    // l'utilisateur reste sur cet écran, il ne boucle pas.
    if (accessRedirectRef.current) return;
    accessRedirectRef.current = true;
    let cancelled = false;
    (async () => {
      const access = await getExamAccess();
      if (cancelled) return;
      setFreeRemaining(access.premium ? null : access.freeRemaining);
      // Premium, ou séance offerte restante : l'écran de lancement. Pas au
      // retour d'une démo ni après un refus de quota, où l'écran doit rester
      // pour présenter l'offre.
      if (access.canStart && !params.afterDemo && !quotaExhausted) {
        router.replace('/exam/setup');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.afterDemo, quotaExhausted, router]);

  /**
   * Le serveur vient de refuser une 3e séance : c'est le moment où le paywall
   * revient (spec 1.5, section 3). Jeton `at` : un seul affichage par refus.
   */
  useEffect(() => {
    if (!quotaExhausted) return;
    const token = params.at ?? 'once';
    if (quotaTokenHandledRef.current === token) return;
    quotaTokenHandledRef.current = token;
    setFreeRemaining(0);
    const timer = setTimeout(() => {
      openExamSuperwallRef.current('exam_quota_exhausted');
    }, 400);
    return () => clearTimeout(timer);
  }, [quotaExhausted, params.at]);

  useEffect(() => {
    const token = params.afterDemo;
    if (!token) return;
    if (afterDemoTokenHandledRef.current === token) return;
    afterDemoTokenHandledRef.current = token;
    const t = setTimeout(() => {
      openExamSuperwallRef.current('exam_preview_after_demo');
    }, 400);
    return () => clearTimeout(t);
  }, [params.afterDemo]);

  const handleUnlock = () => {
    openExamSuperwall('exam_preview_unlock_button');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('examMode')}</Text>
            <Text style={styles.headerSubtitle}>{t('preview') || 'Preview'}</Text>
          </View>
          <View style={styles.backButton} />
        </Animated.View>

        {/* Preview Content */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.previewSection}>
          <Text style={styles.previewTitle}>{t('whatIsExamMode')}</Text>
          <Text style={styles.previewDescription}>
            {t('examModeDescription')}
          </Text>
        </Animated.View>

        {/* Demo Timer */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.demoSection}>
          <View style={styles.demoTimerCard}>
            <Text style={styles.demoTimerLabel}>{t('demoTimer')}</Text>
            <Text style={styles.demoTimerValue}>45:00</Text>
            <Text style={styles.demoTimerNote}>{t('staticPreview') || 'Static preview - timer doesn\'t run'}</Text>
          </View>
        </Animated.View>

        {/* Sample Task Card */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.demoSection}>
          <View style={styles.taskCard}>
            <Text style={styles.taskCardLabel}>{t('sampleTask')}</Text>
            <Text style={styles.taskCardTitle}>{t('sampleTaskTitle')}</Text>
            <Text style={styles.taskCardSubject}>{t('sampleTaskSubject')}</Text>
            <View style={styles.lockedOverlay}>
              <Ionicons name="lock-closed" size={24} color="rgba(0, 0, 0, 0.4)" />
              <Text style={styles.lockedText}>{t('taskChainingLocked') || 'Task chaining locked'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Locked Features */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>{t('premiumFeatures')}</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={20} color="rgba(0, 0, 0, 0.4)" />
            <Text style={styles.featureText}>{t('automaticTaskChaining') || 'Automatic task chaining'}</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={20} color="rgba(0, 0, 0, 0.4)" />
            <Text style={styles.featureText}>{t('pressurePacingAnalytics') || 'Pressure pacing & analytics'}</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={20} color="rgba(0, 0, 0, 0.4)" />
            <Text style={styles.featureText}>{t('fullSessionHistory') || 'Full session history'}</Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.ctaSection}>
          {freeRemaining === 0 ? (
            <Text style={styles.freeUsedText}>
              {freeSessionsLeftLabel(t, 0)}{' '}
              {t(
                'examFreeUsedPreviewHint',
                undefined,
                "Avec Premium, chaque séance bloque tes applis, et le blocage se lance tout seul à l'heure de ton planning."
              )}
            </Text>
          ) : null}
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={handleUnlock}
            activeOpacity={0.8}
          >
            <Text style={styles.unlockButtonText}>{t('unlockExamMode')}</Text>
          </TouchableOpacity>
          
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 4,
  },
  previewSection: {
    marginBottom: 32,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  previewDescription: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 24,
  },
  demoSection: {
    marginBottom: 24,
  },
  demoTimerCard: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  demoTimerLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 8,
  },
  demoTimerValue: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  demoTimerNote: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  taskCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    position: 'relative',
  },
  taskCardLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 8,
  },
  taskCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  taskCardSubject: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  lockedText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  ctaSection: {
    gap: 12,
  },
  freeUsedText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  unlockButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 24,
  },
  paywallButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  paywallButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

