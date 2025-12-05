import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { paymentService } from '@/lib/api';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const billingType = selectedPlan === 'annual' ? 'annual' : 'monthly';
      const { url } = await paymentService.createCheckoutSession(billingType);
      
      if (url) {
        // Rediriger vers la WebView Stripe
        router.push({
          pathname: '/(onboarding-new)/stripe-webview',
          params: { checkoutUrl: url, plan: selectedPlan }
        });
        onClose();
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la session Stripe:', error);
      Alert.alert(
        'Erreur',
        error?.message || 'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header avec gradient */}
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              style={styles.header}
            >
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.headerTitle}>
                {t('trialExpiredTitle')}
              </Text>
              <Text style={styles.headerSubtitle}>
                {t('trialExpiredSubtitle')}
              </Text>
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
              {/* Features */}
              <View style={styles.featuresContainer}>
                <Animated.View entering={FadeInDown.delay(100)} style={styles.feature}>
                  <View style={[styles.featureIcon, { backgroundColor: '#00C27A20' }]}>
                    <Ionicons name="checkmark-circle" size={24} color="#00C27A" />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>
                      {t('upgradeFeature1')}
                    </Text>
                    <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                      {t('upgradeFeature1Desc')}
                    </Text>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200)} style={styles.feature}>
                  <View style={[styles.featureIcon, { backgroundColor: '#00C27A20' }]}>
                    <Ionicons name="checkmark-circle" size={24} color="#00C27A" />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>
                      {t('upgradeFeature2')}
                    </Text>
                    <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                      {t('upgradeFeature2Desc')}
                    </Text>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300)} style={styles.feature}>
                  <View style={[styles.featureIcon, { backgroundColor: '#00C27A20' }]}>
                    <Ionicons name="checkmark-circle" size={24} color="#00C27A" />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>
                      {t('upgradeFeature3')}
                    </Text>
                    <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                      {t('upgradeFeature3Desc')}
                    </Text>
                  </View>
                </Animated.View>
              </View>

              {/* Pricing highlight */}
              <Animated.View entering={FadeInDown.delay(400)} style={[styles.pricingCard, { backgroundColor: '#00C27A10', borderColor: '#00C27A30' }]}>
                <View style={styles.pricingHeader}>
                  <Text style={[styles.pricingLabel, { color: colors.text }]}>
                    {t('annualPlan')}
                  </Text>
                  <View style={styles.pricingAmount}>
                    <Text style={[styles.pricingPrice, { color: colors.text }]}>9,99€</Text>
                    <Text style={[styles.pricingPeriod, { color: colors.textSecondary }]}>
                      / {t('month')}
                    </Text>
                  </View>
                </View>
                <View style={styles.pricingBadge}>
                  <Ionicons name="flash" size={16} color="#00C27A" />
                  <Text style={styles.pricingBadgeText}>
                    {t('save60PerYear')}
                  </Text>
                </View>
              </Animated.View>

              {/* Actions */}
              <Animated.View entering={FadeInDown.delay(500)} style={styles.actions}>
                <TouchableOpacity
                  onPress={handleUpgrade}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#00C27A', '#00D68F']}
                    style={styles.upgradeButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.upgradeButtonText}>
                        {t('chooseMyPlan')}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onClose}
                  style={styles.laterButton}
                >
                  <Text style={[styles.laterButtonText, { color: colors.textSecondary }]}>
                    {t('later')}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                {t('cancelAnytime')}
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width - 40,
    maxHeight: '90%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 32,
    paddingTop: 48,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  pricingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pricingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  pricingAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pricingPeriod: {
    fontSize: 14,
    marginLeft: 4,
  },
  pricingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pricingBadgeText: {
    fontSize: 14,
    color: '#00C27A',
    fontWeight: '500',
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  upgradeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 14,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

