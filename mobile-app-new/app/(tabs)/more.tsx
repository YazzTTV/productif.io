import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { authService, User } from '@/lib/api';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const { width } = Dimensions.get('window');

// Composant de shimmer animé avec cleanup approprié
const ShimmerEffect = () => {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(width * 2, { duration: 3000 }),
        withTiming(-width, { duration: 0 })
      ),
      -1,
      false
    );
    
    // Cleanup: annuler l'animation au démontage
    return () => {
      cancelAnimation(translateX);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        },
        animatedStyle,
      ]}
    />
  );
};

export default function SettingsScreen() {
  const { theme, setTheme: setThemeContext, actualTheme, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadUserData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await authService.checkAuth();
      if (!isMountedRef.current) return;
      setUser(userData);
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Éviter les doubles appels
    
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              // Nettoyer la session d'abord
              await authService.logout();
              // Supprimer le flag d'onboarding pour forcer la redirection vers l'intro
              await AsyncStorage.removeItem('onboarding_completed');
              // Naviguer vers le nouveau formulaire de connexion
              router.replace('/(onboarding-new)/connection');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              // Même en cas d'erreur, nettoyer et rediriger
              await AsyncStorage.removeItem('onboarding_completed');
              router.replace('/(onboarding-new)/connection');
              if (isMountedRef.current) {
                setIsLoggingOut(false);
              }
            }
          },
        },
      ]
    );
  };

  const resetOnboarding = async () => {
    Alert.alert(
      t('resetOnboarding'),
      t('resetOnboardingConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reset'),
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('onboarding_completed');
              router.replace('/(onboarding-new)/intro');
            } catch (error) {
              console.error('Erreur lors de la réinitialisation de l\'onboarding:', error);
              Alert.alert(t('error'), t('resetOnboardingError'));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#00C27A" />
        <Text style={[styles.loadingText, { color: colors.text }]}>{t('loading')}</Text>
      </View>
    );
  }

  const userName = user?.name || t('user');
  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>{t('settings')}</Text>
        </Animated.View>

        {/* Account Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>{t('accountUpper')}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.profileSection}>
              <LinearGradient
                colors={['#00C27A', '#00D68F']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{userInitial}</Text>
              </LinearGradient>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>{userName}</Text>
                <Text style={styles.profileEmail}>{userEmail}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.settingButton}
              onPress={() => router.push('/parametres')}
            >
              <View style={styles.settingButtonLeft}>
                <Ionicons name="person" size={24} color="#00C27A" />
                <Text style={[styles.settingButtonText, { color: colors.text }]}>{t('profileSettings')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Premium Elite Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.premiumCard}>
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumGradient}
            >
              <ShimmerEffect />
              
              {/* Badge Elite */}
              <View style={styles.eliteBadge}>
                <Text style={styles.eliteEmoji}>👑</Text>
                <Text style={styles.eliteBadgeText}>{t('eliteAccess')}</Text>
              </View>

              <View style={styles.premiumContent}>
                <View style={styles.premiumHeader}>
                  <Text style={styles.premiumTitle}>{t('premiumElite')}</Text>
                  <Text style={styles.premiumEmoji}>✨</Text>
                </View>
                <Text style={styles.premiumSubtitle}>{t('premiumSubtitle')}</Text>

                {/* Billing Toggle */}
                <View style={styles.billingToggle}>
                  <TouchableOpacity
                    onPress={() => setBillingPeriod('monthly')}
                    style={[
                      styles.billingButton,
                      billingPeriod === 'monthly' && styles.billingButtonActive,
                    ]}
                  >
                    <Text style={[
                      styles.billingButtonText,
                      billingPeriod === 'monthly' && styles.billingButtonTextActive,
                    ]}>
                      {t('billingMonthly')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setBillingPeriod('annual')}
                    style={[
                      styles.billingButton,
                      billingPeriod === 'annual' && styles.billingButtonActive,
                    ]}
                  >
                    <Text style={[
                      styles.billingButtonText,
                      billingPeriod === 'annual' && styles.billingButtonTextActive,
                    ]}>
                      {t('billingAnnual')}
                    </Text>
                    {billingPeriod !== 'annual' && (
                      <View style={styles.saveBadge}>
                        <Text style={styles.saveBadgeText}>-20%</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Savings Info */}
                {billingPeriod === 'annual' && (
                  <Animated.View entering={FadeInDown.duration(300)} style={styles.savingsInfo}>
                    <Text style={styles.savingsEmoji}>🎉</Text>
                    <View style={styles.savingsText}>
                      <Text style={styles.savingsAmount}>{t('savePerYearAmount')}</Text>
                      <Text style={styles.savingsDetail}>{t('savePercentage')}</Text>
                    </View>
                    <View style={styles.bestDealBadge}>
                      <Text style={styles.bestDealText}>{t('bestDeal')}</Text>
                    </View>
                  </Animated.View>
                )}

                {/* Limited Spots */}
                <View style={styles.limitedSpots}>
                  <Text style={styles.limitedSpotsText}>{t('limitedSpots')}</Text>
                  <Text style={styles.limitedSpotsEmoji}>🔥</Text>
                </View>
                <View style={styles.spotsBar}>
                  {[...Array(10)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.spotsDot,
                        i < 7 && styles.spotsDotFilled,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.limitedSpotsSubtext}>{t('limitedSpotsSubtext')}</Text>

                {/* Features */}
                <View style={styles.features}>
                  {[t('feature1'), t('feature2'), t('feature3')].map((feature, i) => (
                    <View key={i} style={styles.feature}>
                      <Text style={styles.featureCheck}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Pricing */}
                <View style={styles.pricing}>
                  <Text style={styles.price}>
                    {billingPeriod === 'monthly' ? '14,99€' : '9,99€'}
                  </Text>
                  <Text style={styles.priceUnit}>{t('pricePerMonth')}</Text>
                </View>
                {billingPeriod === 'annual' && (
                  <Text style={styles.pricingDetail}>{t('annualBilled')}</Text>
                )}
                {billingPeriod === 'monthly' && (
                  <Text style={styles.pricingDetail}>{t('monthlyBilling')}</Text>
                )}

                {/* CTA Button */}
                <TouchableOpacity
                  style={styles.ctaButton}
                  activeOpacity={0.8}
                  onPress={() => router.push('/upgrade')}
                >
                  <Text style={styles.ctaText}>
                    {billingPeriod === 'monthly' 
                      ? t('ctaMonthly')
                      : t('ctaAnnual')}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.offerExpires}>
                  ⏰ {billingPeriod === 'monthly' 
                    ? t('offerExpireMonthly')
                    : t('offerExpireAnnual')}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Text style={styles.sectionTitle}>{t('preferencesUpper')}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Theme Selector */}
            <View style={styles.preferenceSection}>
              <View style={styles.preferenceHeader}>
                <Ionicons name="color-palette" size={24} color="#00C27A" />
                <Text style={[styles.preferenceTitle, { color: colors.text }]}>{t('theme')}</Text>
              </View>
              <View style={styles.themeButtons}>
                <TouchableOpacity
                  onPress={() => setThemeContext('light')}
                  style={[
                    styles.themeButton,
                    theme === 'light' && styles.themeButtonActive,
                  ]}
                >
                  <Ionicons 
                    name="sunny" 
                    size={18} 
                    color={theme === 'light' ? '#00C27A' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.themeButtonText,
                    theme === 'light' && styles.themeButtonTextActive,
                  ]}>
                    {t('light')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setThemeContext('dark')}
                  style={[
                    styles.themeButton,
                    theme === 'dark' && styles.themeButtonActive,
                  ]}
                >
                  <Ionicons 
                    name="moon" 
                    size={18} 
                    color={theme === 'dark' ? '#00C27A' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.themeButtonText,
                    theme === 'dark' && styles.themeButtonTextActive,
                  ]}>
                    {t('dark')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setThemeContext('system')}
                  style={[
                    styles.themeButton,
                    theme === 'system' && styles.themeButtonActive,
                  ]}
                >
                  <Ionicons 
                    name="phone-portrait" 
                    size={18} 
                    color={theme === 'system' ? '#00C27A' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.themeButtonText,
                    theme === 'system' && styles.themeButtonTextActive,
                  ]}>
                    {t('system')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Language Selector */}
            <View style={[styles.preferenceSection, styles.preferenceBorder]}>
              <View style={styles.preferenceHeader}>
                <Ionicons name="language" size={24} color="#00C27A" />
                <Text style={[styles.preferenceTitle, { color: colors.text }]}>{t('language')}</Text>
              </View>
              <View style={styles.languageButtons}>
                <TouchableOpacity
                  onPress={() => setLanguage('fr')}
                  style={[
                    styles.languageButton,
                    language === 'fr' && styles.languageButtonActive,
                  ]}
                >
                  <Text style={[
                    styles.languageButtonText,
                    language === 'fr' && styles.languageButtonTextActive,
                  ]}>
                    🇫🇷 {t('french')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLanguage('en')}
                  style={[
                    styles.languageButton,
                    language === 'en' && styles.languageButtonActive,
                  ]}
                >
                  <Text style={[
                    styles.languageButtonText,
                    language === 'en' && styles.languageButtonTextActive,
                  ]}>
                    🇬🇧 {t('english')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLanguage('es')}
                  style={[
                    styles.languageButton,
                    language === 'es' && styles.languageButtonActive,
                  ]}
                >
                  <Text style={[
                    styles.languageButtonText,
                    language === 'es' && styles.languageButtonTextActive,
                  ]}>
                    🇪🇸 {t('spanish')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications */}
            <View style={[styles.preferenceSection, styles.preferenceBorder]}>
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceLeft}>
                  <Ionicons name="notifications" size={24} color="#00C27A" />
                  <Text style={[styles.preferenceTitle, { color: colors.text }]}>{t('notifications')}</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#D1D5DB', true: '#00C27A' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <TouchableOpacity
                style={styles.settingButton}
                onPress={() => router.push('/notifications')}
              >
                <View style={styles.settingButtonLeft}>
                  <Ionicons name="alarm" size={24} color="#00C27A" />
                  <View style={styles.settingButtonContent}>
                    <Text style={[styles.settingButtonText, { color: colors.text }]}>
                      {t('remindersAndSchedules')}
                    </Text>
                    <Text style={styles.settingButtonSubtext}>
                      {t('remindersSubtitle')}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Analytics */}
            <TouchableOpacity
              style={[styles.settingButton, styles.settingButtonBorder]}
              onPress={() => router.push('/analytics')}
            >
              <View style={styles.settingButtonLeft}>
                <Ionicons name="bar-chart" size={24} color="#00C27A" />
                <Text style={[styles.settingButtonText, { color: colors.text }]}>{t('detailedStats')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Reset Onboarding */}
            <TouchableOpacity
              style={styles.settingButton}
              onPress={resetOnboarding}
            >
              <View style={styles.settingButtonLeft}>
                <Ionicons name="refresh" size={24} color="#F59E0B" />
                <View style={styles.settingButtonContent}>
                  <Text style={[styles.settingButtonText, { color: colors.text }]}>
                    {t('resetOnboarding')}
                  </Text>
                  <Text style={styles.settingButtonSubtext}>
                    {t('resetOnboardingSubtitle')}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Help & Support Section */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Text style={styles.sectionTitle}>{t('helpSupportUpper')}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.settingButton, styles.settingButtonBorder]}
              onPress={() => router.push('/support')}
            >
              <View style={styles.settingButtonLeft}>
                <Ionicons name="help-circle" size={24} color="#00C27A" />
                <Text style={[styles.settingButtonText, { color: colors.text }]}>{t('helpSupport')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => router.push('/about')}
            >
              <View style={styles.settingButtonLeft}>
                <Ionicons name="shield-checkmark" size={24} color="#00C27A" />
                <Text style={[styles.settingButtonText, { color: colors.text }]}>{t('termsPrivacy')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out" size={24} color="#EF4444" />
            <Text style={styles.logoutText}>{t('disconnectButton')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom Padding */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  settingButtonBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingButtonContent: {
    flex: 1,
  },
  settingButtonSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  premiumCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  premiumGradient: {
    padding: 24,
    position: 'relative',
  },
  eliteBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  eliteEmoji: {
    fontSize: 16,
  },
  eliteBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  premiumContent: {
    zIndex: 10,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  premiumEmoji: {
    fontSize: 24,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  billingButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  billingButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  billingButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  billingButtonTextActive: {
    color: '#00C27A',
    fontWeight: '600',
  },
  saveBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FCD34D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00C27A',
  },
  savingsInfo: {
    backgroundColor: 'rgba(252, 211, 77, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 77, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savingsEmoji: {
    fontSize: 24,
  },
  savingsText: {
    flex: 1,
  },
  savingsAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  savingsDetail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bestDealBadge: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestDealText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00C27A',
  },
  limitedSpots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  limitedSpotsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  limitedSpotsEmoji: {
    fontSize: 18,
  },
  spotsBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  spotsDot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  spotsDotFilled: {
    backgroundColor: '#FFFFFF',
  },
  limitedSpotsSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  features: {
    marginBottom: 20,
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureCheck: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  pricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceUnit: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  pricingDetail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00C27A',
  },
  offerExpires: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  preferenceSection: {
    padding: 20,
  },
  preferenceBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  themeButtonActive: {
    borderColor: '#00C27A',
    backgroundColor: 'rgba(0, 194, 122, 0.05)',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  themeButtonTextActive: {
    color: '#00C27A',
    fontWeight: '600',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: '#00C27A',
    backgroundColor: 'rgba(0, 194, 122, 0.05)',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  languageButtonTextActive: {
    color: '#00C27A',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
