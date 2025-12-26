import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
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
import { router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { signInWithGoogle } from '@/lib/googleAuth';
import { authService } from '@/lib/api';

// Particule animée avec cleanup approprié
const AnimatedParticle = ({ index }: { index: number }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.2);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const randomDelay = Math.random() * 2000;
    const randomDuration = 3000 + Math.random() * 2000;

    timeoutRef.current = setTimeout(() => {
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

    // Cleanup: annuler le timeout et les animations
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
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

export default function ConnectionScreen() {
  const { t } = useLanguage();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const benefits = [
    { icon: '🤖', text: t('aiAssistantBenefit') },
    { icon: '🔥', text: t('trackHabitsBenefit') },
    { icon: '📊', text: t('advancedAnalyticsBenefit') },
    { icon: '🏆', text: t('competeFriendsBenefit') },
    { icon: '☁️', text: t('syncDevicesBenefit') },
  ];

  const handleGoogleSignup = async () => {
    if (!isMountedRef.current) return;
    setIsLoadingGoogle(true);
    
    try {
      // Lancer le flux OAuth Google
      const googleResult = await signInWithGoogle();
      
      if (!isMountedRef.current) return;
      
      // Envoyer les tokens au backend pour créer le compte
      const response = await authService.loginWithGoogle(
        googleResult.accessToken,
        googleResult.idToken,
        googleResult.user.email,
        googleResult.user.name
      );
      
      if (!isMountedRef.current) return;
      
      if (response.success) {
        // Compte créé/connecté, continuer l'onboarding
        router.replace('/(onboarding-new)/building-plan');
      } else {
        Alert.alert('Erreur', 'Échec de la création du compte avec Google');
      }
      
    } catch (error) {
      console.error('Erreur Google signup:', error);
      if (error instanceof Error && error.message.includes('annulée')) {
        // Ne pas afficher d'alerte si l'utilisateur a annulé
        return;
      }
      if (isMountedRef.current) {
        Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingGoogle(false);
      }
    }
  };

  const handleConnect = (provider: string) => {
    if (provider === 'Login') {
      router.push('/login');
    } else if (provider === 'Google') {
      handleGoogleSignup();
    } else {
      // Email, Apple -> Inscription
      router.push('/signup');
    }
  };

  const handleSkip = () => {
    // Skip to building plan (for testing)
    router.push('/(onboarding-new)/building-plan');
  };

  return (
    <View style={styles.container}>
      {/* Particules animées en arrière-plan */}
      <View style={styles.particlesContainer}>
        {[...Array(15)].map((_, i) => (
          <AnimatedParticle key={i} index={i} />
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec logo et titre */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.header}>
          <LinearGradient
            colors={['#00C27A', '#00D68F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientTitle}
          >
            <Text style={styles.titleGradient}>Productif.io</Text>
          </LinearGradient>
          
          {/* Sparkles */}
          <Text style={[styles.sparkle, styles.sparkle1]}>✨</Text>
          <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Text style={styles.subtitle}>{t('connectionTitle')}</Text>
          <Text style={styles.description}>{t('connectionSubtitle')}</Text>
        </Animated.View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          {benefits.map((benefit, index) => (
            <Animated.View
              key={benefit.text}
              entering={FadeInDown.delay(400 + index * 100).duration(600)}
            >
              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Section Création de compte */}
        <Animated.View
          entering={FadeInDown.delay(900).duration(600)}
          style={styles.createAccountSection}
        >
          <Text style={styles.sectionTitle}>{t('joinElite')}</Text>
          <Text style={styles.sectionSubtitle}>{t('freeTrialNoCC')}</Text>

          {/* Bouton Email - CTA principal */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleConnect('Email')}
            style={styles.buttonSpacing}
          >
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Ionicons name="mail" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{t('continueWithEmail')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Bouton Apple */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleConnect('Apple')}
            style={[styles.secondaryButton, styles.appleButton, styles.buttonSpacing]}
          >
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            <Text style={styles.appleButtonText}>{t('continueWithApple')}</Text>
          </TouchableOpacity>

          {/* Bouton Google */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleConnect('Google')}
            style={[styles.secondaryButton, styles.googleButton]}
            disabled={isLoadingGoogle}
          >
            {isLoadingGoogle ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text style={styles.googleButtonText}>{t('continueWithGoogle')}</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Divider */}
        <Animated.View entering={FadeInDown.delay(1100).duration(600)} style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('or')}</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Section Connexion */}
        <Animated.View
          entering={FadeInDown.delay(1200).duration(600)}
          style={styles.signInSection}
        >
          <Text style={styles.signInText}>{t('alreadyHaveAccount')}</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleConnect('Login')}
            style={styles.signInButton}
          >
            <Text style={styles.signInButtonText}>{t('logIn')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#00C27A" />
          </TouchableOpacity>
        </Animated.View>

        {/* Padding bottom */}
        <View style={{ height: 60 }} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 60,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  gradientTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  titleGradient: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 24,
  },
  sparkle1: {
    top: -8,
    right: -16,
  },
  sparkle2: {
    bottom: -8,
    left: -16,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  benefitIcon: {
    fontSize: 20,
  },
  benefitText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  createAccountSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonSpacing: {
    marginBottom: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  appleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  signInSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00C27A',
  },
  signInButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C27A',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

