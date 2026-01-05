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
  Easing,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/lib/api';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function SuccessScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { saveResponse, forceSync } = useOnboardingData();
  const [firstName, setFirstName] = useState('');

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
      } catch (error) {
        console.log('Impossible de récupérer le nom depuis l\'API');
      }
    };

    loadFirstName();

    // Animer les cercles
    outerScale.value = withTiming(1, { duration: 500, delay: 400 });
    middleScale.value = withTiming(1, { duration: 500, delay: 500 });
    innerScale.value = withTiming(1, { 
      duration: 500, 
      delay: 600,
      easing: Easing.out(Easing.back(1.2)),
    });
    checkmarkOpacity.value = withTiming(1, { duration: 300, delay: 800 });
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

  const handleStartFocus = async () => {
    // Marquer l'onboarding comme terminé
    await saveResponse('completed', true);
    await forceSync(); // Forcer la synchronisation finale avec le backend
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(tabs)');
  };

  const handleViewCalendar = () => {
    // TODO: Ouvrir le calendrier natif ou l'app
    router.replace('/(tabs)');
  };

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
          <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.textContainer}>
            <Text style={styles.title}>
              {t('dayIsReady') || 'Your day is ready.'}
            </Text>
            {firstName && (
              <Text style={styles.greeting}>
                Welcome, {firstName} 👋
              </Text>
            )}
            <Text style={styles.description}>
              {t('focusWithoutThinking') || 'You can now focus without thinking.'}
            </Text>
          </Animated.View>

          {/* CTAs */}
          <Animated.View entering={FadeInDown.delay(1000).duration(400)} style={styles.ctaContainer}>
            <TouchableOpacity
              onPress={handleStartFocus}
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
          <Animated.View entering={FadeIn.delay(1200).duration(400)} style={styles.freePlanContainer}>
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

