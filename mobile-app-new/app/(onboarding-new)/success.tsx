import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/lib/api';
import { useOnboardingData } from '@/hooks/useOnboardingData';
import { useSuperwall } from '@/hooks/useSuperwall';
import { SUPERWALL_EVENTS } from '@/lib/superwallEvents';
import { setTutorialCompleted, setTutorialStage } from '@/tutorial/tutorialStorage';
import { trackEvent } from '@/lib/analytics';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function SuccessScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { saveResponse } = useOnboardingData();
  const { triggerEvent } = useSuperwall();
  const [firstName, setFirstName] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  // Animation pour les cercles concentriques
  const outerScale = useSharedValue(0);
  const middleScale = useSharedValue(0);
  const innerScale = useSharedValue(0);
  const checkmarkOpacity = useSharedValue(0);

  useEffect(() => {
    // Récupérer le firstName depuis les paramètres, AsyncStorage ou l'API
    const loadFirstName = async () => {
      // 1. Vérifier les paramètres
      if (params.firstName) {
        setFirstName(params.firstName as string);
        return;
      }

      // 2. Vérifier AsyncStorage (onboarding)
      const storedFirstName = await AsyncStorage.getItem('onboarding_firstName');
      if (storedFirstName) {
        setFirstName(storedFirstName);
        return;
      }

      // 3. Récupérer depuis l'API si l'utilisateur est connecté
      try {
        const user = await authService.checkAuth();
        if (user?.name) {
          const first = user.name.split(' ')[0];
          setFirstName(first);
        }
      } catch {
        console.log('Impossible de récupérer le nom depuis l\'API');
      }
    };

    loadFirstName();

    // Animer les cercles
    outerScale.value = withDelay(400, withTiming(1, { duration: 500 }));
    middleScale.value = withDelay(500, withTiming(1, { duration: 500 }));
    innerScale.value = withDelay(600, withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.back(1.2)),
    }));
    checkmarkOpacity.value = withDelay(800, withTiming(1, { duration: 300 }));
  }, [params.firstName]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
  }));

  const middleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: middleScale.value }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    opacity: checkmarkOpacity.value,
  }));

  const finishOnboarding = async (
    nextAction: 'start_focus' | 'view_calendar',
    source: string,
  ) => {
    if (isFinishing) return;
    setIsFinishing(true);

    try {
      // saveResponse persiste localement et programme déjà la synchronisation
      // backend. Un forceSync ici envoyait deux fois le même document et pouvait
      // retenir ce bouton jusqu'à 60 secondes.
      await saveResponse('completed', true);
      await AsyncStorage.setItem('onboarding_completed', 'true');
      await setTutorialCompleted(false);
      await setTutorialStage('calendar');
      void trackEvent('onboarding_completed', { next_action: nextAction }).catch((error) => {
        console.error('[Onboarding] Tracking completion impossible:', error);
      });
      await triggerEvent(SUPERWALL_EVENTS.ONBOARDING_COMPLETED, {
        params: { source },
        requireNonPremium: false,
        bypassCooldown: true,
      });
    } catch (error) {
      console.error('[Onboarding] Sortie success dégradée:', error);
    } finally {
      router.replace('/(tabs)');
    }
  };

  const handleStartFocus = () =>
    finishOnboarding('start_focus', 'onboarding_success_start_focus');

  const handleViewCalendar = () =>
    finishOnboarding('view_calendar', 'onboarding_success_view_calendar');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Success animation */}
          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.animationContainer}>
            <View style={styles.circleContainer}>
              {/* Outer ring */}
              <AnimatedView style={[styles.outerCircle, outerStyle]} />
              
              {/* Middle ring */}
              <AnimatedView style={[styles.middleCircle, middleStyle]} />
              
              {/* Inner circle with checkmark */}
              <AnimatedView style={[styles.innerCircle, innerStyle]}>
                <Animated.View style={checkmarkStyle}>
                  <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                </Animated.View>
              </AnimatedView>
            </View>
          </Animated.View>

          {/* Text content */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.textContainer}>
            <Text style={styles.title}>
              {t('dayIsReady') || 'Your day is ready.'}
            </Text>
            {firstName && (
              <Text style={styles.greeting}>
                {t('welcomeUser', { name: firstName }, `Welcome, ${firstName} 👋`)}
              </Text>
            )}
            <Text style={styles.description}>
              {t('focusWithoutThinking') || 'You can now focus without thinking.'}
            </Text>
          </Animated.View>

          {/* CTAs */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.ctaContainer}>
            <TouchableOpacity
              onPress={handleStartFocus}
              disabled={isFinishing}
              style={styles.primaryButton}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {t('startFocus') || 'Start Focus'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleViewCalendar}
              disabled={isFinishing}
              style={styles.secondaryButton}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={20} color="rgba(0, 0, 0, 0.6)" />
              <Text style={styles.secondaryButtonText}>
                {t('viewInCalendar') || 'View in Calendar'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Free plan indicator */}
          <Animated.View entering={FadeIn.delay(700).duration(400)} style={styles.freePlanContainer}>
            <View style={styles.freePlanBadge}>
              <View style={styles.freePlanDot} />
              <Text style={styles.freePlanText}>
                {t('freePlanActivated') || 'Free plan activated.'}
              </Text>
            </View>
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: 'center',
  },
  animationContainer: {
    marginBottom: 48,
  },
  circleContainer: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerCircle: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  middleCircle: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
  },
  innerCircle: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.03 * 24,
    lineHeight: 28,
  },
  greeting: {
    fontSize: 20,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 48,
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    height: 56,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  freePlanContainer: {
    alignItems: 'center',
  },
  freePlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  freePlanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  freePlanText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
});
