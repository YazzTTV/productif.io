import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { paymentService } from '@/lib/api';

export default function PaymentSheetScreen() {
  const params = useLocalSearchParams();
  const plan = params.plan as 'monthly' | 'annual';
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const billingType = plan === 'annual' ? 'annual' : 'monthly';
      
      // Créer la session Stripe
      const { url } = await paymentService.createCheckoutSession(billingType);
      
      if (!url) {
        throw new Error(t('paymentNoSessionUrl', undefined, 'Aucune URL de session retournée'));
      }

      // Ouvrir Stripe Checkout dans une WebView intégrée
      router.push({
        pathname: '/(onboarding-new)/stripe-webview',
        params: { checkoutUrl: url, plan: plan }
      });
    } catch (error: any) {
      console.error('Erreur lors du paiement:', error);
      
      if (error?.message?.includes('authenticated') || error?.message?.includes('Non authentifié')) {
        Alert.alert(
          t('loginRequiredTitle'),
          t('loginRequiredMessage'),
          [
            { text: t('cancel'), style: 'cancel' },
            { 
              text: t('loginButton'),
              onPress: () => router.push('/login')
            }
          ]
        );
      } else {
        const message = error?.message || t('somethingWentWrong');
        setError(message);
        Alert.alert(t('error'), message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="card" size={60} color="#00C27A" />
          <Text style={styles.title}>{t('paymentFinalizeTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('paymentSubtitle')}
          </Text>
        </View>

        {/* Plan Info */}
        <View style={styles.planBox}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>
              {plan === 'annual' ? t('annualPlan') : t('monthlyPlan')}
            </Text>
            {plan === 'annual' && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>💰 {t('savePerYear')}</Text>
              </View>
            )}
          </View>
          <Text style={styles.planPrice}>
            {plan === 'annual' ? '$9.99' : '$14.99'} {t('perMonth')}
          </Text>
          {plan === 'annual' && (
            <Text style={styles.planBilled}>{t('billedAnnually')}</Text>
          )}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsBox}>
          <Text style={styles.benefitsTitle}>{t('paymentIncluded')}</Text>
          {[
            t('freeTrial'),
            t('cancelAnytime'),
            t('paymentFullAccess'),
            t('paymentUnlimitedAI'),
            t('paymentAdvancedAnalytics'),
            t('paymentPrioritySupport'),
          ].map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color="#00C27A" />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handlePayment}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.checkoutButton, isLoading && styles.checkoutButtonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.checkoutButtonText}>{t('startFreeTrial')}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>{t('skip')}</Text>
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={16} color="#6B7280" />
            <Text style={styles.securityText}>
              {t('paymentSecurityNote')}
            </Text>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  planBox: {
    backgroundColor: 'rgba(0, 194, 122, 0.05)',
    borderWidth: 2,
    borderColor: '#00C27A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  saveBadge: {
    backgroundColor: '#00C27A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  saveText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00C27A',
    marginBottom: 4,
  },
  planBilled: {
    fontSize: 12,
    color: '#6B7280',
  },
  benefitsBox: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#4B5563',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
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
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  securityText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
