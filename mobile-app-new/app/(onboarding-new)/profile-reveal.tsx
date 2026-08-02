import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { onboardingService } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSuperwall } from '@/hooks/useSuperwall';
import { SUPERWALL_EVENTS } from '@/lib/superwallEvents';

export default function ProfileRevealScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { triggerEvent } = useSuperwall();
  const [isLoading, setIsLoading] = useState(false);

  // Profil exemple
  const profileType = t('theAmbitiousAchiever') || 'The Ambitious Achiever';
  const profileEmoji = '💭';
  const description = t('achieverDescription') || 'You have big goals and work hard to achieve them. With the right system, you can accomplish even more.';

  const handleStartTrial = async () => {
    setIsLoading(true);

    try {
      // L'onboarding est marqué terminé AVANT le paywall : si l'utilisateur
      // ferme le paywall sans acheter, il arrive quand même dans l'app en
      // plan gratuit au lieu de rester bloqué sur cet écran.
      try {
        await onboardingService.saveOnboardingData({
          completed: true,
          currentStep: 10,
        });
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de l\'onboarding:', error);
      }

      await AsyncStorage.setItem('onboarding_completed', 'true');

      // Prix, offres et éligibilité à l'essai sont pilotés par Superwall.
      await triggerEvent(SUPERWALL_EVENTS.CAMPAIGN_TRIGGER, {
        params: { source: 'onboarding_profile_reveal' },
        requireNonPremium: false,
        bypassCooldown: true,
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'affichage du paywall:', error);
    } finally {
      setIsLoading(false);
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    try {
      await onboardingService.saveOnboardingData({
        completed: true,
        currentStep: 10,
      });
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
    
    await AsyncStorage.setItem('onboarding_completed', 'true');
    await triggerEvent(SUPERWALL_EVENTS.ONBOARDING_COMPLETED, {
      params: { source: 'profile_reveal_skip' },
      requireNonPremium: false,
      bypassCooldown: true,
    });
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Badge */}
        <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.successBadge}>
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={40} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Profile Type */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.label}>
            {t('yourProductivityProfile') || 'Your productivity profile'}
          </Text>
          <View style={styles.profileTypeContainer}>
            <Text style={styles.profileType}>{profileType}</Text>
            <Text style={styles.profileEmoji}>{profileEmoji}</Text>
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>+87%</Text>
              <Text style={styles.statLabel}>{t('focus') || 'Focus'}</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxBlue]}>
              <Text style={[styles.statValue, styles.statValueBlue]}>3.2x</Text>
              <Text style={styles.statLabel}>{t('tasks') || 'Tasks'}</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxPurple]}>
              <Text style={[styles.statValue, styles.statValuePurple]}>-64%</Text>
              <Text style={styles.statLabel}>{t('stress') || 'Stress'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Ce que fait le système. Pas de prix ici : c'est Superwall qui les
            porte, et lui seul connaît l'éligibilité réelle à l'essai. */}
        <Animated.View entering={FadeInDown.delay(700).duration(400)}>
          <View style={styles.trialBox}>
            <View style={styles.trialHeader}>
              <Ionicons name="flash" size={20} color="#16A34A" />
              <Text style={styles.trialTitle}>
                {t('notAboutMotivation', undefined, "Ce n'est pas une question de motivation")}
              </Text>
            </View>
            <View style={styles.trialBenefits}>
              <View style={styles.trialBenefit}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={styles.trialBenefitText}>
                  {t('planBuildsItself', undefined, 'Ton planning se construit tout seul')}
                </Text>
              </View>
              <View style={styles.trialBenefit}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={styles.trialBenefitText}>
                  {t('phoneBlocksItself', undefined, "Ton téléphone se bloque jusqu'à la fin du bloc")}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.ctaContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleStartTrial}
            disabled={isLoading}
            style={[styles.startTrialButton, isLoading && styles.buttonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color="#FFFFFF" />
                <Text style={styles.startTrialText}>
                  {t('unlockProductif', undefined, 'Débloquer productif.io')}
                </Text>
                </>
              )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>{t('skip') || 'Skip for now'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(900).duration(400)}>
          <Text style={styles.termsText}>
            {t('agreeTerms') || 'By continuing, you agree to our Terms of Service'}
          </Text>
        </Animated.View>
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  successBadge: {
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#16A34A',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  profileTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  profileType: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.03 * 24,
  },
  profileEmoji: {
    fontSize: 32,
  },
  descriptionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 22,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statBoxBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  statBoxPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 4,
  },
  statValueBlue: {
    color: '#3B82F6',
  },
  statValuePurple: {
    color: '#A855F7',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.03 * 20,
  },
  planButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
    position: 'relative',
  },
  planButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bestValueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLeft: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  saveBadge: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  saveText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
  },
  planFlexible: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  planRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  priceUnit: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  trialBox: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  trialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  trialBenefits: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  trialBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trialBenefitText: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  ctaContainer: {
    gap: 12,
    marginBottom: 16,
  },
  startTrialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    height: 56,
    borderRadius: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  startTrialText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  termsText: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
