import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paymentService } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaywallProps {
  onClose?: () => void;
  source?: string; // Pour tracker d'où vient le paywall
}

export function Paywall({ onClose, source }: PaywallProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (plan: 'annual' | 'monthly') => {
    setSelectedPlan(plan);
    setIsLoading(true);
    try {
      const billingType = plan === 'annual' ? 'annual' : 'monthly';
      const { url } = await paymentService.createCheckoutSession(billingType);
      
      if (url) {
        // Rediriger vers la WebView Stripe
        router.push({
          pathname: '/(onboarding-new)/stripe-webview',
          params: { checkoutUrl: url, plan }
        });
        onClose?.();
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la session Stripe:', error);
      Alert.alert(
        t('error'),
        error?.message || t('somethingWentWrong')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueFree = () => {
    onClose?.();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };

  const premiumFeatures = [
    t('unlimitedFocusSessions') || 'Unlimited Focus sessions',
    t('examMode'),
    t('planMyDayAI') || 'Plan My Day with AI',
    t('smartTaskPrioritization') || 'Smart task prioritization',
    t('fullHabitTracking') || 'Full habit tracking',
    t('progressAnalytics') || 'Progress & analytics',
    t('calendarSync') || 'Calendar sync',
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.closeButtonContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose || handleContinueFree}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="rgba(0, 0, 0, 0.6)" />
          </TouchableOpacity>
        </Animated.View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Title */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.titleSection}>
            <Text style={styles.title}>{t('upgradeToPremium')}</Text>
            <Text style={styles.subtitle}>{t('unlockFullExperience') || 'Unlock the full Productif.io experience'}</Text>
          </Animated.View>

          {/* Premium Features */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.featuresSection}>
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Pricing Buttons */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.pricingSection}>
            {/* YEARLY PLAN - PRIMARY */}
            <TouchableOpacity
              style={[styles.planButton, styles.planButtonPrimary]}
              onPress={() => handleUpgrade('annual')}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading && selectedPlan === 'annual' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.planPricePrimary}>€3.33 {t('perMonth')}</Text>
                  <Text style={styles.planSubtextPrimary}>
                    {t('billedPerYear') || 'Billed €39.97 per year (–60%)'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* MONTHLY PLAN - SECONDARY */}
            <TouchableOpacity
              style={[styles.planButton, styles.planButtonSecondary]}
              onPress={() => handleUpgrade('monthly')}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading && selectedPlan === 'monthly' ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.planPriceSecondary}>€7.99 {t('perMonth')}</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.footerSection}>
            <Text style={styles.footerText}>{t('cancelAnytime') || 'Cancel anytime'}</Text>
            
            <TouchableOpacity
              onPress={handleContinueFree}
              activeOpacity={0.7}
            >
              <Text style={styles.continueFreeText}>{t('continueFree') || 'Continue with free version'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
    paddingBottom: 40,
  },
  closeButtonContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
  featuresSection: {
    width: '100%',
    marginBottom: 32,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.8)',
    flex: 1,
  },
  pricingSection: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  planButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planButtonPrimary: {
    backgroundColor: '#16A34A',
    gap: 4,
  },
  planButtonSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    backgroundColor: 'transparent',
    height: 56,
  },
  planPricePrimary: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  planSubtextPrimary: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  planPriceSecondary: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  footerSection: {
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  continueFreeText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
});

