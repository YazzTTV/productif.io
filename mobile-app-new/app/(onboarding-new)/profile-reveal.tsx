import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { onboardingService } from '@/lib/api';
import { paymentService } from '@/lib/api';

export default function ProfileRevealScreen() {
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isLoading, setIsLoading] = useState(false);

  // Profil exemple (devrait être basé sur les réponses du questionnaire)
  const profileType = t('theAmbitiousAchiever');
  const profileEmoji = '💭';
  const description = t('achieverDescription');

  const handleStartTrial = async () => {
    setIsLoading(true);
    
    try {
      const billingType = selectedPlan === 'annual' ? 'annual' : 'monthly';
      
      // Sauvegarder le plan sélectionné dans l'API
      try {
        await onboardingService.saveOnboardingData({
          billingCycle: billingType,
          currentStep: 9, // Étape du paywall
        });
        console.log('✅ Plan sélectionné sauvegardé dans l\'API:', billingType);
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du plan:', error);
        // Ne pas bloquer le flux
      }
      
      // Créer la session Stripe via l'API
      const { url } = await paymentService.createCheckoutSession(billingType);
      
      if (!url) {
        throw new Error('Aucune URL de session retournée');
      }

      // Rediriger directement vers la WebView Stripe
      router.push({
        pathname: '/(onboarding-new)/stripe-webview',
        params: { checkoutUrl: url, plan: selectedPlan }
      });
    } catch (error: any) {
      console.error('Erreur lors de la création de la session Stripe:', error);
      
      // Gérer les erreurs d'authentification
      if (error?.message?.includes('authenticated') || error?.message?.includes('Non authentifié')) {
        Alert.alert(
          'Connexion requise',
          'Vous devez être connecté pour continuer. Veuillez vous connecter ou créer un compte.',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Se connecter', 
              onPress: () => router.push('/login')
            }
          ]
        );
      } else {
        Alert.alert(
          'Erreur',
          error?.message || 'Une erreur est survenue lors de la création de la session de paiement. Veuillez réessayer.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    // Marquer l'onboarding comme terminé dans l'API
    try {
      await onboardingService.saveOnboardingData({
        completed: true,
        currentStep: 10, // Étape finale
      });
      console.log('✅ Onboarding marqué comme terminé dans l\'API');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      // Ne pas bloquer le flux
    }
    
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Confetti Effect */}
      <View style={styles.confettiContainer}>
        {[...Array(30)].map((_, i) => (
          <Animated.View
            key={i}
            entering={FadeIn.delay(i * 20).duration(2000)}
            style={[
              styles.confetti,
              {
                left: `${Math.random() * 100}%`,
              },
            ]}
          >
            <Text style={styles.confettiText}>
              {['🎉', '✨', '🚀', '💚', '⭐'][Math.floor(Math.random() * 5)]}
            </Text>
          </Animated.View>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Badge */}
        <Animated.View entering={FadeIn.delay(300).springify()} style={styles.successBadge}>
          <View style={styles.checkmarkCircle}>
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              style={styles.checkmarkGradient}
            >
              <Text style={styles.checkmark}>✓</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Profile Type */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <Text style={styles.label}>{t('yourProductivityProfile')}</Text>
          <View style={styles.profileTypeContainer}>
            <Text style={styles.profileType}>{profileType}</Text>
            <Text style={styles.profileEmoji}>{profileEmoji}</Text>
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(700).duration(600)}>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        </Animated.View>

        {/* Transformation Stats */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)}>
          <View style={styles.statsContainer}>
            <View style={[styles.statBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Text style={styles.statValue}>+87%</Text>
              <Text style={styles.statLabel}>{t('focus')}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>3.2x</Text>
              <Text style={styles.statLabel}>{t('tasks')}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
              <Text style={[styles.statValue, { color: '#A855F7' }]}>-64%</Text>
              <Text style={styles.statLabel}>{t('stress')}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Pricing Section */}
        <Animated.View entering={FadeInDown.delay(900).duration(600)}>
          <Text style={styles.pricingTitle}>{t('choosePlan')}</Text>

          {/* Annual Plan - Highlighted */}
          <TouchableOpacity
            onPress={() => setSelectedPlan('annual')}
            style={[styles.planButton, styles.annualPlan]}
            activeOpacity={0.8}
          >
            <View style={styles.bestValueBadge}>
              <LinearGradient
                colors={['#00C27A', '#00D68F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bestValueGradient}
              >
                <Text style={styles.bestValueText}>⭐ {t('bestValue')}</Text>
              </LinearGradient>
            </View>

            <View style={styles.planContent}>
              <View style={styles.planLeft}>
                <Text style={styles.planName}>{t('annualPlan')}</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveText}>💰 {t('savePerYear')}</Text>
                </View>
              </View>
              <View style={styles.planRight}>
                <View style={styles.priceBox}>
                  <Text style={styles.price}>$9.99</Text>
                  <Text style={styles.priceUnit}>{t('perMonth')}</Text>
                  <Text style={styles.priceBilled}>{t('billedAnnually')}</Text>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedPlan === 'annual' && styles.radioButtonSelected,
                ]}>
                  {selectedPlan === 'annual' && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            onPress={() => setSelectedPlan('monthly')}
            style={[
              styles.planButton,
              selectedPlan === 'monthly' && styles.planButtonSelected,
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.planContent}>
              <View style={styles.planLeft}>
                <Text style={styles.planName}>{t('monthlyPlan')}</Text>
                <Text style={styles.planFlexible}>{t('flexibleBilling')}</Text>
              </View>
              <View style={styles.planRight}>
                <View style={styles.priceBox}>
                  <Text style={styles.price}>$14.99</Text>
                  <Text style={styles.priceUnit}>{t('perMonth')}</Text>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedPlan === 'monthly' && styles.radioButtonSelected,
                ]}>
                  {selectedPlan === 'monthly' && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Trial Benefits */}
        <Animated.View entering={FadeInDown.delay(1000).duration(600)}>
          <View style={styles.trialBox}>
            <View style={styles.trialHeader}>
              <Ionicons name="flash" size={20} color="#00C27A" />
              <Text style={styles.trialTitle}>{t('freeTrial')}</Text>
            </View>
            <View style={styles.trialBenefits}>
              <View style={styles.trialBenefit}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.trialBenefitText}>{t('earlyAdopters')}</Text>
              </View>
              <View style={styles.trialBenefit}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.trialBenefitText}>{t('cancelAnytime')}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View entering={FadeInDown.delay(1300).duration(600)} style={styles.ctaContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleStartTrial}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.startTrialButton, isLoading && styles.startTrialButtonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color="#FFFFFF" />
                  <Text style={styles.startTrialText}>{t('startFreeTrial')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>{t('skip')}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1500).duration(600)}>
          <Text style={styles.termsText}>
            {t('agreeTerms')}
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
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    top: -40,
  },
  confettiText: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    zIndex: 10,
  },
  successBadge: {
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  checkmarkGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkmark: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  label: {
    fontSize: 12,
    color: '#00C27A',
    textAlign: 'center',
    marginBottom: 8,
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
    fontWeight: '800',
    color: '#374151',
  },
  profileEmoji: {
    fontSize: 36,
  },
  descriptionBox: {
    backgroundColor: 'rgba(249, 250, 251, 1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  planButton: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
    position: 'relative',
  },
  annualPlan: {
    borderColor: '#00C27A',
    backgroundColor: 'rgba(0, 194, 122, 0.05)',
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  planButtonSelected: {
    borderColor: '#00C27A',
    backgroundColor: 'rgba(0, 194, 122, 0.05)',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -80 }],
    width: 160,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bestValueGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
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
    marginTop: 8,
  },
  planLeft: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  saveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  saveText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  planFlexible: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#374151',
  },
  priceUnit: {
    fontSize: 10,
    color: '#6B7280',
  },
  priceBilled: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#00C27A',
    borderColor: '#00C27A',
  },
  trialBox: {
    backgroundColor: 'rgba(0, 194, 122, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 122, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
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
    color: '#374151',
  },
  trialBenefits: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  trialBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkIcon: {
    color: '#00C27A',
    fontSize: 14,
  },
  trialBenefitText: {
    fontSize: 12,
    color: '#6B7280',
  },
  ctaContainer: {
    gap: 12,
    marginBottom: 12,
  },
  startTrialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  startTrialButtonDisabled: {
    opacity: 0.6,
  },
  startTrialText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  termsText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

