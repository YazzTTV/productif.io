import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';

// Particule animée
const AnimatedParticle = ({ index }: { index: number }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    const randomDelay = Math.random() * 2000;
    const randomDuration = 3000 + Math.random() * 2000;

    setTimeout(() => {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-30, { duration: randomDuration }),
          withTiming(0, { duration: randomDuration })
        ),
        -1,
        false
      );

      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: randomDuration }),
          withTiming(0.2, { duration: randomDuration })
        ),
        -1,
        false
      );
    }, randomDelay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const randomLeft = `${Math.random() * 100}%`;
  const randomTop = `${Math.random() * 100}%`;

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
        {
          left: randomLeft,
          top: randomTop,
        },
      ]}
    />
  );
};

export default function IntroScreen() {
  const { t } = useLanguage();
  
  return (
    <View style={styles.container}>
      {/* Particules animées en arrière-plan */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, i) => (
          <AnimatedParticle key={i} index={i} />
        ))}
      </View>

      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Logo / Icône */}
        <Animated.View
          entering={FadeIn.delay(200).duration(600).springify()}
          style={styles.logoContainer}
        >
          <View style={styles.logoBox}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          </View>
        </Animated.View>

        {/* Titre */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text style={styles.title}>Productif.io</Text>
        </Animated.View>

        {/* Sous-titre */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <Text style={styles.subtitle}>
            {t('introSubtitle')}
          </Text>
        </Animated.View>

        {/* Bouton CTA */}
        <Animated.View
          entering={FadeInDown.delay(1200).duration(600)}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/(onboarding-new)/language')}
          >
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>{t('letsGo')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Texte d'information */}
        <Animated.View entering={FadeInDown.delay(1400).duration(600)}>
          <Text style={styles.infoText}>{t('takesLessMinutes')}</Text>
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
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 194, 122, 0.2)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    padding: 14,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  ctaButton: {
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
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

