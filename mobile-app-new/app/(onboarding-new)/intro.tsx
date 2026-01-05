import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function IntroScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          style={styles.logoContainer}
        >
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(600)}
          style={styles.textContainer}
        >
          <Text style={styles.title}>
            {t('welcomeTitle') || 'You work hard. But without a system.'}
          </Text>
          <Text style={styles.subtitle}>
            {t('welcomeSubtitle') || 'Productif.io helps students turn effort into results — without burnout.'}
          </Text>
        </Animated.View>

        {/* CTAs */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          style={styles.ctaContainer}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(onboarding-new)/language')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {t('getStarted') || 'Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={styles.secondaryButton}
            >
            <Text style={styles.secondaryButtonText}>
              {t('alreadyHaveAccount') || 'I already have an account'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 64,
  },
  logoImage: {
    width: 96,
    height: 96,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.03 * 24,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  ctaContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#16A34A',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
});
