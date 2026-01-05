import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';

interface WelcomeProps {
  onStart: () => void;
  onLogin: () => void;
}

export function Welcome({ onStart, onLogin }: WelcomeProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.delay(100).duration(600)} style={styles.content}>
        {/* Logo */}
        <Animated.View 
          entering={FadeIn.delay(200).duration(500)}
          style={styles.logoContainer}
        >
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>P</Text>
          </View>
        </Animated.View>

        {/* Text */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(500)}
          style={styles.textContainer}
        >
          <Text style={styles.title}>{t('welcomeTitle')}</Text>
          <Text style={styles.subtitle}>{t('welcomeSubtitle')}</Text>
        </Animated.View>

        {/* CTAs */}
        <Animated.View 
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.ctaContainer}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onStart}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{t('getStarted')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>{t('alreadyHaveAccount')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 64,
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 64,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -1,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 15,
  },
});

